package com.saasturnos.backend.infrastructure.repository;

import com.saasturnos.backend.domain.model.HorarioLaboral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HorarioLaboralRepository extends JpaRepository<HorarioLaboral, Long> {

    List<HorarioLaboral> findByProfesionalIdAndActivoTrueOrderByDiaSemanaAscHoraInicioAsc(Long profesionalId);

    List<HorarioLaboral> findByProfesionalIdAndDiaSemanaAndActivoTrueOrderByHoraInicioAsc(
            Long profesionalId,
            Short diaSemana
    );
}

