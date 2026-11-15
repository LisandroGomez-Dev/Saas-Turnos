package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.MetricasCajaDto.ResumenCajaMetricasResponse;
import com.saasturnos.backend.application.service.MetricasCajaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/negocios/{negocioId}/metricas-caja")
public class MetricasCajaController {

    private final MetricasCajaService metricasCajaService;

    public MetricasCajaController(MetricasCajaService metricasCajaService) {
        this.metricasCajaService = metricasCajaService;
    }

    @GetMapping
    public ResponseEntity<ResumenCajaMetricasResponse> obtenerResumenCaja(
            @PathVariable Long negocioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(metricasCajaService.calcularMetricasCaja(negocioId, desde, hasta));
    }
}

