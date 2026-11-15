package com.saasturnos.backend.application.dto;

import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.EstadoTurno;
import com.saasturnos.backend.domain.model.Turno.MetodoPago;
import com.saasturnos.backend.domain.model.Turno.OrigenTurno;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public final class TurnoDto {

    public record CrearReservaPublicaRequest(
            @NotNull(message = "El servicio es obligatorio")
            Long servicioId,

            @NotNull(message = "El profesional es obligatorio")
            Long profesionalId,

            @NotNull(message = "La fecha y hora de inicio son obligatorias")
            OffsetDateTime fechaHoraInicio,

            @NotBlank(message = "Tu nombre y apellido son obligatorios")
            String clienteNombre,

            @NotBlank(message = "Tu número de WhatsApp es obligatorio")
            @Pattern(regexp = "^[0-9+() -]{8,25}$", message = "Ingresa un número de WhatsApp válido")
            String clienteTelefono,

            @Email(message = "El formato del correo electrónico no es válido")
            String clienteEmail,

            String notasCliente
    ) {}

    public record CrearTurnoManualRequest(
            @NotNull(message = "El servicio es obligatorio")
            Long servicioId,

            @NotNull(message = "El profesional es obligatorio")
            Long profesionalId,

            @NotNull(message = "La fecha y hora de inicio son obligatorias")
            OffsetDateTime fechaHoraInicio,

            @NotBlank(message = "El nombre del cliente es obligatorio")
            String clienteNombre,

            @NotBlank(message = "El teléfono del cliente es obligatorio")
            String clienteTelefono,

            String notasCliente,

            Boolean senaYaAbonada
    ) {}

    public record CompletarAtencionRequest(
            @NotNull(message = "El método de pago del saldo restante es obligatorio")
            MetodoPago metodoPagoResto
    ) {}

    public record TurnoResponse(
            Long id,
            String codigoReserva,
            Long negocioId,
            String negocioNombre,
            String negocioSlug,
            String negocioWhatsapp,
            Long profesionalId,
            String profesionalNombre,
            String profesionalColor,
            Long servicioId,
            String servicioNombre,
            Integer duracionMinutos,
            OffsetDateTime fechaHoraInicio,
            OffsetDateTime fechaHoraFin,
            String clienteNombre,
            String clienteTelefono,
            String clienteEmail,
            String notasCliente,
            EstadoTurno estado,
            BigDecimal precioTotal,
            BigDecimal montoSenaAcordado,
            BigDecimal montoSenaAbonado,
            BigDecimal montoRestanteCobrado,
            BigDecimal saldoPendiente,
            MetodoPago metodoPagoResto,
            OffsetDateTime expiraEn,
            OrigenTurno origen,
            Long version
    ) {
        public static TurnoResponse fromEntity(Turno t) {
            BigDecimal saldoPendiente = t.calcularSaldoPendiente();

            return new TurnoResponse(
                    t.getId(),
                    t.getCodigoReserva(),
                    t.getNegocio().getId(),
                    t.getNegocio().getNombre(),
                    t.getNegocio().getSlug(),
                    t.getNegocio().getTelefonoWhatsapp(),
                    t.getProfesional().getId(),
                    t.getProfesional().getNombre(),
                    t.getProfesional().getColorAgenda(),
                    t.getServicio().getId(),
                    t.getServicio().getNombre(),
                    t.getServicio().getDuracionMinutos(),
                    t.getFechaHoraInicio(),
                    t.getFechaHoraFin(),
                    t.getClienteNombre(),
                    t.getClienteTelefono(),
                    t.getClienteEmail(),
                    t.getNotasCliente(),
                    t.getEstado(),
                    t.getPrecioTotal(),
                    t.getMontoSenaAcordado(),
                    t.getMontoSenaAbonado(),
                    t.getMontoRestanteCobrado(),
                    saldoPendiente,
                    t.getMetodoPagoResto(),
                    t.getExpiraEn(),
                    t.getOrigen(),
                    t.getVersion()
            );
        }
    }
}

