package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.PagoSenaDto.PreferenciaPagoResponse;
import com.saasturnos.backend.application.dto.PagoSenaDto.ResultadoProcesamientoWebhook;
import com.saasturnos.backend.application.dto.TurnoDto.TurnoResponse;
import com.saasturnos.backend.domain.exception.BusinessRuleException;
import com.saasturnos.backend.domain.model.PagoSena;
import com.saasturnos.backend.domain.model.PagoSena.EstadoPago;
import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.EstadoTurno;
import com.saasturnos.backend.infrastructure.repository.PagoSenaRepository;
import com.saasturnos.backend.infrastructure.repository.TurnoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.saasturnos.backend.application.service.DisponibilidadService.ZONA_ARGENTINA;

@Service
public class MercadoPagoService {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoService.class);
    private static final String MP_API_BASE = "https://api.mercadopago.com";

    private final TurnoRepository turnoRepository;
    private final PagoSenaRepository pagoSenaRepository;
    private final TransactionTemplate transactionTemplate;
    private final RestClient restClient;
    private final String accessToken;
    private final String notificationUrl;
    private final String frontendUrl;

    public MercadoPagoService(
            TurnoRepository turnoRepository,
            PagoSenaRepository pagoSenaRepository,
            TransactionTemplate transactionTemplate,
            @Value("${mercadopago.access-token:TEST-TOKEN-DEV}") String accessToken,
            @Value("${mercadopago.notification-url:http://localhost:8080/api/v1/pagos/mercadopago/webhook}") String notificationUrl,
            @Value("${cors.allowed-origins:http://localhost:5173}") String allowedOrigins
    ) {
        this.turnoRepository = turnoRepository;
        this.pagoSenaRepository = pagoSenaRepository;
        this.transactionTemplate = transactionTemplate;
        this.accessToken = accessToken;
        this.notificationUrl = notificationUrl;
        this.frontendUrl = allowedOrigins.split(",")[0].trim();
        this.restClient = RestClient.builder().baseUrl(MP_API_BASE).build();
    }

    /**
     * Crea una preferencia en Mercado Pago Checkout Pro.
     * Nota de Arquitectura: La llamada HTTP externa a Mercado Pago se realiza FUERA
     * de la transacción de base de datos para no retener conexiones del pool JDBC.
     */
    public PreferenciaPagoResponse crearPreferenciaSena(String codigoReserva) {
        // 1. Lectura rápida en transacción corta
        DatosTurnoParaPreferencia datos = transactionTemplate.execute(status -> {
            Turno t = turnoRepository.findByCodigoReserva(codigoReserva.trim().toUpperCase())
                    .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado con código: " + codigoReserva));

            if (t.getEstado() != EstadoTurno.PENDIENTE_PAGO) {
                throw new BusinessRuleException("El turno no se encuentra pendiente de pago de seña (Estado actual: " + t.getEstado() + ").");
            }

            OffsetDateTime ahora = OffsetDateTime.now(ZONA_ARGENTINA);
            if (t.getExpiraEn() != null && t.getExpiraEn().isBefore(ahora)) {
                t.expirarPorFaltaDePago();
                turnoRepository.save(t);
                throw new BusinessRuleException("El tiempo para abonar la seña de este turno ha expirado. Por favor realizá una nueva reserva.");
            }

            return new DatosTurnoParaPreferencia(
                    t.getId(),
                    t.getCodigoReserva(),
                    t.getServicio().getId(),
                    t.getServicio().getNombre(),
                    t.getNegocio().getId(),
                    t.getNegocio().getNombre(),
                    t.getClienteNombre(),
                    t.getClienteEmail(),
                    t.getMontoSenaAcordado(),
                    t.getExpiraEn()
            );
        });

        // 2. Invocación HTTP externa a Mercado Pago (o generación Sandbox si no hay token productivo)
        PreferenciaCreadaExternal prefExterna = invocarApiPreferenciaMercadoPago(datos);

        // 3. Persistir registro de preferencia en PagoSena en transacción corta
        transactionTemplate.executeWithoutResult(status -> {
            Turno turnoRef = turnoRepository.getReferenceById(datos.turnoId());
            PagoSena pago = pagoSenaRepository.findByMpPreferenceId(prefExterna.preferenceId())
                    .map(existente -> {
                        existente.actualizarDatosPreferencia(turnoRef, prefExterna.preferenceId(), datos.montoSena());
                        return existente;
                    })
                    .orElseGet(() -> PagoSena.crearPreferenciaPendiente(turnoRef, prefExterna.preferenceId(), datos.montoSena()));
            pagoSenaRepository.save(pago);
        });

        return new PreferenciaPagoResponse(
                datos.turnoId(),
                datos.codigoReserva(),
                prefExterna.preferenceId(),
                prefExterna.initPoint(),
                prefExterna.sandboxInitPoint(),
                datos.montoSena(),
                datos.expiraEn(),
                prefExterna.modoSandbox()
        );
    }

    /**
     * Procesa de manera IDEMPOTENTE y ATÓMICA un pago notificado por el Webhook de Mercado Pago.
     * Sólo acredita la seña y cambia el estado del turno a SENADO cuando el estado es 'approved'.
     */
    public ResultadoProcesamientoWebhook procesarNotificacionWebhook(String paymentId, String xRequestId) {
        // 1. Chequeo rápido de idempotencia antes de llamar a la API externa
        Boolean yaProcesado = transactionTemplate.execute(status ->
                pagoSenaRepository.existsByMpPaymentId(paymentId)
        );

        if (Boolean.TRUE.equals(yaProcesado)) {
            log.info("Webhook idempotente: el paymentId {} ya fue procesado anteriormente. Ignorando duplicado.", paymentId);
            return new ResultadoProcesamientoWebhook(false, true, paymentId, "ALREADY_PROCESSED", null);
        }

        // 2. Consultar estado real del pago en la API de Mercado Pago (fuera de @Transactional)
        DetallesPagoMercadoPago detallesPago = consultarPagoEnMercadoPago(paymentId);

        // 3. Aplicar cambios de estado de forma atómica con bloqueo optimista (@Version)
        return procesarPagoConfirmadoEnTransaccion(
                paymentId,
                xRequestId,
                detallesPago.status(),
                detallesPago.externalReference(),
                detallesPago.transactionAmount()
        );
    }

    /**
     * Método transaccional interno que ejecuta la transición a SENADO únicamente si el estado es 'approved'.
     */
    public ResultadoProcesamientoWebhook procesarPagoConfirmadoEnTransaccion(
            String paymentId,
            String xRequestId,
            String statusPagoMp,
            String codigoReserva,
            BigDecimal montoPagado
    ) {
        return transactionTemplate.execute(txStatus -> {
            // Doble verificación de idempotencia dentro de la transacción
            if (pagoSenaRepository.existsByMpPaymentId(paymentId)) {
                return new ResultadoProcesamientoWebhook(false, true, paymentId, statusPagoMp, codigoReserva);
            }

            Turno turno = turnoRepository.findByCodigoReserva(codigoReserva.trim().toUpperCase())
                    .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado para external_reference: " + codigoReserva));

            PagoSena registroPago = PagoSena.registrarNotificacionWebhook(
                    turno,
                    paymentId,
                    xRequestId,
                    montoPagado,
                    OffsetDateTime.now(ZONA_ARGENTINA)
            );

            if ("approved".equalsIgnoreCase(statusPagoMp)) {
                // Transición atómica a SENADO (protegida por @Version en Turno y State Pattern)
                turno.acreditarSena(montoPagado);
                turnoRepository.save(turno);

                registroPago.aprobarPago();
            } else if ("rejected".equalsIgnoreCase(statusPagoMp) || "cancelled".equalsIgnoreCase(statusPagoMp)) {
                // Nunca descontar ni confirmar turno en estados fallidos
                registroPago.rechazarPago();
            } else {
                registroPago.mantenerPendiente();
            }

            pagoSenaRepository.save(registroPago);
            return new ResultadoProcesamientoWebhook(true, false, paymentId, statusPagoMp, turno.getCodigoReserva());
        });
    }

    /**
     * Permite simular en entorno de desarrollo/sandbox la aprobación de un pago de Mercado Pago
     * ejecutando exactamente la misma lógica transaccional e idempotente del webhook.
     */
    public TurnoResponse simularPagoSandboxAprobado(String codigoReserva) {
        Turno turno = transactionTemplate.execute(status ->
                turnoRepository.findByCodigoReserva(codigoReserva.trim().toUpperCase())
                        .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado: " + codigoReserva))
        );

        String simulatedPaymentId = "MP-SANDBOX-" + turno.getCodigoReserva() + "-" + System.currentTimeMillis() % 10000;
        String simulatedRequestId = "req-" + UUID.randomUUID();

        procesarPagoConfirmadoEnTransaccion(
                simulatedPaymentId,
                simulatedRequestId,
                "approved",
                turno.getCodigoReserva(),
                turno.getMontoSenaAcordado()
        );

        return transactionTemplate.execute(status -> {
            Turno actualizado = turnoRepository.findById(turno.getId()).orElseThrow();
            return TurnoResponse.fromEntity(actualizado);
        });
    }

    @SuppressWarnings("unchecked")
    private PreferenciaCreadaExternal invocarApiPreferenciaMercadoPago(DatosTurnoParaPreferencia datos) {
        boolean esTokenDesarrollo = accessToken == null
                || accessToken.isBlank()
                || accessToken.startsWith("TEST-TOKEN-DEV")
                || accessToken.startsWith("TEST-0000");

        if (esTokenDesarrollo) {
            String fakePrefId = "PREF-SANDBOX-" + datos.codigoReserva() + "-" + UUID.randomUUID().toString().substring(0, 6);
            String sandboxUrl = frontendUrl + "?sandbox_checkout=" + datos.codigoReserva() + "&pref_id=" + fakePrefId;
            return new PreferenciaCreadaExternal(fakePrefId, sandboxUrl, sandboxUrl, true);
        }

        try {
            Map<String, Object> body = Map.of(
                    "items", List.of(Map.of(
                            "id", String.valueOf(datos.servicioId()),
                            "title", "Seña: " + datos.servicioNombre() + " (" + datos.negocioNombre() + ")",
                            "quantity", 1,
                            "currency_id", "ARS",
                            "unit_price", datos.montoSena()
                    )),
                    "external_reference", datos.codigoReserva(),
                    "notification_url", notificationUrl,
                    "back_urls", Map.of(
                            "success", frontendUrl + "?pago=approved&codigo=" + datos.codigoReserva(),
                            "failure", frontendUrl + "?pago=rejected&codigo=" + datos.codigoReserva(),
                            "pending", frontendUrl + "?pago=pending&codigo=" + datos.codigoReserva()
                    ),
                    "auto_return", "approved",
                    "metadata", Map.of(
                            "turno_id", datos.turnoId(),
                            "codigo_reserva", datos.codigoReserva(),
                            "negocio_id", datos.negocioId()
                    )
            );

            Map<String, Object> response = restClient.post()
                    .uri("/checkout/preferences")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.get("id") != null) {
                String prefId = String.valueOf(response.get("id"));
                String initPoint = String.valueOf(response.get("init_point"));
                String sandboxInitPoint = String.valueOf(response.getOrDefault("sandbox_init_point", initPoint));
                return new PreferenciaCreadaExternal(prefId, initPoint, sandboxInitPoint, false);
            }
            throw new BusinessRuleException("Respuesta inválida de Mercado Pago al crear preferencia.");
        } catch (Exception e) {
            log.warn("Error al conectar con API Mercado Pago ({}), usando fallback Sandbox.", e.getMessage());
            String fallbackPrefId = "PREF-FALLBACK-" + datos.codigoReserva();
            String sandboxUrl = frontendUrl + "?sandbox_checkout=" + datos.codigoReserva();
            return new PreferenciaCreadaExternal(fallbackPrefId, sandboxUrl, sandboxUrl, true);
        }
    }

    @SuppressWarnings("unchecked")
    private DetallesPagoMercadoPago consultarPagoEnMercadoPago(String paymentId) {
        Map<String, Object> response = restClient.get()
                .uri("/v1/payments/{id}", paymentId)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(Map.class);

        if (response == null) {
            throw new BusinessRuleException("No se pudo obtener la información del pago en Mercado Pago: " + paymentId);
        }

        String status = String.valueOf(response.get("status"));
        String externalReference = String.valueOf(response.get("external_reference"));
        BigDecimal transactionAmount = new BigDecimal(String.valueOf(response.get("transaction_amount")));

        return new DetallesPagoMercadoPago(status, externalReference, transactionAmount);
    }

    private record DatosTurnoParaPreferencia(
            Long turnoId,
            String codigoReserva,
            Long servicioId,
            String servicioNombre,
            Long negocioId,
            String negocioNombre,
            String clienteNombre,
            String clienteEmail,
            BigDecimal montoSena,
            OffsetDateTime expiraEn
    ) {}

    private record PreferenciaCreadaExternal(
            String preferenceId,
            String initPoint,
            String sandboxInitPoint,
            boolean modoSandbox
    ) {}

    private record DetallesPagoMercadoPago(
            String status,
            String externalReference,
            BigDecimal transactionAmount
    ) {}
}

