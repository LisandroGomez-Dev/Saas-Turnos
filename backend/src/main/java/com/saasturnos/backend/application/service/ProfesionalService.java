package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.ProfesionalDto.ActualizarProfesionalRequest;
import com.saasturnos.backend.application.dto.ProfesionalDto.CrearProfesionalRequest;
import com.saasturnos.backend.application.dto.ProfesionalDto.ProfesionalResponse;
import com.saasturnos.backend.domain.model.Negocio;
import com.saasturnos.backend.domain.model.Profesional;
import com.saasturnos.backend.domain.model.Servicio;
import com.saasturnos.backend.infrastructure.repository.ProfesionalRepository;
import com.saasturnos.backend.infrastructure.repository.ServicioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ProfesionalService {

    private final ProfesionalRepository profesionalRepository;
    private final ServicioRepository servicioRepository;
    private final NegocioService negocioService;

    public ProfesionalService(
            ProfesionalRepository profesionalRepository,
            ServicioRepository servicioRepository,
            NegocioService negocioService
    ) {
        this.profesionalRepository = profesionalRepository;
        this.servicioRepository = servicioRepository;
        this.negocioService = negocioService;
    }

    @Transactional(readOnly = true)
    public List<ProfesionalResponse> listarPorNegocio(Long negocioId) {
        return profesionalRepository.findByNegocioIdAndActivoTrueOrderByEsDuenoDescNombreAsc(negocioId)
                .stream()
                .map(ProfesionalResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProfesionalResponse> listarPorServicio(Long negocioId, Long servicioId) {
        return profesionalRepository.findActivosByNegocioAndServicio(negocioId, servicioId)
                .stream()
                .map(ProfesionalResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProfesionalResponse obtenerPorId(Long negocioId, Long profesionalId) {
        Profesional profesional = buscarEntidad(negocioId, profesionalId);
        return ProfesionalResponse.fromEntity(profesional);
    }

    @Transactional
    public ProfesionalResponse crear(Long negocioId, CrearProfesionalRequest req) {
        Negocio negocio = negocioService.buscarEntidad(negocioId);

        Profesional profesional = new Profesional(
                negocio,
                req.nombre(),
                req.especialidad(),
                req.avatarUrl(),
                req.colorAgenda(),
                Boolean.TRUE.equals(req.esDueno())
        );

        if (req.servicioIds() != null && !req.servicioIds().isEmpty()) {
            Set<Servicio> servicios = new HashSet<>(servicioRepository.findAllById(req.servicioIds()));
            profesional.reemplazarServicios(servicios);
        }

        Profesional guardado = profesionalRepository.save(profesional);
        return ProfesionalResponse.fromEntity(guardado);
    }

    @Transactional
    public ProfesionalResponse actualizar(Long negocioId, Long profesionalId, ActualizarProfesionalRequest req) {
        Profesional profesional = buscarEntidad(negocioId, profesionalId);

        profesional.actualizarPerfilProfesional(
                req.nombre(),
                req.especialidad(),
                req.avatarUrl(),
                req.colorAgenda(),
                req.activo()
        );

        if (req.servicioIds() != null) {
            Set<Servicio> servicios = new HashSet<>(servicioRepository.findAllById(req.servicioIds()));
            profesional.reemplazarServicios(servicios);
        }

        Profesional guardado = profesionalRepository.save(profesional);
        return ProfesionalResponse.fromEntity(guardado);
    }

    @Transactional(readOnly = true)
    public Profesional buscarEntidad(Long negocioId, Long profesionalId) {
        return profesionalRepository.findByIdAndNegocioId(profesionalId, negocioId)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado con ID: " + profesionalId));
    }
}

