package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.TurnoDto.*;
import com.saasturnos.backend.application.strategy.ProcesadorCobroContext;
import com.saasturnos.backend.domain.exception.BusinessRuleException;
import com.saasturnos.backend.domain.exception.SlotOcupadoException;
import com.saasturnos.backend.domain.model.*;
import com.saasturnos.backend.infrastructure.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static com.saasturnos.backend.application.service.DisponibilidadService.ZONA_ARGENTINA;

@Service
public class TurnoService {

    private static final String ALFABETO_CODIGO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TurnoRepository turnoRepository;
    private final NegocioRepository negocioRepository;
    private final ProfesionalRepository profesionalRepository;
    private final ServicioRepository servicioRepository;
    private final DisponibilidadService disponibilidadService;
    private final ProcesadorCobroContext procesadorCobroContext;
    private final int expiracionMinutos;

    public TurnoService(
            TurnoRepository turnoRepository,
            NegocioRepository negocioRepository,
            ProfesionalRepository profesionalRepository,
            ServicioRepository servicioRepository,
            DisponibilidadService disponibilidadService,
            ProcesadorCobroContext procesadorCobroContext,
            @Value("${turnos.reserva.expiracion-minutos:10}") int expiracionMinutos
    ) {
        this.turnoRepository = turnoRepository;
        this.negocioRepository = negocioRepository;
        this.profesionalRepository = profesionalRepository;
        this.servicioRepository = servicioRepository;
        this.disponibilidadService = disponibilidadService;
        this.procesadorCobroContext = procesadorCobroContext;
        this.expiracionMinutos = expiracionMinutos;
    }

    @Transactional
    public TurnoResponse crearReservaPublica(String negocioSlug, CrearReservaPublicaRequest req) {
        Negocio negocio = negocioRepository.findBySlugAndActivoTrue(negocioSlug)
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado: " + negocioSlug));

        Servicio servicio = servicioRepository.findByIdAndNegocioId(req.servicioId(), negocio.getId())
                .filter(Servicio::getActivo)
                .orElseThrow(() -> new EntityNotFoundException("El servicio seleccionado no está disponible."));

        // Bloqueo optimista forzado sobre el Profesional (@Version) para impedir doble reserva concurrente
        Profesional profesional = profesionalRepository
                .findWithOptimisticLockByIdAndNegocioId(req.profesionalId(), negocio.getId())
                .orElseThrow(() -> new EntityNotFoundException("El profesional seleccionado no está disponible."));

        OffsetDateTime ahora = OffsetDateTime.now(ZONA_ARGENTINA);
        OffsetDateTime inicio = req.fechaHoraInicio();
        OffsetDateTime fin = inicio.plusMinutes(servicio.getDuracionMinutos());

        if (inicio.isBefore(ahora.plusMinutes(5))) {
            throw new BusinessRuleException("El horario seleccionado ya pasó o está demasiado próximo.");
        }

        boolean disponible = disponibilidadService.estaDisponibleRangoExacto(
                profesional.getId(),
                inicio,
                fin,
                ahora,
                true
        );

        if (!disponible) {
            throw new SlotOcupadoException(
                    "¡Ups! Este horario acaba de ser reservado por otra persona hace un instante. Actualizamos la agenda para que elijas otro horario libre."
            );
        }

        // Patrón Factory Method: creación semántica con invariantes garantizadas
        Turno turno = Turno.crearReservaWebPublica(
                generarCodigoUnico(),
                negocio,
                profesional,
                servicio,
                inicio,
                req.clienteNombre(),
                req.clienteTelefono(),
                req.clienteEmail(),
                req.notasCliente(),
                ahora,
                expiracionMinutos
        );

        Turno guardado = turnoRepository.save(turno);
        return TurnoResponse.fromEntity(guardado);
    }

    @Transactional
    public TurnoResponse crearTurnoManual(Long negocioId, CrearTurnoManualRequest req) {
        Negocio negocio = negocioRepository.findById(negocioId)
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado con ID: " + negocioId));

        Servicio servicio = servicioRepository.findByIdAndNegocioId(req.servicioId(), negocioId)
                .orElseThrow(() -> new EntityNotFoundException("Servicio no encontrado con ID: " + req.servicioId()));

        Profesional profesional = profesionalRepository
                .findWithOptimisticLockByIdAndNegocioId(req.profesionalId(), negocioId)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado con ID: " + req.profesionalId()));

        OffsetDateTime ahora = OffsetDateTime.now(ZONA_ARGENTINA);
        OffsetDateTime inicio = req.fechaHoraInicio();
        OffsetDateTime fin = inicio.plusMinutes(servicio.getDuracionMinutos());

        // Para turnos manuales del dueño, validamos que no pise otro turno activo (pero permitimos flexibilidad fuera de horario estándar)
        boolean disponible = disponibilidadService.estaDisponibleRangoExacto(
                profesional.getId(),
                inicio,
                fin,
                ahora,
                false
        );

        if (!disponible) {
            throw new SlotOcupadoException(
                    "El profesional ya tiene un turno o bloqueo asignado que se superpone con el horario " + inicio.toLocalTime()
            );
        }

        // Patrón Factory Method: creación para turno manual en mostrador
        Turno turno = Turno.crearTurnoManualMostrador(
                generarCodigoUnico(),
                negocio,
                profesional,
                servicio,
                inicio,
                req.clienteNombre(),
                req.clienteTelefono(),
                req.notasCliente(),
                Boolean.TRUE.equals(req.senaYaAbonada())
        );

        Turno guardado = turnoRepository.save(turno);
        return TurnoResponse.fromEntity(guardado);
    }

