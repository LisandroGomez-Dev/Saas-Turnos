package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.BloqueoHorarioDto.BloqueoHorarioResponse;
import com.saasturnos.backend.application.dto.BloqueoHorarioDto.CrearBloqueoRequest;
import com.saasturnos.backend.domain.exception.BusinessRuleException;
import com.saasturnos.backend.domain.model.BloqueoHorario;
import com.saasturnos.backend.domain.model.Profesional;
import com.saasturnos.backend.infrastructure.repository.BloqueoHorarioRepository;
import com.saasturnos.backend.infrastructure.repository.ProfesionalRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class BloqueoHorarioService {

    private final BloqueoHorarioRepository bloqueoHorarioRepository;
    private final ProfesionalRepository profesionalRepository;

    public BloqueoHorarioService(
            BloqueoHorarioRepository bloqueoHorarioRepository,
            ProfesionalRepository profesionalRepository
    ) {
        this.bloqueoHorarioRepository = bloqueoHorarioRepository;
        this.profesionalRepository = profesionalRepository;
    }

    @Transactional(readOnly = true)
    public List<BloqueoHorarioResponse> listarPorProfesionalEnRango(
            Long profesionalId,
            OffsetDateTime desde,
            OffsetDateTime hasta
    ) {
        return bloqueoHorarioRepository.findSolapadosEnRango(profesionalId, desde, hasta)
                .stream()
                .map(BloqueoHorarioResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BloqueoHorarioResponse crearBloqueo(Long negocioId, CrearBloqueoRequest req) {
        Profesional profesional = profesionalRepository.findByIdAndNegocioId(req.profesionalId(), negocioId)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado con ID: " + req.profesionalId()));

        BloqueoHorario bloqueo = new BloqueoHorario(
                profesional,
                req.fechaHoraInicio(),
                req.fechaHoraFin(),
                req.motivo()
        );

        return BloqueoHorarioResponse.fromEntity(bloqueoHorarioRepository.save(bloqueo));
    }

    @Transactional
    public void eliminarBloqueo(Long bloqueoId) {
        if (!bloqueoHorarioRepository.existsById(bloqueoId)) {
            throw new EntityNotFoundException("Bloqueo no encontrado con ID: " + bloqueoId);
        }
        bloqueoHorarioRepository.deleteById(bloqueoId);
    }
}

