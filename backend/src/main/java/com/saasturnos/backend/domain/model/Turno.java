package com.saasturnos.backend.domain.model;

import com.saasturnos.backend.domain.exception.BusinessRuleException;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Set;

/**
 * Entidad de Dominio Rico que representa un Turno reservado.
 * Aplica:
 * - Encapsulamiento estricto con setters privados (Estándar Cátedra POO).
 * - Patrón State en {@link EstadoTurno} para validar transiciones del ciclo de vida.
 * - Patrón Factory Method para garantizar la creación consistente de reservas web y manuales.
 */
@Entity
@Table(name = "turnos")
public class Turno {

    /**
     * Patrón State implementado sobre el enum de estados del turno.
     * Cada estado define explícitamente a qué estados válidos puede transicionar.
     */
    public enum EstadoTurno {
        PENDIENTE_PAGO {
            @Override
            public Set<EstadoTurno> transicionesPermitidas() {
                return Set.of(SENADO, CONFIRMADO, CANCELADO, EXPIRADO);
            }
        },
        CONFIRMADO {
            @Override
            public Set<EstadoTurno> transicionesPermitidas() {
                return Set.of(SENADO, ATENDIDO, AUSENTE, CANCELADO);
            }
        },
        SENADO {
            @Override
            public Set<EstadoTurno> transicionesPermitidas() {
                return Set.of(SENADO, ATENDIDO, AUSENTE, CANCELADO);
            }
        },
        ATENDIDO {
            @Override
            public Set<EstadoTurno> transicionesPermitidas() {
                return Set.of(); // Estado terminal: un turno ya atendido no puede mutar de estado
            }
        },
        AUSENTE {
            @Override
            public Set<EstadoTurno> transicionesPermitidas() {
                return Set.of(); // Estado terminal
            }
        },
        CANCELADO {
            @Override
            public Set<EstadoTurno> transicionesPermitidas() {
                return Set.of(); // Estado terminal
            }
        },
        EXPIRADO {
            @Override
            public Set<EstadoTurno> transicionesPermitidas() {
                return Set.of(); // Estado terminal
            }
        };

        public abstract Set<EstadoTurno> transicionesPermitidas();

        public void validarTransicionHacia(EstadoTurno nuevoEstado) {
            if (!this.transicionesPermitidas().contains(nuevoEstado)) {
                throw new BusinessRuleException(
                        "Transición de estado inválida: el turno se encuentra en estado "
                                + this.name() + " y no puede pasar a " + nuevoEstado.name() + "."
                );
            }
        }
    }

    public enum MetodoPago {
        EFECTIVO,
        TRANSFERENCIA,
        MERCADO_PAGO,
        TARJETA
    }

    public enum OrigenTurno {
        WEB_PUBLICA,
        MANUAL_ADMIN,
        WHATSAPP
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_reserva", nullable = false, unique = true, length = 25)
    private String codigoReserva;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "negocio_id", nullable = false)
    private Negocio negocio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profesional_id", nullable = false)
    private Profesional profesional;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servicio_id", nullable = false)
    private Servicio servicio;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private OffsetDateTime fechaHoraInicio;

    @Column(name = "fecha_hora_fin", nullable = false)
    private OffsetDateTime fechaHoraFin;

    @Column(name = "cliente_nombre", nullable = false, length = 150)
    private String clienteNombre;

    @Column(name = "cliente_telefono", nullable = false, length = 30)
    private String clienteTelefono;

    @Column(name = "cliente_email", length = 150)
    private String clienteEmail;

    @Column(name = "notas_cliente", length = 500)
    private String notasCliente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoTurno estado;

