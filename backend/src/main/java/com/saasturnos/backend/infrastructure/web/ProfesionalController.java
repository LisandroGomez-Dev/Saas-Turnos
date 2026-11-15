package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.ProfesionalDto.ActualizarProfesionalRequest;
import com.saasturnos.backend.application.dto.ProfesionalDto.CrearProfesionalRequest;
import com.saasturnos.backend.application.dto.ProfesionalDto.ProfesionalResponse;
import com.saasturnos.backend.application.service.ProfesionalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/negocios/{negocioId}/profesionales")
public class ProfesionalController {

    private final ProfesionalService profesionalService;

    public ProfesionalController(ProfesionalService profesionalService) {
        this.profesionalService = profesionalService;
    }

    @GetMapping
    public ResponseEntity<List<ProfesionalResponse>> listar(@PathVariable Long negocioId) {
        return ResponseEntity.ok(profesionalService.listarPorNegocio(negocioId));
    }

    @GetMapping("/por-servicio/{servicioId}")
    public ResponseEntity<List<ProfesionalResponse>> listarPorServicio(
            @PathVariable Long negocioId,
            @PathVariable Long servicioId
    ) {
        return ResponseEntity.ok(profesionalService.listarPorServicio(negocioId, servicioId));
    }

    @GetMapping("/{profesionalId}")
    public ResponseEntity<ProfesionalResponse> obtenerPorId(
            @PathVariable Long negocioId,
            @PathVariable Long profesionalId
    ) {
        return ResponseEntity.ok(profesionalService.obtenerPorId(negocioId, profesionalId));
    }

    @PostMapping
    public ResponseEntity<ProfesionalResponse> crear(
            @PathVariable Long negocioId,
            @Valid @RequestBody CrearProfesionalRequest req
    ) {
        ProfesionalResponse response = profesionalService.crear(negocioId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{profesionalId}")
    public ResponseEntity<ProfesionalResponse> actualizar(
            @PathVariable Long negocioId,
            @PathVariable Long profesionalId,
            @Valid @RequestBody ActualizarProfesionalRequest req
    ) {
        return ResponseEntity.ok(profesionalService.actualizar(negocioId, profesionalId, req));
    }
}

