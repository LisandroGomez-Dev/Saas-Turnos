package com.saasturnos.backend.application.dto;

import com.saasturnos.backend.domain.model.Servicio;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public final class ServicioDto {

    public record CrearServicioRequest(
            @NotBlank(message = "El nombre del servicio es obligatorio")
            String nombre,

            String descripcion,

            @NotNull(message = "La duración en minutos es obligatoria")
            @Min(value = 5, message = "La duración mínima es de 5 minutos")
            @Max(value = 480, message = "La duración máxima es de 480 minutos (8 horas)")
            Integer duracionMinutos,

            @NotNull(message = "El precio es obligatorio")
            @Positive(message = "El precio debe ser un número positivo")
            BigDecimal precio,

            Boolean requiereSena,

            @PositiveOrZero(message = "El monto de seña no puede ser negativo")
            BigDecimal montoSena
    ) {}

    public record ActualizarServicioRequest(
            @NotBlank(message = "El nombre del servicio es obligatorio")
            String nombre,

            String descripcion,

            @NotNull(message = "La duración en minutos es obligatoria")
            @Min(value = 5, message = "La duración mínima es de 5 minutos")
            @Max(value = 480, message = "La duración máxima es de 480 minutos")
            Integer duracionMinutos,

            @NotNull(message = "El precio es obligatorio")
            @Positive(message = "El precio debe ser un número positivo")
            BigDecimal precio,

            Boolean requiereSena,

            @PositiveOrZero(message = "El monto de seña no puede ser negativo")
            BigDecimal montoSena,

            Boolean activo
    ) {}

    public record ServicioResponse(
            Long id,
            String nombre,
            String descripcion,
            Integer duracionMinutos,
            BigDecimal precio,
            Boolean requiereSena,
            BigDecimal montoSena,
            Boolean activo,
            Long version
    ) {
        public static ServicioResponse fromEntity(Servicio s) {
            return new ServicioResponse(
                    s.getId(),
                    s.getNombre(),
                    s.getDescripcion(),
                    s.getDuracionMinutos(),
                    s.getPrecio(),
                    s.getRequiereSena(),
                    s.getMontoSena(),
                    s.getActivo(),
                    s.getVersion()
            );
        }
    }
}

