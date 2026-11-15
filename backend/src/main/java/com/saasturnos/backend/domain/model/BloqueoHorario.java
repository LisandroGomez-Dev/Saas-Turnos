package com.saasturnos.backend.domain.model;

import com.saasturnos.backend.domain.exception.BusinessRuleException;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Entidad de Dominio que representa un bloqueo excepcional de agenda de un Profesional.
 * Aplica encapsulamiento estricto con setters privados y validación de intervalo (Estándar Cátedra POO).
 */
@Entity
@Table(name = "bloqueos_horario")
public class BloqueoHorario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profesional_id", nullable = false)
    private Profesional profesional;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private OffsetDateTime fechaHoraInicio;

    @Column(name = "fecha_hora_fin", nullable = false)
    private OffsetDateTime fechaHoraFin;

    @Column(length = 200)
    private String motivo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected BloqueoHorario() {}

    public BloqueoHorario(
            Profesional profesional,
            OffsetDateTime fechaHoraInicio,
            OffsetDateTime fechaHoraFin,
            String motivo
    ) {
        if (fechaHoraInicio == null || fechaHoraFin == null || !fechaHoraFin.isAfter(fechaHoraInicio)) {
            throw new BusinessRuleException("La fecha y hora de fin del bloqueo debe ser posterior a la de inicio.");
        }
        this.setProfesional(profesional);
        this.setFechaHoraInicio(fechaHoraInicio);
        this.setFechaHoraFin(fechaHoraFin);
        this.setMotivo(motivo != null && !motivo.isBlank() ? motivo.trim() : "Bloqueo de agenda");
    }

    // =========================================================================
    // SETTERS PRIVADOS (Estándar Cátedra POO: Invariantes protegidas)
    // =========================================================================

    private void setProfesional(Profesional profesional) { this.profesional = profesional; }
    private void setFechaHoraInicio(OffsetDateTime fechaHoraInicio) { this.fechaHoraInicio = fechaHoraInicio; }
    private void setFechaHoraFin(OffsetDateTime fechaHoraFin) { this.fechaHoraFin = fechaHoraFin; }
    private void setMotivo(String motivo) { this.motivo = motivo; }

    // =========================================================================
    // GETTERS PÚBLICOS
    // =========================================================================

    public Long getId() { return this.id; }
    public Profesional getProfesional() { return this.profesional; }
    public OffsetDateTime getFechaHoraInicio() { return this.fechaHoraInicio; }
    public OffsetDateTime getFechaHoraFin() { return this.fechaHoraFin; }
    public String getMotivo() { return this.motivo; }
    public OffsetDateTime getCreatedAt() { return this.createdAt; }
}

