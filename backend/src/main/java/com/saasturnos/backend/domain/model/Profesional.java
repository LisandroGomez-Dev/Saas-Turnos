package com.saasturnos.backend.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Entidad de Dominio que representa a un Profesional o Colaborador del negocio.
 * Aplica encapsulamiento de colecciones e inicialización en constructor (Estándar Cátedra POO).
 */
@Entity
@Table(name = "profesionales")
public class Profesional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 120)
    private String especialidad;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "color_agenda", nullable = false, length = 20)
    private String colorAgenda = "#4F46E5";

    @Column(name = "es_dueno", nullable = false)
    private Boolean esDueno = false;

    @Column(nullable = false)
    private Boolean activo = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "profesional_servicios",
            joinColumns = @JoinColumn(name = "profesional_id"),
            inverseJoinColumns = @JoinColumn(name = "servicio_id")
    )
    private Set<Servicio> servicios;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    /**
     * Constructor por defecto con inicialización de colección (Estándar Cátedra POO).
     */
    public Profesional() {
        this.setServicios(new HashSet<>());
    }

    public Profesional(
            Negocio negocio,
            String nombre,
            String especialidad,
            String avatarUrl,
            String colorAgenda,
            boolean esDueno
    ) {
        this.setNegocio(negocio);
        this.setNombre(nombre != null ? nombre.trim() : null);
        this.setEspecialidad(especialidad != null ? especialidad.trim() : null);
        this.setAvatarUrl(avatarUrl != null ? avatarUrl.trim() : null);
        this.setColorAgenda(colorAgenda != null && !colorAgenda.isBlank() ? colorAgenda.trim() : "#4F46E5");
        this.setEsDueno(esDueno);
        this.setActivo(true);
        this.setServicios(new HashSet<>());
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public void actualizarPerfilProfesional(
            String nombre,
            String especialidad,
            String avatarUrl,
            String colorAgenda,
            Boolean activoOpcional
    ) {
        this.setNombre(nombre != null ? nombre.trim() : this.getNombre());
        this.setEspecialidad(especialidad != null ? especialidad.trim() : null);
        this.setAvatarUrl(avatarUrl != null ? avatarUrl.trim() : null);
        if (colorAgenda != null && !colorAgenda.isBlank()) {
            this.setColorAgenda(colorAgenda.trim());
        }
        if (activoOpcional != null) {
            this.setActivo(activoOpcional);
        }
    }

    // =========================================================================
    // MÉTODOS DE GESTIÓN DE COLECCIÓN ENCAPSULADA (Estándar Cátedra POO)
    // =========================================================================

    public boolean asignarServicio(Servicio servicio) {
        if (servicio == null) {
            return false;
        }
        return this.servicios.add(servicio);
    }

    public boolean quitarServicio(Servicio servicio) {
        if (servicio == null) {
            return false;
        }
        return this.servicios.remove(servicio);
    }

    public void reemplazarServicios(Collection<Servicio> nuevosServicios) {
        this.servicios.clear();
        if (nuevosServicios != null) {
            this.servicios.addAll(nuevosServicios);
        }
    }

    public boolean realizaServicio(Long servicioId) {
        if (servicioId == null) {
            return false;
        }
        return this.servicios.stream()
                .anyMatch(s -> servicioId.equals(s.getId()));
    }

    public int cantidadDeServicios() {
        return this.servicios.size();
    }

    // =========================================================================
    // SETTERS PRIVADOS (Estándar Cátedra POO: Invariantes protegidas)
    // =========================================================================

    private void setServicios(Set<Servicio> servicios) { this.servicios = servicios; }
    private void setNegocio(Negocio negocio) { this.negocio = negocio; }
    private void setUsuario(Usuario usuario) { this.usuario = usuario; }
    private void setNombre(String nombre) { this.nombre = nombre; }
    private void setEspecialidad(String especialidad) { this.especialidad = especialidad; }
    private void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    private void setColorAgenda(String colorAgenda) { this.colorAgenda = colorAgenda; }
    private void setEsDueno(Boolean esDueno) { this.esDueno = esDueno; }
    private void setActivo(Boolean activo) { this.activo = activo; }

    // =========================================================================
    // GETTERS PÚBLICOS
    // =========================================================================

    public Long getId() { return this.id; }
    public Negocio getNegocio() { return this.negocio; }
    public Usuario getUsuario() { return this.usuario; }
    public String getNombre() { return this.nombre; }
    public String getEspecialidad() { return this.especialidad; }
    public String getAvatarUrl() { return this.avatarUrl; }
    public String getColorAgenda() { return this.colorAgenda; }
    public Boolean getEsDueno() { return this.esDueno; }
    public Boolean getActivo() { return this.activo; }
    public Set<Servicio> getServicios() { return Collections.unmodifiableSet(this.servicios); }
    public Long getVersion() { return this.version; }
    public OffsetDateTime getCreatedAt() { return this.createdAt; }
    public OffsetDateTime getUpdatedAt() { return this.updatedAt; }
}
