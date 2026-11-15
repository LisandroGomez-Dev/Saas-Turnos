package com.saasturnos.backend.application.dto;

import com.saasturnos.backend.domain.model.Profesional;
import com.saasturnos.backend.domain.model.Servicio;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.Set;
import java.util.stream.Collectors;

public final class ProfesionalDto {

    public record CrearProfesionalRequest(
            @NotBlank(message = "El nombre del profesional es obligatorio")
            String nombre,

            String especialidad,
            String avatarUrl,

            @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "El color debe ser un código HEX válido (ej. #4F46E5)")
            String colorAgenda,

            Boolean esDueno,
            Set<Long> servicioIds
    ) {}

    public record ActualizarProfesionalRequest(
            @NotBlank(message = "El nombre del profesional es obligatorio")
            String nombre,

            String especialidad,
            String avatarUrl,

            @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "El color debe ser un código HEX válido (ej. #4F46E5)")
            String colorAgenda,

            Boolean activo,
            Set<Long> servicioIds
    ) {}

    public record ProfesionalResponse(
            Long id,
            String nombre,
            String especialidad,
            String avatarUrl,
            String colorAgenda,
            Boolean esDueno,
            Boolean activo,
            Set<Long> servicioIds,
            Long version
    ) {
        public static ProfesionalResponse fromEntity(Profesional p) {
            Set<Long> sIds = p.getServicios() == null ? Set.of()
                    : p.getServicios().stream().map(Servicio::getId).collect(Collectors.toSet());

            return new ProfesionalResponse(
                    p.getId(),
                    p.getNombre(),
                    p.getEspecialidad(),
                    p.getAvatarUrl(),
                    p.getColorAgenda(),
                    p.getEsDueno(),
                    p.getActivo(),
                    sIds,
                    p.getVersion()
            );
        }
    }
}

