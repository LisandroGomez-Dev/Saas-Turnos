package com.saasturnos.backend.infrastructure.repository;

import com.saasturnos.backend.domain.model.Profesional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfesionalRepository extends JpaRepository<Profesional, Long> {

    List<Profesional> findByNegocioIdAndActivoTrueOrderByEsDuenoDescNombreAsc(Long negocioId);

    Optional<Profesional> findByIdAndNegocioId(Long id, Long negocioId);

    @Lock(LockModeType.OPTIMISTIC_FORCE_INCREMENT)
    @Query("SELECT p FROM Profesional p WHERE p.id = :id AND p.negocio.id = :negocioId AND p.activo = true")
    Optional<Profesional> findWithOptimisticLockByIdAndNegocioId(
            @Param("id") Long id,
            @Param("negocioId") Long negocioId
    );

    @Query("""
        SELECT DISTINCT p FROM Profesional p
        JOIN p.servicios s
        WHERE p.negocio.id = :negocioId
          AND p.activo = true
          AND s.id = :servicioId
        ORDER BY p.esDueno DESC, p.nombre ASC
    """)
    List<Profesional> findActivosByNegocioAndServicio(
            @Param("negocioId") Long negocioId,
            @Param("servicioId") Long servicioId
    );
}
