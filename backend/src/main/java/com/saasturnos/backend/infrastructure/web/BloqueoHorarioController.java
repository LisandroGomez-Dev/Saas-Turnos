package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.BloqueoHorarioDto.BloqueoHorarioResponse;
import com.saasturnos.backend.application.dto.BloqueoHorarioDto.CrearBloqueoRequest;
import com.saasturnos.backend.application.service.BloqueoHorarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/negocios/{negocioId}/bloqueos")
public class BloqueoHorarioController {

    private final BloqueoHorarioService bloqueoHorarioService;

    public BloqueoHorarioController(BloqueoHorarioService bloqueoHorarioService) {
        this.bloqueoHorarioService = bloqueoHorarioService;
    }

    @GetMapping
    public ResponseEntity<List<BloqueoHorarioResponse>> listar(
            @PathVariable Long negocioId,
            @RequestParam Long profesionalId,
            @RequestParam OffsetDateTime desde,
            @RequestParam OffsetDateTime hasta
    ) {
        return ResponseEntity.ok(
                bloqueoHorarioService.listarPorProfesionalEnRango(profesionalId, desde, hasta)
        );
    }

    @PostMapping
    public ResponseEntity<BloqueoHorarioResponse> crear(
            @PathVariable Long negocioId,
            @Valid @RequestBody CrearBloqueoRequest req
    ) {
        BloqueoHorarioResponse response = bloqueoHorarioService.crearBloqueo(negocioId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{bloqueoId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long negocioId,
            @PathVariable Long bloqueoId
    ) {
        bloqueoHorarioService.eliminarBloqueo(bloqueoId);
        return ResponseEntity.noContent().build();
    }
}

