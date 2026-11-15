package com.saasturnos.backend.application.service;

import com.saasturnos.backend.application.dto.HorarioLaboralDto.ConfigurarHorariosRequest;
import com.saasturnos.backend.application.dto.HorarioLaboralDto.FranjaHorariaRequest;
import com.saasturnos.backend.application.dto.HorarioLaboralDto.HorarioLaboralResponse;
import com.saasturnos.backend.domain.exception.BusinessRuleException;
import com.saasturnos.backend.domain.model.HorarioLaboral;
import com.saasturnos.backend.domain.model.Profesional;
import com.saasturnos.backend.infrastructure.repository.HorarioLaboralRepository;
import com.saasturnos.backend.infrastructure.repository.ProfesionalRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class HorarioLaboralService {

    private final HorarioLaboralRepository horarioLaboralRepository;
    private final ProfesionalRepository profesionalRepository;

    public HorarioLaboralService(
            HorarioLaboralRepository horarioLaboralRepository,
            ProfesionalRepository profesionalRepository
    ) {
        this.horarioLaboralRepository = horarioLaboralRepository;
        this.profesionalRepository = profesionalRepository;
    }

    @Transactional(readOnly = true)
    public List<HorarioLaboralResponse> listarPorProfesional(Long profesionalId) {
        return horarioLaboralRepository.findByProfesionalIdAndActivoTrueOrderByDiaSemanaAscHoraInicioAsc(profesionalId)
                .stream()
                .map(HorarioLaboralResponse::fromEntity)
                .toList();
    }

    @Transactional
    public List<HorarioLaboralResponse> configurarHorarios(Long profesionalId, ConfigurarHorariosRequest req) {
        Profesional profesional = profesionalRepository.findById(profesionalId)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado con ID: " + profesionalId));

        validarFranjas(req.franjas());

        // Reemplazo limpio y atómico: desactivar o eliminar franjas previas
        List<HorarioLaboral> anteriores = horarioLaboralRepository
                .findByProfesionalIdAndActivoTrueOrderByDiaSemanaAscHoraInicioAsc(profesionalId);
        horarioLaboralRepository.deleteAll(anteriores);

        List<HorarioLaboral> nuevas = new ArrayList<>();
        for (FranjaHorariaRequest f : req.franjas()) {
            nuevas.add(new HorarioLaboral(
                    profesional,
                    f.diaSemana(),
                    f.horaInicio(),
                    f.horaFin()
            ));
        }

        List<HorarioLaboral> guardadas = horarioLaboralRepository.saveAll(nuevas);
        return guardadas.stream().map(HorarioLaboralResponse::fromEntity).toList();
    }

    private void validarFranjas(List<FranjaHorariaRequest> franjas) {
        // Agrupar por día de la semana y ordenar por horaInicio para comprobar solapamientos
        Map<Short, List<FranjaHorariaRequest>> porDia = franjas.stream()
                .collect(Collectors.groupingBy(FranjaHorariaRequest::diaSemana));

        for (Map.Entry<Short, List<FranjaHorariaRequest>> entry : porDia.entrySet()) {
            List<FranjaHorariaRequest> lista = entry.getValue().stream()
                    .sorted(Comparator.comparing(FranjaHorariaRequest::horaInicio))
                    .toList();

            for (int i = 0; i < lista.size(); i++) {
                FranjaHorariaRequest actual = lista.get(i);
                if (!actual.horaFin().isAfter(actual.horaInicio())) {
                    throw new BusinessRuleException(
                            "La hora de fin (" + actual.horaFin() + ") debe ser posterior a la de inicio (" + actual.horaInicio() + ")."
                    );
                }

                if (i > 0) {
                    FranjaHorariaRequest anterior = lista.get(i - 1);
                    if (actual.horaInicio().isBefore(anterior.horaFin())) {
                        throw new BusinessRuleException(
                                "Existe solapamiento de horarios en el día " + entry.getKey() +
                                        " entre " + anterior.horaInicio() + "-" + anterior.horaFin() +
                                        " y " + actual.horaInicio() + "-" + actual.horaFin()
                        );
                    }
                }
            }
        }
    }
}

