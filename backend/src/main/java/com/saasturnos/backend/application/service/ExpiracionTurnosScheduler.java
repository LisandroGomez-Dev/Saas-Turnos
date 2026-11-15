package com.saasturnos.backend.application.service;

import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.EstadoTurno;
import com.saasturnos.backend.infrastructure.repository.TurnoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

import static com.saasturnos.backend.application.service.DisponibilidadService.ZONA_ARGENTINA;

@Component
public class ExpiracionTurnosScheduler {

    private static final Logger log = LoggerFactory.getLogger(ExpiracionTurnosScheduler.class);

    private final TurnoRepository turnoRepository;

    public ExpiracionTurnosScheduler(TurnoRepository turnoRepository) {
        this.turnoRepository = turnoRepository;
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void liberarTurnosConPagoExpirado() {
        OffsetDateTime ahora = OffsetDateTime.now(ZONA_ARGENTINA);
        List<Turno> vencidos = turnoRepository.findByEstadoAndExpiraEnBefore(EstadoTurno.PENDIENTE_PAGO, ahora);

        if (vencidos.isEmpty()) {
            return;
        }

        for (Turno t : vencidos) {
            t.expirarPorFaltaDePago();
        }
        turnoRepository.saveAll(vencidos);
        log.info("Se liberaron {} turnos con tiempo de pago de seña expirado.", vencidos.size());
    }
}

