package com.saasturnos.backend.application.strategy;

import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.MetodoPago;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Estrategia concreta para cobro mediante Transferencia Bancaria / Alias (acreditación inmediata CBU/CVU).
 */
@Component
public class TransferenciaCobroStrategy implements EstrategiaCobroSaldo {

    @Override
    public MetodoPago getMetodoPago() {
        return MetodoPago.TRANSFERENCIA;
    }

    @Override
    public ResultadoCobroSaldo calcularYProcesarCobro(Turno turno, BigDecimal saldoBasePendiente) {
        BigDecimal monto = saldoBasePendiente.max(BigDecimal.ZERO);
        return new ResultadoCobroSaldo(
                monto,
                BigDecimal.ZERO,
                monto,
                "Cobro por Transferencia Bancaria / Alias"
        );
    }
}

