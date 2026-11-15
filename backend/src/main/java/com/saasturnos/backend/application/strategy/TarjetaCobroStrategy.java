package com.saasturnos.backend.application.strategy;

import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.MetodoPago;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Estrategia concreta para cobro con Tarjeta de Débito / Crédito en terminal Posnet.
 */
@Component
public class TarjetaCobroStrategy implements EstrategiaCobroSaldo {

    private static final BigDecimal TASA_ARANCEL_TARJETA = new BigDecimal("0.018"); // 1.8% arancel promedio

    @Override
    public MetodoPago getMetodoPago() {
        return MetodoPago.TARJETA;
    }

    @Override
    public ResultadoCobroSaldo calcularYProcesarCobro(Turno turno, BigDecimal saldoBasePendiente) {
        BigDecimal monto = saldoBasePendiente.max(BigDecimal.ZERO);
        BigDecimal comision = monto.multiply(TASA_ARANCEL_TARJETA).setScale(2, RoundingMode.HALF_UP);
        BigDecimal neto = monto.subtract(comision);

        return new ResultadoCobroSaldo(
                monto,
                comision,
                neto,
                "Cobro con Tarjeta en terminal física"
        );
    }
}

