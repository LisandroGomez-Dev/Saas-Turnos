-- ==============================================================================
-- V1__init_schema.sql
-- Esquema Relacional para SaaS de Turnos, Señas (Mercado Pago) y Control de Caja
-- Motor: PostgreSQL 16+
-- ==============================================================================

-- 1. TABLA: NEGOCIOS (Tenants del SaaS: Barberías, Consultorios Odontológicos, etc.)
CREATE TABLE IF NOT EXISTS negocios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    rubro VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    descripcion VARCHAR(500),
    telefono_whatsapp VARCHAR(30) NOT NULL,
    direccion VARCHAR(255),
    logo_url VARCHAR(500),
    cancelacion_horas_minimas INTEGER NOT NULL DEFAULT 24 CHECK (cancelacion_horas_minimas >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_negocios_slug ON negocios (slug);

-- 2. TABLA: USUARIOS (Dueño del negocio y accesos opcionales para empleados)
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    negocio_id BIGINT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'OWNER' CHECK (rol IN ('OWNER', 'EMPLOYEE')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_negocio ON usuarios (negocio_id);

-- 3. TABLA: PROFESIONALES (El dueño si trabaja solo + empleados/sillones adicionales)
CREATE TABLE IF NOT EXISTS profesionales (
    id BIGSERIAL PRIMARY KEY,
    negocio_id BIGINT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    especialidad VARCHAR(120),
    avatar_url VARCHAR(500),
    color_agenda VARCHAR(20) NOT NULL DEFAULT '#4F46E5',
    es_dueno BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profesionales_negocio ON profesionales (negocio_id, activo);

-- 4. TABLA: HORARIOS LABORALES (Soporta horario corrido o cortado por cada profesional)
-- dia_semana: 1 = Lunes, 2 = Martes, ..., 7 = Domingo (Estándar ISO-8601)
CREATE TABLE IF NOT EXISTS horarios_laborales (
    id BIGSERIAL PRIMARY KEY,
    profesional_id BIGINT NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_horario_rango_valido CHECK (hora_fin > hora_inicio)
);

CREATE INDEX idx_horarios_profesional_dia ON horarios_laborales (profesional_id, dia_semana, activo);

-- 5. TABLA: BLOQUEOS DE HORARIO (Feriados, vacaciones, médico o ausencias puntuales)
CREATE TABLE IF NOT EXISTS bloqueos_horario (
    id BIGSERIAL PRIMARY KEY,
    profesional_id BIGINT NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    motivo VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bloqueo_rango_valido CHECK (fecha_hora_fin > fecha_hora_inicio)
);

CREATE INDEX idx_bloqueos_profesional_fechas ON bloqueos_horario (profesional_id, fecha_hora_inicio, fecha_hora_fin);

-- 6. TABLA: SERVICIOS (Con duración personalizada y monto fijo de seña)
CREATE TABLE IF NOT EXISTS servicios (
    id BIGSERIAL PRIMARY KEY,
    negocio_id BIGINT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(500),
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos >= 5 AND duracion_minutos <= 480),
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    requiere_sena BOOLEAN NOT NULL DEFAULT FALSE,
    monto_sena NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monto_sena >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_monto_sena_no_supera_precio CHECK (monto_sena <= precio)
);

CREATE INDEX idx_servicios_negocio ON servicios (negocio_id, activo);

-- 7. TABLA INTERMEDIA: PROFESIONAL_SERVICIOS (Qué servicios realiza cada profesional)
CREATE TABLE IF NOT EXISTS profesional_servicios (
    profesional_id BIGINT NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    servicio_id BIGINT NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    PRIMARY KEY (profesional_id, servicio_id)
);

-- 8. TABLA: TURNOS (Núcleo transaccional con Bloqueo Optimista @Version y métricas de Caja)
CREATE TABLE IF NOT EXISTS turnos (
    id BIGSERIAL PRIMARY KEY,
    codigo_reserva VARCHAR(25) NOT NULL UNIQUE,
    negocio_id BIGINT NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    profesional_id BIGINT NOT NULL REFERENCES profesionales(id) ON DELETE RESTRICT,
    servicio_id BIGINT NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(30) NOT NULL,
    cliente_email VARCHAR(150),
    notas_cliente VARCHAR(500),
    estado VARCHAR(30) NOT NULL CHECK (estado IN (
        'PENDIENTE_PAGO',
        'CONFIRMADO',
        'SENADO',
        'ATENDIDO',
        'CANCELADO',
        'AUSENTE',
        'EXPIRADO'
    )),
    precio_total NUMERIC(12, 2) NOT NULL CHECK (precio_total >= 0),
    monto_sena_acordado NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monto_sena_acordado >= 0),
    monto_sena_abonado NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monto_sena_abonado >= 0),
    monto_restante_cobrado NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monto_restante_cobrado >= 0),
    metodo_pago_resto VARCHAR(30) CHECK (metodo_pago_resto IN ('EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'TARJETA')),
    expira_en TIMESTAMP WITH TIME ZONE,
    origen VARCHAR(25) NOT NULL DEFAULT 'WEB_PUBLICA' CHECK (origen IN ('WEB_PUBLICA', 'MANUAL_ADMIN', 'WHATSAPP')),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_turno_rango_valido CHECK (fecha_hora_fin > fecha_hora_inicio)
);

CREATE INDEX idx_turnos_negocio_fechas ON turnos (negocio_id, fecha_hora_inicio, fecha_hora_fin);
CREATE INDEX idx_turnos_profesional_fechas_estado ON turnos (profesional_id, fecha_hora_inicio, fecha_hora_fin, estado);
CREATE INDEX idx_turnos_expiracion ON turnos (estado, expira_en) WHERE estado = 'PENDIENTE_PAGO';

-- 9. TABLA: PAGOS_SENA (Auditoría e Idempotencia de Webhooks de Mercado Pago)
CREATE TABLE IF NOT EXISTS pagos_sena (
    id BIGSERIAL PRIMARY KEY,
    turno_id BIGINT NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
    mp_preference_id VARCHAR(150),
    mp_payment_id VARCHAR(100) UNIQUE,
    mp_request_id VARCHAR(150),
    monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELLED')),
    fecha_pago TIMESTAMP WITH TIME ZONE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pagos_sena_turno ON pagos_sena (turno_id);
CREATE INDEX idx_pagos_sena_preference ON pagos_sena (mp_preference_id);

