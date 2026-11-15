package com.saasturnos.backend.application.dto;

import com.saasturnos.backend.domain.model.HorarioLaboral;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.util.List;

public final class HorarioLaboralDto {

    public record FranjaHorariaRequest(
            @NotNull(message = "El día de la semana es obligatorio")
            @Min(value = 1, message = "El día debe estar entre 1 (Lunes) y 7 (Domingo)")
            @Max(value = 7, message = "El día debe estar entre 1 (Lunes) y 7 (Domingo)")
            Short diaSemana,

            @NotNull(message = "La hora de inicio es obligatoria")
            LocalTime horaInicio,

            @NotNull(message = "La hora de fin es obligatoria")
            LocalTime horaFin
    ) {}

    public record ConfigurarHorariosRequest(
            @NotNull(message = "La lista de franjas horarias no puede ser nula")
            List<@Valid FranjaHorariaRequest> franjas
    ) {}

    public record HorarioLaboralResponse(
            Long id,
            Short diaSemana,
            LocalTime horaInicio,
            LocalTime horaFin,
            Boolean activo
    ) {
        public static HorarioLaboralResponse fromEntity(HorarioLaboral h) {
            return new HorarioLaboralResponse(
                    h.getId(),
                    h.getDiaSemana(),
                    h.getHoraInicio(),
                    h.getHoraFin(),
                    h.getActivo()
            );
        }
    }
}

