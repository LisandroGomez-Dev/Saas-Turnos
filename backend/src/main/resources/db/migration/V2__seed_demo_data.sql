-- ==============================================================================
-- V2__seed_demo_data.sql
-- Datos iniciales de demostración: 1 Barbería y 1 Consultorio Odontológico
-- ==============================================================================

-- 1. Insertar Negocios Demo
INSERT INTO negocios (id, nombre, slug, rubro, descripcion, telefono_whatsapp, direccion, cancelacion_horas_minimas)
VALUES
(1, 'Barbería Estilo & Filo', 'barberia-estilo-filo', 'BARBERIA',
 'Especialistas en cortes clásicos, degradé y perfilado de barba con toalla caliente.',
 '5491122334455', 'Av. Corrientes 1450, Local 3', 12),
(2, 'Consultorio Odontológico Sonrisa Plena', 'odontologia-sonrisa-plena', 'ODONTOLOGIA',
 'Atención odontológica integral, estética dental, ortodoncia y prevención.',
 '5491166778899', 'Av. Santa Fe 3210, Piso 4 Depto B', 24);

SELECT setval('negocios_id_seq', (SELECT MAX(id) FROM negocios));

-- 2. Insertar Usuarios Dueños
INSERT INTO usuarios (id, negocio_id, nombre, email, password_hash, rol)
VALUES
(1, 1, 'Lisandro (Dueño Barbería)', 'admin@estiloyfilo.com', '$2a$10$demoHashPasswordForLocalDevOnly123456789012', 'OWNER'),
(2, 2, 'Dra. Valentina Gómez', 'dra.valentina@sonrisaplena.com', '$2a$10$demoHashPasswordForLocalDevOnly123456789012', 'OWNER');

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- 3. Insertar Profesionales (El dueño que atiende + 1 empleado adicional por negocio)
INSERT INTO profesionales (id, negocio_id, usuario_id, nombre, especialidad, color_agenda, es_dueno)
VALUES
(1, 1, 1, 'Lisandro', 'Master Barber & Estilista', '#4F46E5', TRUE),
(2, 1, NULL, 'Mateo Ruiz', 'Especialista en Fade & Barba', '#0D9488', FALSE),
(3, 2, 2, 'Dra. Valentina Gómez', 'Odontología General y Estética', '#2563EB', TRUE),
(4, 2, NULL, 'Dr. Martín Rossi', 'Endodoncia y Rehabilitación', '#7C3AED', FALSE);

SELECT setval('profesionales_id_seq', (SELECT MAX(id) FROM profesionales));

-- 4. Insertar Horarios Laborales
-- Barbería: Lunes (1) a Sábado (6) en horario cortado (09:00-13:00 y 16:00-20:00) para ambos barberos
INSERT INTO horarios_laborales (profesional_id, dia_semana, hora_inicio, hora_fin)
SELECT p.id, d.dia, '09:00'::TIME, '13:00'::TIME
FROM profesionales p
CROSS JOIN generate_series(1, 6) AS d(dia)
WHERE p.negocio_id = 1;

INSERT INTO horarios_laborales (profesional_id, dia_semana, hora_inicio, hora_fin)
SELECT p.id, d.dia, '16:00'::TIME, '20:00'::TIME
FROM profesionales p
CROSS JOIN generate_series(1, 6) AS d(dia)
WHERE p.negocio_id = 1;

-- Odontología: Lunes (1) a Viernes (5) de 09:00 a 17:00
INSERT INTO horarios_laborales (profesional_id, dia_semana, hora_inicio, hora_fin)
SELECT p.id, d.dia, '09:00'::TIME, '17:00'::TIME
FROM profesionales p
CROSS JOIN generate_series(1, 5) AS d(dia)
WHERE p.negocio_id = 2;

-- 5. Insertar Servicios (Con monto fijo de seña)
INSERT INTO servicios (id, negocio_id, nombre, descripcion, duracion_minutos, precio, requiere_sena, monto_sena)
VALUES
-- Servicios de Barbería
(1, 1, 'Corte Clásico / Degradé', 'Corte personalizado con máquina y tijera, lavado incluido.', 40, 10000.00, TRUE, 3000.00),
(2, 1, 'Corte + Barba Premium', 'Corte completo más perfilado de barba con ritual de toalla caliente.', 60, 14500.00, TRUE, 4500.00),
(3, 1, 'Perfilado de Barba Express', 'Recorte, hidratación con aceites y delineado a navaja.', 30, 6500.00, FALSE, 0.00),
-- Servicios de Odontología
(4, 2, 'Consulta de Diagnóstico y Plan Dental', 'Evaluación clínica integral y presupuesto.', 30, 20000.00, TRUE, 6000.00),
(5, 2, 'Limpieza Dental con Ultrasonido', 'Eliminación de sarro, placa bacteriana y pulido.', 45, 35000.00, TRUE, 10000.00),
(6, 2, 'Blanqueamiento Dental LED', 'Sesión clínica de aclaramiento dental asistido por luz LED.', 60, 75000.00, TRUE, 25000.00);

SELECT setval('servicios_id_seq', (SELECT MAX(id) FROM servicios));

-- 6. Vincular Profesionales con Servicios
INSERT INTO profesional_servicios (profesional_id, servicio_id)
VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2), (2, 3),
(3, 4), (3, 5), (3, 6),
(4, 4), (4, 5);

