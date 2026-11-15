package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.PagoSenaDto.PreferenciaPagoResponse;
import com.saasturnos.backend.application.dto.PagoSenaDto.ResultadoProcesamientoWebhook;
import com.saasturnos.backend.application.dto.PagoSenaDto.WebhookNotificationPayload;
import com.saasturnos.backend.application.dto.TurnoDto.TurnoResponse;
import com.saasturnos.backend.application.service.MercadoPagoService;
import com.saasturnos.backend.infrastructure.security.MercadoPagoSignatureValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class MercadoPagoWebhookController {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoWebhookController.class);

    private final MercadoPagoService mercadoPagoService;
    private final MercadoPagoSignatureValidator signatureValidator;

    public MercadoPagoWebhookController(
            MercadoPagoService mercadoPagoService,
            MercadoPagoSignatureValidator signatureValidator
    ) {
        this.mercadoPagoService = mercadoPagoService;
        this.signatureValidator = signatureValidator;
    }

    /**
     * Crea la preferencia de pago (Checkout Pro) para abonar la seña fija de un turno.
     */
    @PostMapping("/public/reservas/{codigoReserva}/preferencia-mp")
    public ResponseEntity<PreferenciaPagoResponse> crearPreferencia(
            @PathVariable String codigoReserva
    ) {
        PreferenciaPagoResponse response = mercadoPagoService.crearPreferenciaSena(codigoReserva);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint oficial para recibir Webhooks de Mercado Pago.
     * Verifica criptográficamente la firma HMAC-SHA256 (x-signature) y procesa de forma idempotente.
     */
    @PostMapping("/pagos/mercadopago/webhook")
    public ResponseEntity<?> recibirWebhookMercadoPago(
            @RequestHeader(value = "x-signature", required = false) String xSignature,
            @RequestHeader(value = "x-request-id", required = false) String xRequestId,
            @RequestParam(value = "data.id", required = false) String queryDataId,
            @RequestBody(required = false) WebhookNotificationPayload payload
    ) {
        String dataId = queryDataId != null ? queryDataId : (payload != null ? payload.extractDataId() : null);

        // 1. Verificación Criptográfica Estricta (HMAC-SHA256 + Anti-Replay Timestamp)
        if (!signatureValidator.isValidSignature(xSignature, xRequestId, dataId)) {
            log.warn("Firma de Webhook de Mercado Pago inválida o ausente. xRequestId={}, dataId={}", xRequestId, dataId);
            ProblemDetail unauthorized = ProblemDetail.forStatusAndDetail(
                    HttpStatus.UNAUTHORIZED,
                    "Firma criptográfica x-signature inválida o fuera de la ventana de tiempo permitida."
            );
            unauthorized.setTitle("Webhook Signature Verification Failed");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(unauthorized);
        }

        // Ignorar eventos que no sean de tipo 'payment'
        if (payload != null && payload.type() != null && !"payment".equalsIgnoreCase(payload.type())) {
            return ResponseEntity.ok().build();
        }

        // 2. Procesamiento idempotente
        ResultadoProcesamientoWebhook resultado = mercadoPagoService.procesarNotificacionWebhook(dataId, xRequestId);
        return ResponseEntity.ok(resultado);
    }

    /**
     * Endpoint de simulación Sandbox para pruebas locales (simula un pago aprobado en Checkout Pro).
     */
    @PostMapping("/public/reservas/{codigoReserva}/simular-pago-mp")
    public ResponseEntity<TurnoResponse> simularPagoAprobado(@PathVariable String codigoReserva) {
        return ResponseEntity.ok(mercadoPagoService.simularPagoSandboxAprobado(codigoReserva));
    }
}

