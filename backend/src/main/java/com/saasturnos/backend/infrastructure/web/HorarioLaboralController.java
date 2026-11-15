package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.HorarioLaboralDto.ConfigurarHorariosRequest;
import com.saasturnos.backend.application.dto.HorarioLaboralDto.HorarioLaboralResponse;
import com.saasturnos.backend.application.service.HorarioLaboralService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profesionales/{profesionalId}/horarios")
public class HorarioLaboralController {

    private final HorarioLaboralService horarioLaboralService;

    public HorarioLaboralController(HorarioLaboralService horarioLaboralService) {
        this.horarioLaboralService = horarioLaboralService;
    }

    @GetMapping
    public ResponseEntity<List<HorarioLaboralResponse>> listar(@PathVariable Long profesionalId) {
        return ResponseEntity.ok(horarioLaboralService.listarPorProfesional(profesionalId));
    }

    @PutMapping
    public ResponseEntity<List<HorarioLaboralResponse>> configurarHorarios(
            @PathVariable Long profesionalId,
            @Valid @RequestBody ConfigurarHorariosRequest req
    ) {
        return ResponseEntity.ok(horarioLaboralService.configurarHorarios(profesionalId, req));
    }
}

