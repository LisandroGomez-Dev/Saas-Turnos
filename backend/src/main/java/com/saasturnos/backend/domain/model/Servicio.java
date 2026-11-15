package com.saasturnos.backend.domain.model;

import com.saasturnos.backend.domain.exception.BusinessRuleException;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Entidad de Dominio que representa un Servicio o Prestación ofrecida por el negocio.
 * Aplica encapsulamiento estricto con setters privados y validación de invariantes (Estándar Cátedra POO).
 */
@Entity
@Table(name = "servicios")
public class Servicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracionMinutos;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(name = "requiere_sena", nullable = false)
    private Boolean requiereSena = false;

    @Column(name = "monto_sena", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoSena = BigDecimal.ZERO;

    @Column(nullable = false)
    private Boolean activo = true;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected Servicio() {}

    public Servicio(
            Negocio negocio,
            String nombre,
            String descripcion,
            Integer duracionMinutos,
            BigDecimal precio,
            Boolean requiereSena,
            BigDecimal montoSena
    ) {
        this.setNegocio(negocio);
        this.actualizarDatosYCondicionesComerciales(
                nombre,
                descripcion,
                duracionMinutos,
                precio,
                requiereSena,
                montoSena,
                true
        );
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // =========================================================================
    // MÉTODOS DE COMPORTAMIENTO DEL DOMINIO (Estándar Cátedra POO)
    // =========================================================================

    public void actualizarDatosYCondicionesComerciales(
            String nombre,
            String descripcion,
            Integer duracionMinutos,
            BigDecimal precio,
            Boolean requiereSena,
            BigDecimal montoSenaPropuesto,
            Boolean activoOpcional
    ) {
        if (nombre == null || nombre.isBlank()) {
            throw new BusinessRuleException("El nombre del servicio es obligatorio.");
        }
        if (duracionMinutos == null || duracionMinutos <= 0) {
            throw new BusinessRuleException("La duración del servicio debe ser mayor a cero minutos.");
        }
        if (precio == null || precio.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("El precio del servicio no puede ser negativo.");
        }

        boolean pideSena = Boolean.TRUE.equals(requiereSena);
        BigDecimal montoSenaValidado = BigDecimal.ZERO;

        if (pideSena) {
            if (montoSenaPropuesto == null || montoSenaPropuesto.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException("Si el servicio requiere seña, el monto de seña debe ser mayor a cero.");
            }
            if (montoSenaPropuesto.compareTo(precio) > 0) {
                throw new BusinessRuleException(
                        "El monto de la seña ($" + montoSenaPropuesto + ") no puede ser superior al precio total del servicio ($" + precio + ")."
                );
            }
            montoSenaValidado = montoSenaPropuesto;
        }

        this.setNombre(nombre.trim());
        this.setDescripcion(descripcion != null ? descripcion.trim() : null);
        this.setDuracionMinutos(duracionMinutos);
        this.setPrecio(precio);
        this.setRequiereSena(pideSena);
        this.setMontoSena(montoSenaValidado);

        if (activoOpcional != null) {
            this.setActivo(activoOpcional);
        }
    }

    public void cambiarEstadoActivo(boolean activo) {
        this.setActivo(activo);
    }

    // =========================================================================
    // SETTERS PRIVADOS (Estándar Cátedra POO: Invariantes protegidas)
    // =========================================================================

    private void setNegocio(Negocio negocio) { this.negocio = negocio; }
    private void setNombre(String nombre) { this.nombre = nombre; }
    private void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    private void setDuracionMinutos(Integer duracionMinutos) { this.duracionMinutos = duracionMinutos; }
    private void setPrecio(BigDecimal precio) { this.precio = precio; }
    private void setRequiereSena(Boolean requiereSena) { this.requiereSena = requiereSena; }
    private void setMontoSena(BigDecimal montoSena) { this.montoSena = montoSena; }
    private void setActivo(Boolean activo) { this.activo = activo; }

    // =========================================================================
    // GETTERS PÚBLICOS
    // =========================================================================

    public Long getId() { return this.id; }
    public Negocio getNegocio() { return this.negocio; }
    public String getNombre() { return this.nombre; }
    public String getDescripcion() { return this.descripcion; }
    public Integer getDuracionMinutos() { return this.duracionMinutos; }
    public BigDecimal getPrecio() { return this.precio; }
    public Boolean getRequiereSena() { return this.requiereSena; }
    public BigDecimal getMontoSena() { return this.montoSena; }
    public Boolean getActivo() { return this.activo; }
    public Long getVersion() { return this.version; }
    public OffsetDateTime getCreatedAt() { return this.createdAt; }
    public OffsetDateTime getUpdatedAt() { return this.updatedAt; }
}

