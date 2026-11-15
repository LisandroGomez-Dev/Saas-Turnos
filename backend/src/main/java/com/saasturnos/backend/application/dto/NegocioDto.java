package com.saasturnos.backend.application.dto;

import com.saasturnos.backend.domain.model.Negocio;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class NegocioDto {

    public record ActualizarNegocioRequest(
            @NotBlank(message = "El nombre del negocio es obligatorio")
            String nombre,

            @NotBlank(message = "El teléfono de WhatsApp es obligatorio")
            @Pattern(regexp = "^[0-9+() -]{8,25}$", message = "Formato de WhatsApp inválido")
            String telefonoWhatsapp,

            String direccion,
            String descripcion,
            String logoUrl,

            @Min(value = 0, message = "Las horas mínimas de cancelación no pueden ser negativas")
            Integer cancelacionHorasMinimas
    ) {}

    public record NegocioResponse(
            Long id,
            String nombre,
            String slug,
            String rubro,
            String descripcion,
            String telefonoWhatsapp,
            String direccion,
            String logoUrl,
            Integer cancelacionHorasMinimas,
            Boolean activo
    ) {
        public static NegocioResponse fromEntity(Negocio n) {
            return new NegocioResponse(
                    n.getId(),
                    n.getNombre(),
                    n.getSlug(),
                    n.getRubro(),
                    n.getDescripcion(),
                    n.getTelefonoWhatsapp(),
                    n.getDireccion(),
                    n.getLogoUrl(),
                    n.getCancelacionHorasMinimas(),
                    n.getActivo()
            );
        }
    }
}

