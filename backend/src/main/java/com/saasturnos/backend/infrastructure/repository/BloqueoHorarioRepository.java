package com.saasturnos.backend.infrastructure.repository;

import com.saasturnos.backend.domain.model.BloqueoHorario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface BloqueoHorarioRepository extends JpaRepository<BloqueoHorario, Long> {

    @Query("""
        SELECT b FROM BloqueoHorario b
        WHERE b.profesional.id = :profesionalId
          AND b.fechaHoraInicio < :rangoFin
          AND b.fechaHoraFin > :rangoInicio
        ORDER BY b.fechaHoraInicio ASC
    """)
    List<BloqueoHorario> findSolapadosEnRango(
            @Param("profesionalId") Long profesionalId,
            @Param("rangoInicio") OffsetDateTime rangoInicio,
            @Param("rangoFin") OffsetDateTime rangoFin
    );
}

