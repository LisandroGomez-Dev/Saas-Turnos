package com.saasturnos.backend.application.strategy;

import com.saasturnos.backend.application.strategy.EstrategiaCobroSaldo.ResultadoCobroSaldo;
import com.saasturnos.backend.domain.exception.BusinessRuleException;
import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.MetodoPago;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Contexto del Patrón Strategy.
 * Registra automáticamente todas las implementaciones de {@link EstrategiaCobroSaldo}
 * inyectadas por Spring Boot en un mapa indexado por {@link MetodoPago}, eliminando condicionales if/switch.
 */
@Component
public class ProcesadorCobroContext {

    private static final Logger log = LoggerFactory.getLogger(ProcesadorCobroContext.class);

    private final Map<MetodoPago, EstrategiaCobroSaldo> estrategias = new EnumMap<>(MetodoPago.class);

    public ProcesadorCobroContext(List<EstrategiaCobroSaldo> listaEstrategias) {
        for (EstrategiaCobroSaldo estrategia : listaEstrategias) {
            this.estrategias.put(estrategia.getMetodoPago(), estrategia);
        }
    }

    /**
     * Resuelve polimórficamente la estrategia correspondiente al medio de pago,
     * calcula el cobro del saldo pendiente y completa la atención del turno.
     */
    public ResultadoCobroSaldo ejecutarCobroAtencion(Turno turno, MetodoPago metodoPago) {
        if (metodoPago == null) {
            throw new BusinessRuleException("Debe indicar un método de pago válido.");
        }

        EstrategiaCobroSaldo estrategia = this.estrategias.get(metodoPago);
        if (estrategia == null) {
            throw new BusinessRuleException("No existe una estrategia de cobro configurada para: " + metodoPago);
        }

        BigDecimal saldoPendiente = turno.calcularSaldoPendiente();
        ResultadoCobroSaldo resultado = estrategia.calcularYProcesarCobro(turno, saldoPendiente);

        // El propio objeto de dominio Turno valida la transición de estado (Patrón State) y actualiza sus atributos privados
        turno.completarAtencion(resultado.montoFinalCobrado(), metodoPago);

        log.info("Turno {} liquidado mediante estrategia [{}]: cobrado=${}, netoCaja=${}",
                turno.getCodigoReserva(), metodoPago, resultado.montoFinalCobrado(), resultado.ingresoNetoCaja());

        return resultado;
    }
}

