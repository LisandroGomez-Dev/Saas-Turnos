package com.saasturnos.backend.application.dto;

import com.saasturnos.backend.domain.model.BloqueoHorario;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public final class BloqueoHorarioDto {

    public record CrearBloqueoRequest(
            @NotNull(message = "El profesional es obligatorio")
            Long profesionalId,

            @NotNull(message = "La fecha y hora de inicio del bloqueo son obligatorias")
            OffsetDateTime fechaHoraInicio,

            @NotNull(message = "La fecha y hora de fin del bloqueo son obligatorias")
            OffsetDateTime fechaHoraFin,

            String motivo
    ) {}

    public record BloqueoHorarioResponse(
            Long id,
            Long profesionalId,
            String profesionalNombre,
            OffsetDateTime fechaHoraInicio,
            OffsetDateTime fechaHoraFin,
            String motivo
    ) {
        public static BloqueoHorarioResponse fromEntity(BloqueoHorario b) {
            return new BloqueoHorarioResponse(
                    b.getId(),
                    b.getProfesional().getId(),
                    b.getProfesional().getNombre(),
                    b.getFechaHoraInicio(),
                    b.getFechaHoraFin(),
                    b.getMotivo()
            );
        }
    }
}

