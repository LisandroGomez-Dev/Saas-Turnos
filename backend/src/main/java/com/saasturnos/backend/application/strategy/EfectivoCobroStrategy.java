package com.saasturnos.backend.application.strategy;

import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.MetodoPago;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Estrategia concreta para cobro presencial en Efectivo (0% comisión, ingreso directo a caja física).
 */
@Component
public class EfectivoCobroStrategy implements EstrategiaCobroSaldo {

    @Override
    public MetodoPago getMetodoPago() {
        return MetodoPago.EFECTIVO;
    }

    @Override
    public ResultadoCobroSaldo calcularYProcesarCobro(Turno turno, BigDecimal saldoBasePendiente) {
        BigDecimal monto = saldoBasePendiente.max(BigDecimal.ZERO);
        return new ResultadoCobroSaldo(
                monto,
                BigDecimal.ZERO,
                monto,
                "Cobro en Efectivo en mostrador (0% comisión)"
        );
    }
}

