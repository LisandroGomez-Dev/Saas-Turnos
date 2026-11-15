package com.saasturnos.backend.infrastructure.repository;

import com.saasturnos.backend.domain.model.Negocio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NegocioRepository extends JpaRepository<Negocio, Long> {
    Optional<Negocio> findBySlugAndActivoTrue(String slug);
    boolean existsBySlug(String slug);
}

