package com.saasturnos.backend.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class MetricasCajaDto {

    public record RendimientoProfesionalResponse(
            Long profesionalId,
            String profesionalNombre,
            String profesionalColor,
            Boolean esDueno,
            long turnosAtendidos,
            long turnosConfirmados,
            long turnosAusentes,
            BigDecimal totalRecaudado,
            BigDecimal porcentajeSobreTotal
    ) {}

    public record ServicioRentabilidadResponse(
            Long servicioId,
            String servicioNombre,
            long cantidadTurnos,
            BigDecimal totalRecaudado
    ) {}

    public record ResumenCajaMetricasResponse(
            Long negocioId,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            // KPIs Financieros (ADN ControlCaja)
            BigDecimal ingresosRealesTotales,
            BigDecimal totalSenasRecaudadas,
            BigDecimal totalCobradoEnLocal,
            BigDecimal ingresosProyectadosPendientes,
            BigDecimal dineroProtegidoPorSenasEnAusencias,
            BigDecimal ticketPromedio,
            Map<String, BigDecimal> desglosePorMetodoPago,
            // KPIs Operativos
            long totalTurnosPeriodo,
            long turnosAtendidos,
            long turnosPorAtender,
            long turnosAusentes,
            long turnosCancelados,
            BigDecimal tasaAusentismoPorcentaje,
            // Rankings
            List<RendimientoProfesionalResponse> rendimientoPorProfesional,
            List<ServicioRentabilidadResponse> serviciosMasRentables
    ) {}
}

