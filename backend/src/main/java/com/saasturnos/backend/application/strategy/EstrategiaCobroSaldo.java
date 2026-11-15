package com.saasturnos.backend.application.strategy;

import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.MetodoPago;
import java.math.BigDecimal;

/**
 * Patrón Strategy: Interfaz común para todas las estrategias de cobro del saldo restante de un turno.
 */
public interface EstrategiaCobroSaldo {

    /**
     * Identifica el medio de pago que atiende esta estrategia.
     */
    MetodoPago getMetodoPago();

    /**
     * Ejecuta las reglas financieras de cobro para el medio seleccionado y retorna el resultado liquidado.
     */
    ResultadoCobroSaldo calcularYProcesarCobro(Turno turno, BigDecimal saldoBasePendiente);

    record ResultadoCobroSaldo(
            BigDecimal montoFinalCobrado,
            BigDecimal comisionEstimada,
            BigDecimal ingresoNetoCaja,
            String descripcionOperacion
    ) {}
}

