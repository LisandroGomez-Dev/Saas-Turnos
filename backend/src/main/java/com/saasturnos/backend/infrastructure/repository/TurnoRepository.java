package com.saasturnos.backend.infrastructure.repository;

import com.saasturnos.backend.domain.model.Turno;
import com.saasturnos.backend.domain.model.Turno.EstadoTurno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {

    Optional<Turno> findByCodigoReserva(String codigoReserva);

    @Query("""
        SELECT t FROM Turno t
        WHERE t.profesional.id = :profesionalId
          AND t.estado IN :estadosOcupados
          AND t.fechaHoraInicio < :rangoFin
          AND t.fechaHoraFin > :rangoInicio
        ORDER BY t.fechaHoraInicio ASC
    """)
    List<Turno> findTurnosOcupadosSolapados(
            @Param("profesionalId") Long profesionalId,
            @Param("rangoInicio") OffsetDateTime rangoInicio,
            @Param("rangoFin") OffsetDateTime rangoFin,
            @Param("estadosOcupados") Collection<EstadoTurno> estadosOcupados
    );

    @Query("""
        SELECT t FROM Turno t
        JOIN FETCH t.profesional
        JOIN FETCH t.servicio
        WHERE t.negocio.id = :negocioId
          AND t.fechaHoraInicio >= :desde
          AND t.fechaHoraInicio < :hasta
        ORDER BY t.fechaHoraInicio ASC
    """)
    List<Turno> findByNegocioAndRangoFechas(
            @Param("negocioId") Long negocioId,
            @Param("desde") OffsetDateTime desde,
            @Param("hasta") OffsetDateTime hasta
    );

    List<Turno> findByEstadoAndExpiraEnBefore(EstadoTurno estado, OffsetDateTime ahora);
}

