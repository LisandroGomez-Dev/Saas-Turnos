package com.saasturnos.backend.infrastructure.repository;

import com.saasturnos.backend.domain.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServicioRepository extends JpaRepository<Servicio, Long> {

    List<Servicio> findByNegocioIdAndActivoTrueOrderByNombreAsc(Long negocioId);

    Optional<Servicio> findByIdAndNegocioId(Long id, Long negocioId);
}

