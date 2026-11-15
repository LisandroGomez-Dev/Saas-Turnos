package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.DisponibilidadDto.DisponibilidadDiaResponse;
import com.saasturnos.backend.application.dto.DisponibilidadDto.SlotDisponibleResponse;
import com.saasturnos.backend.domain.exception.BusinessRuleException;
import com.saasturnos.backend.domain.model.*;
import com.saasturnos.backend.domain.model.Turno.EstadoTurno;
import com.saasturnos.backend.infrastructure.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DisponibilidadService {

    public static final ZoneId ZONA_ARGENTINA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final DateTimeFormatter FORMATO_HORA = DateTimeFormatter.ofPattern("HH:mm");

    public static final Set<EstadoTurno> ESTADOS_QUE_OCUPAN_AGENDA = EnumSet.of(
            EstadoTurno.PENDIENTE_PAGO,
            EstadoTurno.CONFIRMADO,
            EstadoTurno.SENADO,
            EstadoTurno.ATENDIDO
    );

    private record IntervaloOcupado(OffsetDateTime inicio, OffsetDateTime fin) {}

    private final NegocioRepository negocioRepository;
    private final ServicioRepository servicioRepository;
    private final ProfesionalRepository profesionalRepository;
    private final HorarioLaboralRepository horarioLaboralRepository;
    private final BloqueoHorarioRepository bloqueoHorarioRepository;
    private final TurnoRepository turnoRepository;

    public DisponibilidadService(
            NegocioRepository negocioRepository,
            ServicioRepository servicioRepository,
            ProfesionalRepository profesionalRepository,
            HorarioLaboralRepository horarioLaboralRepository,
            BloqueoHorarioRepository bloqueoHorarioRepository,
            TurnoRepository turnoRepository
    ) {
        this.negocioRepository = negocioRepository;
        this.servicioRepository = servicioRepository;
        this.profesionalRepository = profesionalRepository;
        this.horarioLaboralRepository = horarioLaboralRepository;
        this.bloqueoHorarioRepository = bloqueoHorarioRepository;
        this.turnoRepository = turnoRepository;
    }

    @Transactional(readOnly = true)
    public DisponibilidadDiaResponse calcularDisponibilidadPorSlug(
            String negocioSlug,
            Long servicioId,
            Long profesionalIdOpcional,
            LocalDate fecha
    ) {
        Negocio negocio = negocioRepository.findBySlugAndActivoTrue(negocioSlug)
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado: " + negocioSlug));

        return calcularDisponibilidad(negocio.getId(), servicioId, profesionalIdOpcional, fecha);
    }

    @Transactional(readOnly = true)
    public DisponibilidadDiaResponse calcularDisponibilidad(
            Long negocioId,
            Long servicioId,
            Long profesionalIdOpcional,
            LocalDate fecha
    ) {
        OffsetDateTime ahora = OffsetDateTime.now(ZONA_ARGENTINA);
        LocalDate hoy = ahora.toLocalDate();

        if (fecha.isBefore(hoy)) {
            throw new BusinessRuleException("No se pueden consultar horarios en fechas pasadas.");
        }

        Servicio servicio = servicioRepository.findByIdAndNegocioId(servicioId, negocioId)
                .filter(Servicio::getActivo)
                .orElseThrow(() -> new EntityNotFoundException("Servicio activo no encontrado con ID: " + servicioId));

        List<Profesional> profesionalesCandidatos = resolverProfesionalesCandidatos(
                negocioId,
                servicioId,
                profesionalIdOpcional
        );

        List<SlotDisponibleResponse> todosLosSlots = new ArrayList<>();
        for (Profesional prof : profesionalesCandidatos) {
            todosLosSlots.addAll(calcularSlotsParaProfesional(prof, servicio, fecha, ahora));
        }

        todosLosSlots.sort(
                Comparator.comparing(SlotDisponibleResponse::fechaHoraInicio)
                        .thenComparing(SlotDisponibleResponse::profesionalId)
        );

        return new DisponibilidadDiaResponse(
                fecha,
                servicio.getId(),
                servicio.getNombre(),
                servicio.getDuracionMinutos(),
                servicio.getPrecio(),
                servicio.getRequiereSena(),
                servicio.getMontoSena(),
                todosLosSlots
        );
    }

    public List<SlotDisponibleResponse> calcularSlotsParaProfesional(
            Profesional profesional,
            Servicio servicio,
            LocalDate fecha,
            OffsetDateTime ahora
    ) {
        short diaSemana = (short) fecha.getDayOfWeek().getValue();
        List<HorarioLaboral> franjas = horarioLaboralRepository
                .findByProfesionalIdAndDiaSemanaAndActivoTrueOrderByHoraInicioAsc(profesional.getId(), diaSemana);

        if (franjas.isEmpty()) {
            return List.of();
        }

        OffsetDateTime inicioDia = fecha.atStartOfDay(ZONA_ARGENTINA).toOffsetDateTime();
        OffsetDateTime finDia = fecha.plusDays(1).atStartOfDay(ZONA_ARGENTINA).toOffsetDateTime();

        List<IntervaloOcupado> intervalosOcupados = obtenerIntervalosOcupados(
                profesional.getId(),
                inicioDia,
                finDia,
                ahora
        );

        List<SlotDisponibleResponse> slots = new ArrayList<>();
        int duracionMinutos = servicio.getDuracionMinutos();
        OffsetDateTime umbralMinimoReserva = ahora.plusMinutes(10);

        for (HorarioLaboral franja : franjas) {
            OffsetDateTime cursor = ZonedDateTime.of(fecha, franja.getHoraInicio(), ZONA_ARGENTINA).toOffsetDateTime();
            OffsetDateTime limiteFranja = ZonedDateTime.of(fecha, franja.getHoraFin(), ZONA_ARGENTINA).toOffsetDateTime();

            while (!cursor.plusMinutes(duracionMinutos).isAfter(limiteFranja)) {
                OffsetDateTime candidatoFin = cursor.plusMinutes(duracionMinutos);

                // Si la fecha es hoy y el horario ya pasó (o está a menos de 10 minutos), saltar al siguiente bloque
                if (cursor.isBefore(umbralMinimoReserva)) {
                    cursor = candidatoFin;
                    continue;
                }

                // Verificar si se solapa con algún turno o bloqueo existente
                Optional<OffsetDateTime> finConflicto = buscarFinDeConflicto(cursor, candidatoFin, intervalosOcupados);
                if (finConflicto.isPresent()) {
                    // Empaquetado inteligente sin tiempos muertos: saltar directamente al final del turno/bloqueo ocupado
                    cursor = finConflicto.get();
                    continue;
                }

                ZonedDateTime inicioZoned = cursor.atZoneSameInstant(ZONA_ARGENTINA);
                ZonedDateTime finZoned = candidatoFin.atZoneSameInstant(ZONA_ARGENTINA);

                slots.add(new SlotDisponibleResponse(
                        cursor,
                        candidatoFin,
                        inicioZoned.format(FORMATO_HORA),
                        finZoned.format(FORMATO_HORA),
                        profesional.getId(),
                        profesional.getNombre(),
                        profesional.getColorAgenda()
                ));

                cursor = candidatoFin;
            }
        }

        return slots;
    }

    @Transactional(readOnly = true)
    public boolean estaDisponibleRangoExacto(
            Long profesionalId,
            OffsetDateTime inicio,
            OffsetDateTime fin,
            OffsetDateTime ahora,
            boolean validarHorarioLaboral
    ) {
        if (validarHorarioLaboral) {
            ZonedDateTime inicioLocal = inicio.atZoneSameInstant(ZONA_ARGENTINA);
            ZonedDateTime finLocal = fin.atZoneSameInstant(ZONA_ARGENTINA);

            if (!inicioLocal.toLocalDate().equals(finLocal.toLocalDate())) {
                return false;
            }

            short diaSemana = (short) inicioLocal.getDayOfWeek().getValue();
            LocalTime horaInicio = inicioLocal.toLocalTime();
            LocalTime horaFin = finLocal.toLocalTime();

            List<HorarioLaboral> franjas = horarioLaboralRepository
                    .findByProfesionalIdAndDiaSemanaAndActivoTrueOrderByHoraInicioAsc(profesionalId, diaSemana);

            boolean dentroDeFranja = franjas.stream().anyMatch(f ->
                    !horaInicio.isBefore(f.getHoraInicio()) && !horaFin.isAfter(f.getHoraFin())
            );
            if (!dentroDeFranja) {
                return false;
            }
        }

        List<IntervaloOcupado> ocupados = obtenerIntervalosOcupados(profesionalId, inicio, fin, ahora);
        return buscarFinDeConflicto(inicio, fin, ocupados).isEmpty();
    }

    private List<IntervaloOcupado> obtenerIntervalosOcupados(
            Long profesionalId,
            OffsetDateTime rangoInicio,
            OffsetDateTime rangoFin,
            OffsetDateTime ahora
    ) {
        List<Turno> turnos = turnoRepository.findTurnosOcupadosSolapados(
                profesionalId,
                rangoInicio,
                rangoFin,
                ESTADOS_QUE_OCUPAN_AGENDA
        );

        List<BloqueoHorario> bloqueos = bloqueoHorarioRepository.findSolapadosEnRango(
                profesionalId,
                rangoInicio,
                rangoFin
        );

        List<IntervaloOcupado> ocupados = new ArrayList<>();

        for (Turno t : turnos) {
            // Ignorar reservas PENDIENTE_PAGO que ya hayan vencido pero aún no corrió el cron
            if (t.getEstado() == EstadoTurno.PENDIENTE_PAGO
                    && t.getExpiraEn() != null
                    && t.getExpiraEn().isBefore(ahora)) {
                continue;
            }
            ocupados.add(new IntervaloOcupado(t.getFechaHoraInicio(), t.getFechaHoraFin()));
        }

        for (BloqueoHorario b : bloqueos) {
            ocupados.add(new IntervaloOcupado(b.getFechaHoraInicio(), b.getFechaHoraFin()));
        }

        return ocupados;
    }

    private Optional<OffsetDateTime> buscarFinDeConflicto(
            OffsetDateTime candidatoInicio,
            OffsetDateTime candidatoFin,
            List<IntervaloOcupado> ocupados
    ) {
        OffsetDateTime maxFinConflicto = null;
        for (IntervaloOcupado o : ocupados) {
            // Dos intervalos [A, B) y [C, D) se solapan si y sólo si A < D y C < B
            if (candidatoInicio.isBefore(o.fin()) && o.inicio().isBefore(candidatoFin)) {
                if (maxFinConflicto == null || o.fin().isAfter(maxFinConflicto)) {
                    maxFinConflicto = o.fin();
                }
            }
        }
        return Optional.ofNullable(maxFinConflicto);
    }

    private List<Profesional> resolverProfesionalesCandidatos(
            Long negocioId,
            Long servicioId,
            Long profesionalIdOpcional
    ) {
        if (profesionalIdOpcional != null) {
            Profesional p = profesionalRepository.findByIdAndNegocioId(profesionalIdOpcional, negocioId)
                    .filter(Profesional::getActivo)
                    .orElseThrow(() -> new EntityNotFoundException("Profesional activo no encontrado con ID: " + profesionalIdOpcional));
            return List.of(p);
        }

        List<Profesional> porServicio = profesionalRepository.findActivosByNegocioAndServicio(negocioId, servicioId);
        if (!porServicio.isEmpty()) {
            return porServicio;
        }
        return profesionalRepository.findByNegocioIdAndActivoTrueOrderByEsDuenoDescNombreAsc(negocioId);
    }
}

