package com.saasturnos.backend.domain.model;

import com.saasturnos.backend.domain.exception.BusinessRuleException;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Entidad de Dominio que representa a un Negocio / Establecimiento adherido al SaaS.
 * Aplica encapsulamiento estricto con setters privados y métodos de negocio (Estándar Cátedra POO).
 */
@Entity
@Table(name = "negocios")
public class Negocio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, length = 50)
    private String rubro = "GENERAL";

    @Column(length = 500)
    private String descripcion;

    @Column(name = "telefono_whatsapp", nullable = false, length = 30)
    private String telefonoWhatsapp;

    @Column(length = 255)
    private String direccion;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "cancelacion_horas_minimas", nullable = false)
    private Integer cancelacionHorasMinimas = 24;

    @Column(nullable = false)
    private Boolean activo = true;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected Negocio() {}

    public Negocio(String nombre, String slug, String telefonoWhatsapp) {
        this.setNombre(nombre != null ? nombre.trim() : null);
        this.setSlug(slug != null ? slug.trim().toLowerCase() : null);
        this.setTelefonoWhatsapp(telefonoWhatsapp != null ? telefonoWhatsapp.trim() : null);
        this.setRubro("GENERAL");
        this.setCancelacionHorasMinimas(24);
        this.setActivo(true);
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // =========================================================================
    // MÉTODOS DE COMPORTAMIENTO DEL DOMINIO (Estándar Cátedra POO)
    // =========================================================================

    public void actualizarPerfilComercial(
            String nombre,
            String telefonoWhatsapp,
            String direccion,
            String descripcion,
            String logoUrl,
            Integer cancelacionHorasMinimas
    ) {
        if (nombre == null || nombre.isBlank()) {
            throw new BusinessRuleException("El nombre del negocio no puede estar vacío.");
        }
        if (telefonoWhatsapp == null || telefonoWhatsapp.isBlank()) {
            throw new BusinessRuleException("El teléfono de WhatsApp del negocio es obligatorio.");
        }
        this.setNombre(nombre.trim());
        this.setTelefonoWhatsapp(telefonoWhatsapp.trim());
        this.setDireccion(direccion != null ? direccion.trim() : null);
        this.setDescripcion(descripcion != null ? descripcion.trim() : null);
        if (logoUrl != null) {
            this.setLogoUrl(logoUrl.trim());
        }
        if (cancelacionHorasMinimas != null) {
            if (cancelacionHorasMinimas < 0) {
                throw new BusinessRuleException("Las horas mínimas de cancelación no pueden ser negativas.");
            }
            this.setCancelacionHorasMinimas(cancelacionHorasMinimas);
        }
    }

    // =========================================================================
    // SETTERS PRIVADOS (Estándar Cátedra POO: Invariantes protegidas)
    // =========================================================================

    private void setNombre(String nombre) { this.nombre = nombre; }
    private void setSlug(String slug) { this.slug = slug; }
    private void setRubro(String rubro) { this.rubro = rubro; }
    private void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    private void setTelefonoWhatsapp(String telefonoWhatsapp) { this.telefonoWhatsapp = telefonoWhatsapp; }
    private void setDireccion(String direccion) { this.direccion = direccion; }
    private void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    private void setCancelacionHorasMinimas(Integer cancelacionHorasMinimas) { this.cancelacionHorasMinimas = cancelacionHorasMinimas; }
    private void setActivo(Boolean activo) { this.activo = activo; }

    // =========================================================================
    // GETTERS PÚBLICOS
    // =========================================================================

    public Long getId() { return this.id; }
    public String getNombre() { return this.nombre; }
    public String getSlug() { return this.slug; }
    public String getRubro() { return this.rubro; }
    public String getDescripcion() { return this.descripcion; }
    public String getTelefonoWhatsapp() { return this.telefonoWhatsapp; }
    public String getDireccion() { return this.direccion; }
    public String getLogoUrl() { return this.logoUrl; }
    public Integer getCancelacionHorasMinimas() { return this.cancelacionHorasMinimas; }
    public Boolean getActivo() { return this.activo; }
    public Long getVersion() { return this.version; }
    public OffsetDateTime getCreatedAt() { return this.createdAt; }
    public OffsetDateTime getUpdatedAt() { return this.updatedAt; }
}

