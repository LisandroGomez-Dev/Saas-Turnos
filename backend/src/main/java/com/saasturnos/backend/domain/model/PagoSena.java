package com.saasturnos.backend.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Entidad de Dominio Rico que representa una transacción de pago de seña en Mercado Pago.
 * Aplica:
 * - Setters privados para proteger la integridad de auditoría financiera (Estándar Cátedra POO).
 * - Factory Methods para instanciación controlada.
 * - Métodos de dominio semánticos (aprobarPago, rechazarPago).
 */
@Entity
@Table(name = "pagos_sena")
public class PagoSena {

    public enum EstadoPago {
        PENDING,
        APPROVED,
        REJECTED,
        REFUNDED,
        CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turno_id", nullable = false)
    private Turno turno;

    @Column(name = "mp_preference_id", length = 150)
    private String mpPreferenceId;

    @Column(name = "mp_payment_id", unique = true, length = 100)
    private String mpPaymentId;

    @Column(name = "mp_request_id", length = 150)
    private String mpRequestId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoPago estado = EstadoPago.PENDING;

    @Column(name = "fecha_pago")
    private OffsetDateTime fechaPago;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public PagoSena() {}

    // =========================================================================
    // PATRÓN FACTORY METHOD
    // =========================================================================

    public static PagoSena crearPreferenciaPendiente(Turno turno, String mpPreferenceId, BigDecimal monto) {
        PagoSena pago = new PagoSena();
        pago.setTurno(turno);
        pago.setMpPreferenceId(mpPreferenceId);
        pago.setMonto(monto);
        pago.setEstado(EstadoPago.PENDING);
        return pago;
    }

    public static PagoSena registrarNotificacionWebhook(
            Turno turno,
            String mpPaymentId,
            String mpRequestId,
            BigDecimal monto,
            OffsetDateTime fechaPago
    ) {
        PagoSena pago = new PagoSena();
        pago.setTurno(turno);
        pago.setMpPaymentId(mpPaymentId);
        pago.setMpRequestId(mpRequestId);
        pago.setMonto(monto);
        pago.setFechaPago(fechaPago);
        pago.setEstado(EstadoPago.PENDING);
        return pago;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // =========================================================================
    // MÉTODOS DE NEGOCIO CON SEMÁNTICA DE DOMINIO
    // =========================================================================

    public void actualizarDatosPreferencia(Turno turno, String mpPreferenceId, BigDecimal monto) {
        this.setTurno(turno);
        this.setMpPreferenceId(mpPreferenceId);
        this.setMonto(monto);
        this.setEstado(EstadoPago.PENDING);
    }

    public void aprobarPago() {
        this.setEstado(EstadoPago.APPROVED);
    }

    public void rechazarPago() {
        this.setEstado(EstadoPago.REJECTED);
    }

    public void mantenerPendiente() {
        this.setEstado(EstadoPago.PENDING);
    }

    // =========================================================================
    // SETTERS PRIVADOS (Estándar Cátedra POO)
    // =========================================================================

    private void setTurno(Turno turno) {
        this.turno = turno;
    }

    private void setMpPreferenceId(String mpPreferenceId) {
        this.mpPreferenceId = mpPreferenceId;
    }

    private void setMpPaymentId(String mpPaymentId) {
        this.mpPaymentId = mpPaymentId;
    }

    private void setMpRequestId(String mpRequestId) {
        this.mpRequestId = mpRequestId;
    }

    private void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    private void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    private void setFechaPago(OffsetDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }

    // =========================================================================
    // GETTERS PÚBLICOS
    // =========================================================================

    public Long getId() { return this.id; }
    public Turno getTurno() { return this.turno; }
    public String getMpPreferenceId() { return this.mpPreferenceId; }
    public String getMpPaymentId() { return this.mpPaymentId; }
    public String getMpRequestId() { return this.mpRequestId; }
    public BigDecimal getMonto() { return this.monto; }
    public EstadoPago getEstado() { return this.estado; }
    public OffsetDateTime getFechaPago() { return this.fechaPago; }
    public Long getVersion() { return this.version; }
    public OffsetDateTime getCreatedAt() { return this.createdAt; }
    public OffsetDateTime getUpdatedAt() { return this.updatedAt; }
}
