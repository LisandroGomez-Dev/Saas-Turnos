package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.NegocioDto.ActualizarNegocioRequest;
import com.saasturnos.backend.application.dto.NegocioDto.NegocioResponse;
import com.saasturnos.backend.application.service.NegocioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/negocios")
public class NegocioController {

    private final NegocioService negocioService;

    public NegocioController(NegocioService negocioService) {
        this.negocioService = negocioService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<NegocioResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(negocioService.obtenerPorId(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<NegocioResponse> obtenerPorSlug(@PathVariable String slug) {
        return ResponseEntity.ok(negocioService.obtenerPorSlug(slug));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NegocioResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarNegocioRequest req
    ) {
        return ResponseEntity.ok(negocioService.actualizar(id, req));
    }
}

