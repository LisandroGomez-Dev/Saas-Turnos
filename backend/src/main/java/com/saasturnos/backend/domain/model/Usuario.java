package com.saasturnos.backend.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Entidad de Dominio que representa a un Usuario autenticado de un negocio.
 * Aplica encapsulamiento estricto con setters privados (Estándar Cátedra POO).
 */
@Entity
@Table(name = "usuarios")
public class Usuario {

    public enum RolUsuario {
        OWNER,
        EMPLOYEE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RolUsuario rol = RolUsuario.OWNER;

    @Column(nullable = false)
    private Boolean activo = true;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected Usuario() {}

    public Usuario(Negocio negocio, String nombre, String email, String passwordHash, RolUsuario rol) {
        this.setNegocio(negocio);
        this.setNombre(nombre != null ? nombre.trim() : null);
        this.setEmail(email != null ? email.trim().toLowerCase() : null);
        this.setPasswordHash(passwordHash);
        this.setRol(rol != null ? rol : RolUsuario.OWNER);
        this.setActivo(true);
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public void actualizarPerfil(String nombre, String email) {
        if (nombre != null && !nombre.isBlank()) {
            this.setNombre(nombre.trim());
        }
        if (email != null && !email.isBlank()) {
            this.setEmail(email.trim().toLowerCase());
        }
    }

    public void cambiarEstadoActivo(boolean activo) {
        this.setActivo(activo);
    }

    // =========================================================================
    // SETTERS PRIVADOS (Estándar Cátedra POO)
    // =========================================================================

    private void setNegocio(Negocio negocio) { this.negocio = negocio; }
    private void setNombre(String nombre) { this.nombre = nombre; }
    private void setEmail(String email) { this.email = email; }
    private void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    private void setRol(RolUsuario rol) { this.rol = rol; }
    private void setActivo(Boolean activo) { this.activo = activo; }

    // =========================================================================
    // GETTERS PÚBLICOS
    // =========================================================================

    public Long getId() { return this.id; }
    public Negocio getNegocio() { return this.negocio; }
    public String getNombre() { return this.nombre; }
    public String getEmail() { return this.email; }
    public String getPasswordHash() { return this.passwordHash; }
    public RolUsuario getRol() { return this.rol; }
    public Boolean getActivo() { return this.activo; }
    public Long getVersion() { return this.version; }
    public OffsetDateTime getCreatedAt() { return this.createdAt; }
    public OffsetDateTime getUpdatedAt() { return this.updatedAt; }
}

