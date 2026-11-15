package com.saasturnos.backend.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

public final class PagoSenaDto {

    public record PreferenciaPagoResponse(
            Long turnoId,
            String codigoReserva,
            String mpPreferenceId,
            String initPoint,
            String sandboxInitPoint,
            BigDecimal montoSena,
            OffsetDateTime expiraEn,
            boolean modoSandbox
    ) {}

    public record WebhookNotificationPayload(
            Long id,
            String action,
            String type,
            Map<String, Object> data
    ) {
        public String extractDataId() {
            if (data != null && data.get("id") != null) {
                return String.valueOf(data.get("id"));
            }
            return null;
        }
    }

    public record ResultadoProcesamientoWebhook(
            boolean procesado,
            boolean idempotenteIgnorado,
            String paymentId,
            String estadoPago,
            String codigoReserva
    ) {}
}

