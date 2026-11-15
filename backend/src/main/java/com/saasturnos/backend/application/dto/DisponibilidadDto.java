package com.saasturnos.backend.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public final class DisponibilidadDto {

    public record SlotDisponibleResponse(
            OffsetDateTime fechaHoraInicio,
            OffsetDateTime fechaHoraFin,
            String horaInicioFormateada,
            String horaFinFormateada,
            Long profesionalId,
            String profesionalNombre,
            String profesionalColor
    ) {}

    public record DisponibilidadDiaResponse(
            LocalDate fecha,
            Long servicioId,
            String servicioNombre,
            Integer duracionMinutos,
            BigDecimal precioTotal,
            Boolean requiereSena,
            BigDecimal montoSena,
            List<SlotDisponibleResponse> slotsDisponibles
    ) {}
}

