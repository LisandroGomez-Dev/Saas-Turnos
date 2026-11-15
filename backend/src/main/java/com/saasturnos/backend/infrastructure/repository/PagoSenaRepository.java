package com.saasturnos.backend.infrastructure.repository;

import com.saasturnos.backend.domain.model.PagoSena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PagoSenaRepository extends JpaRepository<PagoSena, Long> {

    boolean existsByMpPaymentId(String mpPaymentId);

    Optional<PagoSena> findByMpPaymentId(String mpPaymentId);

    Optional<PagoSena> findByMpPreferenceId(String mpPreferenceId);
}

