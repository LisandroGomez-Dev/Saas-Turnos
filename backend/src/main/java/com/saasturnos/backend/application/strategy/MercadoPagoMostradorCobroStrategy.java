package com.saasturnos.backend.application.strategy;

import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.MetodoPago;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Estrategia concreta para cobro presencial con Mercado Pago QR / Point en mostrador.
 */
@Component
public class MercadoPagoMostradorCobroStrategy implements EstrategiaCobroSaldo {

    private static final BigDecimal TASA_COMISION_QR = new BigDecimal("0.008"); // 0.8% comisión estándar QR

    @Override
    public MetodoPago getMetodoPago() {
        return MetodoPago.MERCADO_PAGO;
    }

    @Override
    public ResultadoCobroSaldo calcularYProcesarCobro(Turno turno, BigDecimal saldoBasePendiente) {
        BigDecimal monto = saldoBasePendiente.max(BigDecimal.ZERO);
        BigDecimal comision = monto.multiply(TASA_COMISION_QR).setScale(2, RoundingMode.HALF_UP);
        BigDecimal neto = monto.subtract(comision);

        return new ResultadoCobroSaldo(
                monto,
                comision,
                neto,
                "Cobro con Mercado Pago QR en mostrador"
        );
    }
}