    @Transactional(readOnly = true)
    public TurnoResponse obtenerPorCodigoReserva(String codigoReserva) {
        Turno turno = turnoRepository.findByCodigoReserva(codigoReserva.trim().toUpperCase())
                .orElseThrow(() -> new EntityNotFoundException("No se encontró ningún turno con el código: " + codigoReserva));
        return TurnoResponse.fromEntity(turno);
    }

    @Transactional(readOnly = true)
    public List<TurnoResponse> listarPorNegocioYFecha(Long negocioId, LocalDate fechaDesde, LocalDate fechaHasta) {
        OffsetDateTime desde = fechaDesde.atStartOfDay(ZONA_ARGENTINA).toOffsetDateTime();
        OffsetDateTime hasta = fechaHasta.plusDays(1).atStartOfDay(ZONA_ARGENTINA).toOffsetDateTime();

        return turnoRepository.findByNegocioAndRangoFechas(negocioId, desde, hasta)
                .stream()
                .map(TurnoResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TurnoResponse confirmarSenaAbonada(Long turnoId, BigDecimal montoPagado) {
        Turno turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado con ID: " + turnoId));

        // Método de dominio con validación de estado (State Pattern + Encapsulamiento POO)
        turno.acreditarSena(montoPagado);

        return TurnoResponse.fromEntity(turnoRepository.save(turno));
    }

    @Transactional
    public TurnoResponse completarAtencion(Long negocioId, Long turnoId, CompletarAtencionRequest req) {
        Turno turno = buscarTurnoDeNegocio(negocioId, turnoId);

        // Patrón Strategy + Patrón State: delega el cobro a la estrategia correspondiente al medio de pago
        procesadorCobroContext.ejecutarCobroAtencion(turno, req.metodoPagoResto());

        return TurnoResponse.fromEntity(turnoRepository.save(turno));
    }

    @Transactional
    public TurnoResponse marcarAusente(Long negocioId, Long turnoId) {
        Turno turno = buscarTurnoDeNegocio(negocioId, turnoId);

        // Método de dominio semántico (State Pattern)
        turno.marcarAusente();

        return TurnoResponse.fromEntity(turnoRepository.save(turno));
    }

    @Transactional
    public TurnoResponse cancelarPorDueño(Long negocioId, Long turnoId) {
        Turno turno = buscarTurnoDeNegocio(negocioId, turnoId);
        turno.cancelar();

        return TurnoResponse.fromEntity(turnoRepository.save(turno));
    }

    @Transactional
    public TurnoResponse cancelarPorCliente(String codigoReserva) {
        Turno turno = turnoRepository.findByCodigoReserva(codigoReserva.trim().toUpperCase())
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado con código: " + codigoReserva));

        OffsetDateTime ahora = OffsetDateTime.now(ZONA_ARGENTINA);
        int horasMinimas = turno.getNegocio().getCancelacionHorasMinimas();
        long horasFaltantes = Duration.between(ahora, turno.getFechaHoraInicio()).toHours();

        if (horasFaltantes < horasMinimas) {
            throw new BusinessRuleException(
                    "Las cancelaciones deben realizarse con al menos " + horasMinimas +
                            " horas de anticipación. Por favor comunicate directamente por WhatsApp con el local."
            );
        }

        turno.cancelar();
        return TurnoResponse.fromEntity(turnoRepository.save(turno));
    }

    private Turno buscarTurnoDeNegocio(Long negocioId, Long turnoId) {
        Turno turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado con ID: " + turnoId));

        if (!turno.getNegocio().getId().equals(negocioId)) {
            throw new EntityNotFoundException("El turno no pertenece al negocio especificado.");
        }
        return turno;
    }

    private String generarCodigoUnico() {
        for (int intento = 0; intento < 10; intento++) {
            StringBuilder sb = new StringBuilder("TRN-");
            for (int i = 0; i < 6; i++) {
                sb.append(ALFABETO_CODIGO.charAt(RANDOM.nextInt(ALFABETO_CODIGO.length())));
            }
            String candidato = sb.toString();
            if (turnoRepository.findByCodigoReserva(candidato).isEmpty()) {
                return candidato;
            }
        }
        return "TRN-" + System.currentTimeMillis() % 1000000;
    }
}

