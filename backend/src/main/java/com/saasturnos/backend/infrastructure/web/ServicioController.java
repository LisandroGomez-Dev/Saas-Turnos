package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.ServicioDto.ActualizarServicioRequest;
import com.saasturnos.backend.application.dto.ServicioDto.CrearServicioRequest;
import com.saasturnos.backend.application.dto.ServicioDto.ServicioResponse;
import com.saasturnos.backend.application.service.ServicioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/negocios/{negocioId}/servicios")
public class ServicioController {

    private final ServicioService servicioService;

    public ServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @GetMapping
    public ResponseEntity<List<ServicioResponse>> listar(@PathVariable Long negocioId) {
        return ResponseEntity.ok(servicioService.listarPorNegocio(negocioId));
    }

    @GetMapping("/{servicioId}")
    public ResponseEntity<ServicioResponse> obtenerPorId(
            @PathVariable Long negocioId,
            @PathVariable Long servicioId
    ) {
        return ResponseEntity.ok(servicioService.obtenerPorId(negocioId, servicioId));
    }

    @PostMapping
    public ResponseEntity<ServicioResponse> crear(
            @PathVariable Long negocioId,
            @Valid @RequestBody CrearServicioRequest req
    ) {
        ServicioResponse response = servicioService.crear(negocioId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{servicioId}")
    public ResponseEntity<ServicioResponse> actualizar(
            @PathVariable Long negocioId,
            @PathVariable Long servicioId,
            @Valid @RequestBody ActualizarServicioRequest req
    ) {
        return ResponseEntity.ok(servicioService.actualizar(negocioId, servicioId, req));
    }

    @PatchMapping("/{servicioId}/estado")
    public ResponseEntity<Void> cambiarEstado(
            @PathVariable Long negocioId,
            @PathVariable Long servicioId,
            @RequestParam boolean activo
    ) {
        servicioService.cambiarEstado(negocioId, servicioId, activo);
        return ResponseEntity.noContent().build();
    }
}

