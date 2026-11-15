package com.saasturnos.backend.domain.model;

import com.saasturnos.backend.domain.exception.BusinessRuleException;
import jakarta.persistence.*;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * Entidad de Dominio que representa una franja de atención semanal de un Profesional.
 * Aplica encapsulamiento estricto con setters privados y validación de rango horario (Estándar Cátedra POO).
 */
@Entity
@Table(name = "horarios_laborales")
public class HorarioLaboral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profesional_id", nullable = false)
    private Profesional profesional;

    @Column(name = "dia_semana", nullable = false)
    private Short diaSemana; // 1 = Lunes ... 7 = Domingo

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected HorarioLaboral() {}

    public HorarioLaboral(Profesional profesional, Short diaSemana, LocalTime horaInicio, LocalTime horaFin) {
        if (diaSemana == null || diaSemana < 1 || diaSemana > 7) {
            throw new BusinessRuleException("El día de la semana debe estar comprendido entre 1 (Lunes) y 7 (Domingo).");
        }
        if (horaInicio == null || horaFin == null || !horaFin.isAfter(horaInicio)) {
            throw new BusinessRuleException("La hora de fin (" + horaFin + ") debe ser posterior a la de inicio (" + horaInicio + ").");
        }
        this.setProfesional(profesional);
        this.setDiaSemana(diaSemana);
        this.setHoraInicio(horaInicio);
        this.setHoraFin(horaFin);
        this.setActivo(true);
    }

    // =========================================================================
    // SETTERS PRIVADOS (Estándar Cátedra POO: Invariantes protegidas)
    // =========================================================================

    private void setProfesional(Profesional profesional) { this.profesional = profesional; }
    private void setDiaSemana(Short diaSemana) { this.diaSemana = diaSemana; }
    private void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }
    private void setHoraFin(LocalTime horaFin) { this.horaFin = horaFin; }
    private void setActivo(Boolean activo) { this.activo = activo; }

    // =========================================================================
    // GETTERS PÚBLICOS
    // =========================================================================

    public Long getId() { return this.id; }
    public Profesional getProfesional() { return this.profesional; }
    public Short getDiaSemana() { return this.diaSemana; }
    public LocalTime getHoraInicio() { return this.horaInicio; }
    public LocalTime getHoraFin() { return this.horaFin; }
    public Boolean getActivo() { return this.activo; }
    public OffsetDateTime getCreatedAt() { return this.createdAt; }
}

