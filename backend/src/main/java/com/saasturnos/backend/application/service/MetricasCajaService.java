package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.MetricasCajaDto.*;
import com.saasturnos.backend.domain.model.Profesional;
import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.EstadoTurno;
import com.saasturnos.backend.domain.model.Turno.MetodoPago;
import com.saasturnos.backend.infrastructure.repository.ProfesionalRepository;
import com.saasturnos.backend.infrastructure.repository.TurnoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.saasturnos.backend.application.service.DisponibilidadService.ZONA_ARGENTINA;

@Service
public class MetricasCajaService {

    private final TurnoRepository turnoRepository;
    private final ProfesionalRepository profesionalRepository;

    public MetricasCajaService(
            TurnoRepository turnoRepository,
            ProfesionalRepository profesionalRepository
    ) {
        this.turnoRepository = turnoRepository;
        this.profesionalRepository = profesionalRepository;
    }

    @Transactional(readOnly = true)
    public ResumenCajaMetricasResponse calcularMetricasCaja(
            Long negocioId,
            LocalDate fechaDesde,
            LocalDate fechaHasta
    ) {
        OffsetDateTime desde = fechaDesde.atStartOfDay(ZONA_ARGENTINA).toOffsetDateTime();
        OffsetDateTime hasta = fechaHasta.plusDays(1).atStartOfDay(ZONA_ARGENTINA).toOffsetDateTime();

        List<Turno> turnos = turnoRepository.findByNegocioAndRangoFechas(negocioId, desde, hasta);
        List<Profesional> profesionales = profesionalRepository
                .findByNegocioIdAndActivoTrueOrderByEsDuenoDescNombreAsc(negocioId);

        BigDecimal totalSenasRecaudadas = BigDecimal.ZERO;
        BigDecimal totalCobradoEnLocal = BigDecimal.ZERO;
        BigDecimal ingresosProyectadosPendientes = BigDecimal.ZERO;
        BigDecimal dineroProtegidoEnAusencias = BigDecimal.ZERO;

        Map<String, BigDecimal> desgloseMedios = new LinkedHashMap<>();
        desgloseMedios.put("SEÑAS_MERCADO_PAGO", BigDecimal.ZERO);
        desgloseMedios.put(MetodoPago.EFECTIVO.name(), BigDecimal.ZERO);
        desgloseMedios.put(MetodoPago.TRANSFERENCIA.name(), BigDecimal.ZERO);
        desgloseMedios.put(MetodoPago.MERCADO_PAGO.name(), BigDecimal.ZERO);
        desgloseMedios.put(MetodoPago.TARJETA.name(), BigDecimal.ZERO);

        long atendidos = 0;
        long porAtender = 0;
        long ausentes = 0;
        long cancelados = 0;

        for (Turno t : turnos) {
            EstadoTurno estado = t.getEstado();
            if (estado == EstadoTurno.EXPIRADO) {
                continue;
            }

            BigDecimal sena = t.getMontoSenaAbonado() != null ? t.getMontoSenaAbonado() : BigDecimal.ZERO;
            BigDecimal resto = t.getMontoRestanteCobrado() != null ? t.getMontoRestanteCobrado() : BigDecimal.ZERO;

            if (sena.compareTo(BigDecimal.ZERO) > 0 && estado != EstadoTurno.CANCELADO) {
                totalSenasRecaudadas = totalSenasRecaudadas.add(sena);
                desgloseMedios.put("SEÑAS_MERCADO_PAGO", desgloseMedios.get("SEÑAS_MERCADO_PAGO").add(sena));
            }

            switch (estado) {
                case ATENDIDO -> {
                    atendidos++;
                    totalCobradoEnLocal = totalCobradoEnLocal.add(resto);
                    if (t.getMetodoPagoResto() != null && resto.compareTo(BigDecimal.ZERO) > 0) {
                        String key = t.getMetodoPagoResto().name();
                        desgloseMedios.put(key, desgloseMedios.getOrDefault(key, BigDecimal.ZERO).add(resto));
                    }
                }
                case CONFIRMADO, SENADO, PENDIENTE_PAGO -> {
                    porAtender++;
                    BigDecimal saldoPendiente = t.calcularSaldoPendiente();
                    ingresosProyectadosPendientes = ingresosProyectadosPendientes.add(saldoPendiente);
                }
                case AUSENTE -> {
                    ausentes++;
                    dineroProtegidoEnAusencias = dineroProtegidoEnAusencias.add(sena);
                }
                case CANCELADO -> cancelados++;
                default -> {}
            }
        }

        BigDecimal ingresosRealesTotales = totalSenasRecaudadas.add(totalCobradoEnLocal);

        BigDecimal ticketPromedio = atendidos > 0
                ? ingresosRealesTotales.divide(BigDecimal.valueOf(atendidos), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        long baseCerrados = atendidos + ausentes;
        BigDecimal tasaAusentismo = baseCerrados > 0
                ? BigDecimal.valueOf(ausentes * 100.0).divide(BigDecimal.valueOf(baseCerrados), 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Rendimiento por Profesional
        final BigDecimal totalGlobalFinal = ingresosRealesTotales;
        List<RendimientoProfesionalResponse> rendimientoProfesionales = new ArrayList<>();

        for (Profesional p : profesionales) {
            List<Turno> turnosProf = turnos.stream()
                    .filter(t -> t.getProfesional().getId().equals(p.getId()))
                    .toList();

            long profAtendidos = turnosProf.stream().filter(t -> t.getEstado() == EstadoTurno.ATENDIDO).count();
            long profConfirmados = turnosProf.stream().filter(t ->
                    t.getEstado() == EstadoTurno.CONFIRMADO || t.getEstado() == EstadoTurno.SENADO
            ).count();
            long profAusentes = turnosProf.stream().filter(t -> t.getEstado() == EstadoTurno.AUSENTE).count();

            BigDecimal recaudadoProf = turnosProf.stream()
                    .filter(t -> t.getEstado() != EstadoTurno.CANCELADO && t.getEstado() != EstadoTurno.EXPIRADO)
                    .map(Turno::calcularTotalRecaudado)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal porcentaje = totalGlobalFinal.compareTo(BigDecimal.ZERO) > 0
                    ? recaudadoProf.multiply(BigDecimal.valueOf(100)).divide(totalGlobalFinal, 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            rendimientoProfesionales.add(new RendimientoProfesionalResponse(
                    p.getId(),
                    p.getNombre(),
                    p.getColorAgenda(),
                    p.getEsDueno(),
                    profAtendidos,
                    profConfirmados,
                    profAusentes,
                    recaudadoProf,
                    porcentaje
            ));
        }

        // Ranking de Servicios Más Rentables
        Map<Long, List<Turno>> porServicio = turnos.stream()
                .filter(t -> t.getEstado() != EstadoTurno.CANCELADO && t.getEstado() != EstadoTurno.EXPIRADO)
                .collect(Collectors.groupingBy(t -> t.getServicio().getId()));

        List<ServicioRentabilidadResponse> rankingServicios = porServicio.entrySet().stream()
                .map(entry -> {
                    List<Turno> lista = entry.getValue();
                    String nombreServicio = lista.get(0).getServicio().getNombre();
                    BigDecimal recaudado = lista.stream()
                            .map(Turno::calcularTotalRecaudado)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new ServicioRentabilidadResponse(
                            entry.getKey(),
                            nombreServicio,
                            lista.size(),
                            recaudado
                    );
                })
                .sorted(Comparator.comparing(ServicioRentabilidadResponse::totalRecaudado).reversed())
                .toList();

        long totalTurnosValidos = atendidos + porAtender + ausentes + cancelados;

        return new ResumenCajaMetricasResponse(
                negocioId,
                fechaDesde,
                fechaHasta,
                ingresosRealesTotales,
                totalSenasRecaudadas,
                totalCobradoEnLocal,
                ingresosProyectadosPendientes,
                dineroProtegidoEnAusencias,
                ticketPromedio,
                desgloseMedios,
                totalTurnosValidos,
                atendidos,
                porAtender,
                ausentes,
                cancelados,
                tasaAusentismo,
                rendimientoProfesionales,
                rankingServicios
        );
    }
}