    @Column(name = "precio_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioTotal = BigDecimal.ZERO;

    @Column(name = "monto_sena_acordado", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoSenaAcordado = BigDecimal.ZERO;

    @Column(name = "monto_sena_abonado", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoSenaAbonado = BigDecimal.ZERO;

    @Column(name = "monto_restante_cobrado", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoRestanteCobrado = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago_resto", length = 30)
    private MetodoPago metodoPagoResto;

    @Column(name = "expira_en")
    private OffsetDateTime expiraEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private OrigenTurno origen = OrigenTurno.WEB_PUBLICA;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    /**
     * Constructor por defecto requerido por JPA/Hibernate.
     */
    public Turno() {}

    // =========================================================================
    // PATRÓN FACTORY METHOD: Creación segura con invariantes de dominio
    // =========================================================================

    /**
     * Factory Method para crear una reserva originada desde el portal público web.
     * Inicializa el estado mediante setters privados según requiera o no seña.
     */
    public static Turno crearReservaWebPublica(
            String codigoReserva,
            Negocio negocio,
            Profesional profesional,
            Servicio servicio,
            OffsetDateTime fechaHoraInicio,
            String clienteNombre,
            String clienteTelefono,
            String clienteEmail,
            String notasCliente,
            OffsetDateTime ahora,
            int minutosExpiracion
    ) {
        Turno turno = new Turno();
        turno.setCodigoReserva(codigoReserva);
        turno.setNegocio(negocio);
        turno.setProfesional(profesional);
        turno.setServicio(servicio);
        turno.setFechaHoraInicio(fechaHoraInicio);
        turno.setFechaHoraFin(fechaHoraInicio.plusMinutes(servicio.getDuracionMinutos()));
        turno.setClienteNombre(clienteNombre.trim());
        turno.setClienteTelefono(clienteTelefono.trim());
        turno.setClienteEmail(clienteEmail != null ? clienteEmail.trim() : null);
        turno.setNotasCliente(notasCliente != null ? notasCliente.trim() : null);
        turno.setPrecioTotal(servicio.getPrecio());
        turno.setOrigen(OrigenTurno.WEB_PUBLICA);
        turno.setMontoSenaAbonado(BigDecimal.ZERO);
        turno.setMontoRestanteCobrado(BigDecimal.ZERO);

        boolean exigeSena = Boolean.TRUE.equals(servicio.getRequiereSena())
                && servicio.getMontoSena() != null
                && servicio.getMontoSena().compareTo(BigDecimal.ZERO) > 0;

        if (exigeSena) {
            turno.setEstado(EstadoTurno.PENDIENTE_PAGO);
            turno.setMontoSenaAcordado(servicio.getMontoSena());
            turno.setExpiraEn(ahora.plusMinutes(minutosExpiracion));
        } else {
            turno.setEstado(EstadoTurno.CONFIRMADO);
            turno.setMontoSenaAcordado(BigDecimal.ZERO);
            turno.setExpiraEn(null);
        }

        return turno;
    }

    /**
     * Factory Method para crear un turno manual desde el panel del administrador (Walk-in / WhatsApp).
     */
    public static Turno crearTurnoManualMostrador(
            String codigoReserva,
            Negocio negocio,
            Profesional profesional,
            Servicio servicio,
            OffsetDateTime fechaHoraInicio,
            String clienteNombre,
            String clienteTelefono,
            String notasCliente,
            boolean senaYaAbonada
    ) {
        Turno turno = new Turno();
        turno.setCodigoReserva(codigoReserva);
        turno.setNegocio(negocio);
        turno.setProfesional(profesional);
        turno.setServicio(servicio);
        turno.setFechaHoraInicio(fechaHoraInicio);
        turno.setFechaHoraFin(fechaHoraInicio.plusMinutes(servicio.getDuracionMinutos()));
        turno.setClienteNombre(clienteNombre.trim());
        turno.setClienteTelefono(clienteTelefono.trim());
        turno.setNotasCliente(notasCliente != null ? notasCliente.trim() : null);
        turno.setPrecioTotal(servicio.getPrecio());
        turno.setOrigen(OrigenTurno.MANUAL_ADMIN);
        turno.setMontoRestanteCobrado(BigDecimal.ZERO);
        turno.setExpiraEn(null);

        BigDecimal montoSenaServicio = Boolean.TRUE.equals(servicio.getRequiereSena()) && servicio.getMontoSena() != null
                ? servicio.getMontoSena()
                : BigDecimal.ZERO;
        turno.setMontoSenaAcordado(montoSenaServicio);

        if (senaYaAbonada && montoSenaServicio.compareTo(BigDecimal.ZERO) > 0) {
            turno.setEstado(EstadoTurno.SENADO);
            turno.setMontoSenaAbonado(montoSenaServicio);
        } else {
            turno.setEstado(EstadoTurno.CONFIRMADO);
            turno.setMontoSenaAbonado(BigDecimal.ZERO);
        }

        return turno;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // =========================================================================
    // MÉTODOS DE NEGOCIO CON SEMÁNTICA DE DOMINIO (Encapsulamiento Cátedra POO)
    // =========================================================================

    /**
     * Acredita el pago de la seña verificando que el monto sea suficiente y que
     * el estado actual del turno permita la transición hacia SENADO.
     */
    public void acreditarSena(BigDecimal montoPagado) {
        this.getEstado().validarTransicionHacia(EstadoTurno.SENADO);

        if (montoPagado == null || montoPagado.compareTo(this.getMontoSenaAcordado()) < 0) {
            throw new BusinessRuleException(
                    "El monto abonado ($" + montoPagado + ") es inferior a la seña requerida ($" + this.getMontoSenaAcordado() + ")."
            );
        }

        this.setMontoSenaAbonado(montoPagado);
        this.setEstado(EstadoTurno.SENADO);
        this.setExpiraEn(null);
    }

    /**
     * Registra el cobro del saldo restante en el local y marca el turno como ATENDIDO.
     */
    public void completarAtencion(BigDecimal montoRestanteCobrado, MetodoPago metodoPago) {
        this.getEstado().validarTransicionHacia(EstadoTurno.ATENDIDO);

        if (metodoPago == null) {
            throw new BusinessRuleException("Debe especificar el método de pago utilizado para saldar el turno.");
        }

        this.setMontoRestanteCobrado(montoRestanteCobrado != null ? montoRestanteCobrado.max(BigDecimal.ZERO) : BigDecimal.ZERO);
        this.setMetodoPagoResto(metodoPago);
        this.setEstado(EstadoTurno.ATENDIDO);
        this.setExpiraEn(null);
    }

    /**
     * Marca al cliente como AUSENTE (No-Show), reteniendo la seña abonada en caja.
     */
    public void marcarAusente() {
        this.getEstado().validarTransicionHacia(EstadoTurno.AUSENTE);
        this.setEstado(EstadoTurno.AUSENTE);
        this.setExpiraEn(null);
    }

    /**
     * Cancela el turno liberando el horario en la agenda del profesional.
     */
    public void cancelar() {
        this.getEstado().validarTransicionHacia(EstadoTurno.CANCELADO);
        this.setEstado(EstadoTurno.CANCELADO);
        this.setExpiraEn(null);
    }

    /**
     * Expira el turno cuando se agota la ventana de tiempo sin abonar la seña.
     */
    public void expirarPorFaltaDePago() {
        this.getEstado().validarTransicionHacia(EstadoTurno.EXPIRADO);
        this.setEstado(EstadoTurno.EXPIRADO);
    }

    /**
     * Calcula el saldo pendiente de cobro usando los getters internos (Estándar Cátedra POO).
     */
    public BigDecimal calcularSaldoPendiente() {
        BigDecimal pagadoTotal = this.calcularTotalRecaudado();
        return this.getPrecioTotal().subtract(pagadoTotal).max(BigDecimal.ZERO);
    }

    /**
     * Calcula el total efectivamente cobrado en este turno (seña + saldo en local).
     */
    public BigDecimal calcularTotalRecaudado() {
        BigDecimal sena = this.getMontoSenaAbonado() != null ? this.getMontoSenaAbonado() : BigDecimal.ZERO;
        BigDecimal resto = this.getMontoRestanteCobrado() != null ? this.getMontoRestanteCobrado() : BigDecimal.ZERO;
        return sena.add(resto);
    }

    // =========================================================================
    // SETTERS PRIVADOS (Protección estricta del estado interno del objeto)
    // =========================================================================

    private void setEstado(EstadoTurno estado) {
        this.estado = estado;
    }

    private void setPrecioTotal(BigDecimal precioTotal) {
        this.precioTotal = precioTotal;
    }

    private void setMontoSenaAcordado(BigDecimal montoSenaAcordado) {
        this.montoSenaAcordado = montoSenaAcordado;
    }

    private void setMontoSenaAbonado(BigDecimal montoSenaAbonado) {
        this.montoSenaAbonado = montoSenaAbonado;
    }

    private void setMontoRestanteCobrado(BigDecimal montoRestanteCobrado) {
        this.montoRestanteCobrado = montoRestanteCobrado;
    }

    private void setMetodoPagoResto(MetodoPago metodoPagoResto) {
        this.metodoPagoResto = metodoPagoResto;
    }

    private void setExpiraEn(OffsetDateTime expiraEn) {
        this.expiraEn = expiraEn;
    }

    private void setOrigen(OrigenTurno origen) {
        this.origen = origen;
    }

    private void setCodigoReserva(String codigoReserva) {
        this.codigoReserva = codigoReserva;
    }

    private void setNegocio(Negocio negocio) {
        this.negocio = negocio;
    }

    private void setProfesional(Profesional profesional) {
        this.profesional = profesional;
    }

    private void setServicio(Servicio servicio) {
        this.servicio = servicio;
    }

    private void setFechaHoraInicio(OffsetDateTime fechaHoraInicio) {
        this.fechaHoraInicio = fechaHoraInicio;
    }

    private void setFechaHoraFin(OffsetDateTime fechaHoraFin) {
        this.fechaHoraFin = fechaHoraFin;
    }

    private void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    private void setClienteTelefono(String clienteTelefono) {
        this.clienteTelefono = clienteTelefono;
    }

    private void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }

    private void setNotasCliente(String notasCliente) {
        this.notasCliente = notasCliente;
    }

    // =========================================================================
    // GETTERS PÚBLICOS
    // =========================================================================

    public Long getId() { return this.id; }
    public String getCodigoReserva() { return this.codigoReserva; }
    public Negocio getNegocio() { return this.negocio; }
    public Profesional getProfesional() { return this.profesional; }
    public Servicio getServicio() { return this.servicio; }
    public OffsetDateTime getFechaHoraInicio() { return this.fechaHoraInicio; }
    public OffsetDateTime getFechaHoraFin() { return this.fechaHoraFin; }
    public String getClienteNombre() { return this.clienteNombre; }
    public String getClienteTelefono() { return this.clienteTelefono; }
    public String getClienteEmail() { return this.clienteEmail; }
    public String getNotasCliente() { return this.notasCliente; }
    public EstadoTurno getEstado() { return this.estado; }
    public BigDecimal getPrecioTotal() { return this.precioTotal; }
    public BigDecimal getMontoSenaAcordado() { return this.montoSenaAcordado; }
    public BigDecimal getMontoSenaAbonado() { return this.montoSenaAbonado; }
    public BigDecimal getMontoRestanteCobrado() { return this.montoRestanteCobrado; }
    public MetodoPago getMetodoPagoResto() { return this.metodoPagoResto; }
    public OffsetDateTime getExpiraEn() { return this.expiraEn; }
    public OrigenTurno getOrigen() { return this.origen; }
    public Long getVersion() { return this.version; }
    public OffsetDateTime getCreatedAt() { return this.createdAt; }
    public OffsetDateTime getUpdatedAt() { return this.updatedAt; }
}
