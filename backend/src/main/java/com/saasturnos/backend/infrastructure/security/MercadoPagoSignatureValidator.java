package com.saasturnos.backend.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;

@Component
public class MercadoPagoSignatureValidator {

    private final String webhookSecret;
    private static final long MAX_TIME_DIFF_SECONDS = 300; // 5 minutos contra Replay Attacks

    public MercadoPagoSignatureValidator(
            @Value("${mercadopago.webhook.secret:dev_webhook_secret_key_hmac}") String webhookSecret
    ) {
        this.webhookSecret = webhookSecret;
    }

    public boolean isValidSignature(String xSignature, String xRequestId, String dataId) {
        if (xSignature == null || xRequestId == null || dataId == null || webhookSecret == null || webhookSecret.isBlank()) {
            return false;
        }

        try {
            // Formato esperado de x-signature: ts=1700000000,v1=abc123def456...
            String[] parts = xSignature.split(",");
            String ts = null;
            String v1 = null;

            for (String part : parts) {
                String[] keyValue = part.trim().split("=", 2);
                if (keyValue.length == 2) {
                    if ("ts".equalsIgnoreCase(keyValue[0].trim())) {
                        ts = keyValue[1].trim();
                    } else if ("v1".equalsIgnoreCase(keyValue[0].trim())) {
                        v1 = keyValue[1].trim();
                    }
                }
            }

            if (ts == null || v1 == null) {
                return false;
            }

            // 1. Validar ventana temporal (máximo 5 minutos de antigüedad)
            long timestamp = Long.parseLong(ts);
            long currentTimestamp = Instant.now().getEpochSecond();
            if (Math.abs(currentTimestamp - timestamp) > MAX_TIME_DIFF_SECONDS) {
                return false;
            }

            // 2. Construir el manifest oficial de Mercado Pago y calcular HMAC-SHA256
            String expectedHash = computeHmacSha256(dataId, xRequestId, ts);

            // 3. Comparación en tiempo constante para prevenir ataques de timing
            return MessageDigest.isEqual(
                    expectedHash.getBytes(StandardCharsets.UTF_8),
                    v1.toLowerCase().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }

    public String computeHmacSha256(String dataId, String xRequestId, String ts) throws Exception {
        String manifest = "id:" + dataId + ";request-id:" + xRequestId + ";ts:" + ts + ";";
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hmacBytes = mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8));

        StringBuilder hexString = new StringBuilder(hmacBytes.length * 2);
        for (byte b : hmacBytes) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }
}

