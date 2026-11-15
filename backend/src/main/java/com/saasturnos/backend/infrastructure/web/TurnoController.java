package com.saasturnos.backend.infrastructure.web;

import com.saasturnos.backend.application.dto.TurnoDto.*;
import com.saasturnos.backend.application.service.TurnoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class TurnoController {

    private final TurnoService turnoService;

    public TurnoController(TurnoService turnoService) {
        this.turnoService = turnoService;
    }

    // =========================================================================
    // ENDPOINTS PÚBLICOS (Portal de Reservas de Clientes)
    // =========================================================================

    @PostMapping("/public/negocios/{slug}/reservas")
    public ResponseEntity<TurnoResponse> crearReservaPublica(
            @PathVariable String slug,
            @Valid @RequestBody CrearReservaPublicaRequest req
    ) {
        TurnoResponse response = turnoService.crearReservaPublica(slug, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/public/reservas/{codigoReserva}")
    public ResponseEntity<TurnoResponse> consultarPorCodigo(@PathVariable String codigoReserva) {
        return ResponseEntity.ok(turnoService.obtenerPorCodigoReserva(codigoReserva));
    }

    @PostMapping("/public/reservas/{codigoReserva}/cancelar")
    public ResponseEntity<TurnoResponse> cancelarPorCliente(@PathVariable String codigoReserva) {
        return ResponseEntity.ok(turnoService.cancelarPorCliente(codigoReserva));
    }

    // =========================================================================
    // ENDPOINTS ADMINISTRATIVOS (Agenda y Operatoria del Dueño)
    // =========================================================================

    @GetMapping("/negocios/{negocioId}/turnos")
    public ResponseEntity<List<TurnoResponse>> listarPorRangoFechas(
            @PathVariable Long negocioId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(turnoService.listarPorNegocioYFecha(negocioId, desde, hasta));
    }

    @PostMapping("/negocios/{negocioId}/turnos/manual")
    public ResponseEntity<TurnoResponse> crearTurnoManual(
            @PathVariable Long negocioId,
            @Valid @RequestBody CrearTurnoManualRequest req
    ) {
        TurnoResponse response = turnoService.crearTurnoManual(negocioId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/negocios/{negocioId}/turnos/{turnoId}/atender")
    public ResponseEntity<TurnoResponse> completarAtencion(
            @PathVariable Long negocioId,
            @PathVariable Long turnoId,
            @Valid @RequestBody CompletarAtencionRequest req
    ) {
        return ResponseEntity.ok(turnoService.completarAtencion(negocioId, turnoId, req));
    }

    @PostMapping("/negocios/{negocioId}/turnos/{turnoId}/ausente")
    public ResponseEntity<TurnoResponse> marcarAusente(
            @PathVariable Long negocioId,
            @PathVariable Long turnoId
    ) {
        return ResponseEntity.ok(turnoService.marcarAusente(negocioId, turnoId));
    }

    @PostMapping("/negocios/{negocioId}/turnos/{turnoId}/cancelar")
    public ResponseEntity<TurnoResponse> cancelarPorDueno(
            @PathVariable Long negocioId,
            @PathVariable Long turnoId
    ) {
        return ResponseEntity.ok(turnoService.cancelarPorDueño(negocioId, turnoId));
    }
}

