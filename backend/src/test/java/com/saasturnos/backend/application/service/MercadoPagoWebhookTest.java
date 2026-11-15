package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.PagoSenaDto.ResultadoProcesamientoWebhook;
import com.saasturnos.backend.domain.model.Negocio;
import com.saasturnos.backend.domain.model.PagoSena;
import com.saasturnos.backend.domain.model.Profesional;
import com.saasturnos.backend.domain.model.Servicio;
import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.EstadoTurno;
import com.saasturnos.backend.infrastructure.repository.PagoSenaRepository;
import com.saasturnos.backend.infrastructure.repository.TurnoRepository;
import com.saasturnos.backend.infrastructure.security.MercadoPagoSignatureValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MercadoPagoWebhookTest {

    private static final String SECRET = "super_secret_mp_key_2026";

    @Mock private TurnoRepository turnoRepository;
    @Mock private PagoSenaRepository pagoSenaRepository;
    @Mock private TransactionTemplate transactionTemplate;

    private MercadoPagoSignatureValidator validator;
    private MercadoPagoService mercadoPagoService;

    @BeforeEach
    void setUp() {
        validator = new MercadoPagoSignatureValidator(SECRET);
        mercadoPagoService = new MercadoPagoService(
                turnoRepository,
                pagoSenaRepository,
                transactionTemplate,
                "TEST-TOKEN-DEV",
                "http://localhost:8080/api/v1/pagos/mercadopago/webhook",
                "http://localhost:5173"
        );
    }

    @Test
    @DisplayName("Valida correctamente una firma HMAC-SHA256 legítima y rechaza firmas alteradas o ataques de repetición")
    void validaFirmaHmacSha256YRechazaReplayAttacks() throws Exception {
        String dataId = "9988776655";
        String requestId = "req-abc-123";
        String tsActual = String.valueOf(Instant.now().getEpochSecond());

        String hashValido = validator.computeHmacSha256(dataId, requestId, tsActual);
        String xSignatureValida = "ts=" + tsActual + ",v1=" + hashValido;

        assertTrue(validator.isValidSignature(xSignatureValida, requestId, dataId));

        // Firma adulterada
        String xSignatureAdulterada = "ts=" + tsActual + ",v1=0000000000000000000000000000000000000000000000000000000000000000";
        assertFalse(validator.isValidSignature(xSignatureAdulterada, requestId, dataId));

        // Replay Attack (timestamp de hace 10 minutos, fuera de la ventana de 5 minutos)
        String tsViejo = String.valueOf(Instant.now().minusSeconds(600).getEpochSecond());
        String hashViejo = validator.computeHmacSha256(dataId, requestId, tsViejo);
        String xSignatureExpirada = "ts=" + tsViejo + ",v1=" + hashViejo;
        assertFalse(validator.isValidSignature(xSignatureExpirada, requestId, dataId));
    }

    @Test
    @DisplayName("Procesa el pago approved de manera atómica e idempotente (ignora notificaciones duplicadas)")
    @SuppressWarnings("unchecked")
    void procesaWebhookIdempotenteYTransicionaASenadoSoloEnApproved() {
        when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(mock(TransactionStatus.class));
        });

        Turno turno = crearTurnoPendiente("TRN-7K8M9P", new BigDecimal("3000.00"));

        // 1ra vez: no existe el paymentId -> debe procesar y cambiar a SENADO
        when(pagoSenaRepository.existsByMpPaymentId("PAY-1001")).thenReturn(false);
        when(turnoRepository.findByCodigoReserva("TRN-7K8M9P")).thenReturn(Optional.of(turno));

        ResultadoProcesamientoWebhook res1 = mercadoPagoService.procesarPagoConfirmadoEnTransaccion(
                "PAY-1001",
                "req-1",
                "approved",
                "TRN-7K8M9P",
                new BigDecimal("3000.00")
        );

        assertTrue(res1.procesado());
        assertFalse(res1.idempotenteIgnorado());
        assertEquals(EstadoTurno.SENADO, turno.getEstado());
        assertEquals(new BigDecimal("3000.00"), turno.getMontoSenaAbonado());
        assertNull(turno.getExpiraEn());
        verify(turnoRepository, times(1)).save(turno);
        verify(pagoSenaRepository, times(1)).save(any(PagoSena.class));

        // 2da vez (Reintento de Mercado Pago con el mismo PAY-1001): debe ser ignorado por idempotencia
        when(pagoSenaRepository.existsByMpPaymentId("PAY-1001")).thenReturn(true);

        ResultadoProcesamientoWebhook res2 = mercadoPagoService.procesarPagoConfirmadoEnTransaccion(
                "PAY-1001",
                "req-2",
                "approved",
                "TRN-7K8M9P",
                new BigDecimal("3000.00")
        );

        assertFalse(res2.procesado());
        assertTrue(res2.idempotenteIgnorado());
        verify(turnoRepository, times(1)).save(turno); // No volvió a guardar
    }

    @Test
    @DisplayName("Valida Patrón State, Patrón Strategy y Patrón Factory Method en el dominio de Turno")
    void validaPatronesStateStrategyYFactoryMethod() {
        Turno turno = crearTurnoPendiente("TRN-STATE1", new BigDecimal("3000.00"));

        // 1. Factory Method lo crea en PENDIENTE_PAGO con saldo pendiente = 10000
        assertEquals(EstadoTurno.PENDIENTE_PAGO, turno.getEstado());
        assertEquals(new BigDecimal("10000.00"), turno.calcularSaldoPendiente());

        // 2. Acreditar seña transiciona a SENADO y actualiza saldo pendiente a 7000
        turno.acreditarSena(new BigDecimal("3000.00"));
        assertEquals(EstadoTurno.SENADO, turno.getEstado());
        assertEquals(new BigDecimal("7000.00"), turno.calcularSaldoPendiente());

        // 3. Patrón Strategy procesa el cobro del saldo restante en mostrador y pasa a ATENDIDO
        com.saasturnos.backend.application.strategy.ProcesadorCobroContext context =
                new com.saasturnos.backend.application.strategy.ProcesadorCobroContext(java.util.List.of(
                        new com.saasturnos.backend.application.strategy.EfectivoCobroStrategy(),
                        new com.saasturnos.backend.application.strategy.TransferenciaCobroStrategy(),
                        new com.saasturnos.backend.application.strategy.MercadoPagoMostradorCobroStrategy(),
                        new com.saasturnos.backend.application.strategy.TarjetaCobroStrategy()
                ));

        var resultadoCobro = context.ejecutarCobroAtencion(turno, Turno.MetodoPago.TRANSFERENCIA);
        assertEquals(new BigDecimal("7000.00"), resultadoCobro.montoFinalCobrado());
        assertNotNull(resultadoCobro.descripcionOperacion());
        assertEquals(EstadoTurno.ATENDIDO, turno.getEstado());
        assertEquals(Turno.MetodoPago.TRANSFERENCIA, turno.getMetodoPagoResto());
        assertEquals(BigDecimal.ZERO.setScale(2), turno.calcularSaldoPendiente().setScale(2));
        assertEquals(new BigDecimal("10000.00"), turno.calcularTotalRecaudado());

        // 4. Patrón State bloquea transición ilegal: un turno ATENDIDO no puede cancelarse ni marcarse ausente
        assertThrows(com.saasturnos.backend.domain.exception.BusinessRuleException.class, turno::cancelar);
        assertThrows(com.saasturnos.backend.domain.exception.BusinessRuleException.class, turno::marcarAusente);
    }

    private Turno crearTurnoPendiente(String codigo, BigDecimal sena) {
        Negocio n = new Negocio("Barbería Demo", "barberia-demo", "5491122334455");
        Profesional p = new Profesional(n, "Lisandro", "Barbero", null, "#4F46E5", true);
        Servicio s = new Servicio(n, "Corte", null, 40, new BigDecimal("10000.00"), true, sena);

        OffsetDateTime ahora = OffsetDateTime.now();
        return Turno.crearReservaWebPublica(
                codigo,
                n,
                p,
                s,
                ahora.plusDays(1),
                "Juan Pérez",
                "5491199887766",
                "juan@example.com",
                null,
                ahora,
                10
        );
    }
}

