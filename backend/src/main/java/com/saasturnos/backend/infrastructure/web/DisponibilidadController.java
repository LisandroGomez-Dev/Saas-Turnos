package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.DisponibilidadDto.DisponibilidadDiaResponse;
import com.saasturnos.backend.application.service.DisponibilidadService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1")
public class DisponibilidadController {

    private final DisponibilidadService disponibilidadService;

    public DisponibilidadController(DisponibilidadService disponibilidadService) {
        this.disponibilidadService = disponibilidadService;
    }

    @GetMapping("/public/negocios/{slug}/disponibilidad")
    public ResponseEntity<DisponibilidadDiaResponse> consultarDisponibilidadPublica(
            @PathVariable String slug,
            @RequestParam Long servicioId,
            @RequestParam(required = false) Long profesionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        return ResponseEntity.ok(
                disponibilidadService.calcularDisponibilidadPorSlug(slug, servicioId, profesionalId, fecha)
        );
    }

    @GetMapping("/negocios/{negocioId}/disponibilidad")
    public ResponseEntity<DisponibilidadDiaResponse> consultarDisponibilidadAdmin(
            @PathVariable Long negocioId,
            @RequestParam Long servicioId,
            @RequestParam(required = false) Long profesionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        return ResponseEntity.ok(
                disponibilidadService.calcularDisponibilidad(negocioId, servicioId, profesionalId, fecha)
        );
    }
}

