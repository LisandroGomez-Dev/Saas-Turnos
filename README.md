# 🗓️ SaaS Turnos & Control de Caja

> **Plataforma integral de gestión de reservas online con seña previa obligatoria (Mercado Pago), protección contra el ausentismo (No-Show) y control de caja financiero en tiempo real.**

![Java 21](https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white)
![Spring Boot 3.3.5](https://img.shields.io/badge/Spring_Boot-3.3.5-brightgreen?logo=springboot&logoColor=white)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql&logoColor=white)
![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Swagger](https://img.shields.io/badge/OpenAPI-Swagger_UI-85EA2D?logo=swagger&logoColor=black)

> **💡 Modo Demo & Despliegue Cloud:** El proyecto incluye datos iniciales precargados por Flyway (`V2__seed_demo_data.sql`), modo sandbox interactivo para Mercado Pago y documentación OpenAPI lista para explorar en `/swagger-ui.html`.

---

## 📌 Tabla de Contenidos
- [🎯 Problema y Propuesta de Valor](#-problema-y-propuesta-de-valor)
- [✨ Características Principales](#-características-principales)
- [🏛️ Arquitectura y Patrones de Diseño](#️-arquitectura-y-patrones-de-diseño)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
- [🔒 Seguridad y Webhooks Idempotentes](#-seguridad-y-webhooks-idempotentes)
- [📡 API REST - Endpoints Principales](#-api-rest---endpoints-principales)
- [🤝 Contribución y Buenas Prácticas](#-contribución-y-buenas-prácticas)

---

## 🎯 Problema y Propuesta de Valor

En negocios de servicios (barberías, peluquerías, consultorios odontológicos, clínicas de estética y spas), el **ausentismo (no-show)** genera pérdidas millonarias: horarios vacíos que no se pueden recuperar y costos fijos de personal sin amortizar.

**SaaS Turnos** resuelve esta problemática de raíz:
1. **Seña Previa Obligatoria**: Los clientes abonan una seña online mediante Mercado Pago Checkout Pro para asegurar el turno.
2. **Protección del Horario (Timer de 10 minutos)**: Si el cliente inicia una reserva pero no abona la seña en 10 minutos, el turno se libera automáticamente para que otra persona lo tome.
3. **Cero Ausentismo**: Si el cliente no se presenta, la seña queda retenida cubriendo los costos fijos. Si asiste, el saldo restante se liquida fácilmente en mostrador.
4. **Link Público Autogestionable**: Cada negocio cuenta con su enlace (`/reservar/{slug}`) listo para colocar en la biografía de Instagram o en el mensaje de respuesta automática de WhatsApp.

---

## ✨ Características Principales

### 📱 Turnero Público del Cliente (Mobile-First)
- Selección interactiva de **Servicio** (duración, precio total y seña requerida).
- Selección de **Profesional** o asignación automática (*"Cualquier profesional disponible"*).
- Selector de fecha con **empaquetado inteligente de horarios**: sin tiempos muertos entre turnos.
- Checkout con Mercado Pago y pantalla de confirmación con redirección directa a WhatsApp con el mensaje del turno prearmado.

### 📊 Panel de Control de Caja & Rendimiento (Estilo ControlCaja)
- **Caja Real Cobrada**: Suma consolidada de señas online + saldos cobrados en local.
- **Señas Mercado Pago**: Dinero asegurado por adelantado.
- **Dinero Salvado**: Monto retenido de clientes ausentes (*no-shows*).
- **Tasa de Ausentismo y Ticket Promedio**: Métricas actualizadas en tiempo real.
- **Desglose por Medio de Pago**: Efectivo, Transferencia Bancaria, Tarjeta y Mercado Pago Mostrador.
- **Rendimiento por Profesional**: Cantidad de turnos atendidos, ausentes y porcentaje de aporte a la caja total.
- **Ranking de Servicios Más Rentables**: Ordenados por facturación real acumulada.

### 📅 Agenda de Turnos Multi-Profesional
- **Selector de Calendario Mensual Interactivo (DatePicker)**: Navegación ágil por mes/año y salto rápido a *"Hoy"*.
- Filtrado dinámico por profesional o visualización integral del equipo.
- Alta rápida de **Turno Manual en Mostrador** (permite marcar si el cliente ya dejó seña previa).
- Cobro en mostrador en un click con selección del medio de pago del saldo restante.
- Cancelación y marcado de ausentes con auditoría de estados.

### 🛡️ Prevención de Doble Reserva Concurrente
- Bloqueo optimista forzado (`@Version`) sobre la entidad del profesional.
- Si dos usuarios intentan reservar el mismo slot simultáneamente, el sistema captura la concurrencia, retorna `HTTP 409 Conflict` y la interfaz alerta al usuario de forma amigable actualizando los horarios libres.

---

## 🏛️ Arquitectura y Patrones de Diseño

El backend fue diseñado bajo principios de **Clean Architecture**, **Domain-Driven Design (DDD)** y las reglas de diseño orientado a objetos de la **Cátedra de POO**:

```
backend/src/main/java/com/saasturnos/backend/
├── application/
│   ├── dto/                    # Records inmutables Java 21 (Data Transfer Objects)
│   ├── scheduler/              # Tareas programadas (Expiración de turnos no pagados)
│   ├── service/                # Casos de uso transaccionales (@Transactional)
│   └── strategy/               # Patrón Strategy (Liquidación de cobros)
├── domain/
│   ├── exception/              # Excepciones de negocio personalizadas
│   └── model/                  # Entidades de dominio ricas con encapsulamiento estricto
└── infrastructure/
    ├── config/                 # Configuración de CORS y beans de infraestructura
    ├── repository/             # Interfaces Spring Data JPA con bloqueo optimista
    ├── security/               # Verificación criptográfica HMAC-SHA256
    └── web/                    # Controladores REST API y GlobalExceptionHandler
```

### 1. Patrón Strategy (`application/strategy/`)
Desacopla la lógica de cobro del saldo restante al completar una atención en mostrador:
- **`EstrategiaCobroSaldo`**: Interfaz polimórfica que define el contrato `calcularYProcesarCobro(Turno, BigDecimal)`.
- **Estrategias Concretas**:
  - `EfectivoCobroStrategy`: 0% comisión, acreditación inmediata en caja física.
  - `TransferenciaCobroStrategy`: Liquidación por transferencia bancaria / CVU sin retención.
  - `MercadoPagoMostradorCobroStrategy`: Deducción del costo financiero estimado de terminal Point / QR y cálculo del neto a caja.
  - `TarjetaCobroStrategy`: Cálculo del arancel de adquirencia POS (débito/crédito).
- **`ProcesadorCobroContext`**: Contexto inyectado en Spring que despacha en $O(1)$ la estrategia adecuada según el `MetodoPago`.

### 2. Patrón State (`Turno.EstadoTurno`)
El ciclo de vida del turno se modela como una máquina de estados finita protegida:
- Estados: `PENDIENTE_PAGO`, `CONFIRMADO`, `SENADO`, `ATENDIDO`, `AUSENTE`, `CANCELADO`, `EXPIRADO`.
- Cada estado define de forma estricta sus **transiciones permitidas**.
- No es posible cancelar o marcar ausente un turno que ya fue atendido, garantizando consistencia financiera y legal en auditorías.

### 3. Patrón Factory Method
Elimina constructores con docenas de parámetros y evita el armado arbitrario de entidades desde los servicios:
- `Turno.crearReservaWebPublica(...)`: Inicializa el turno con cálculo de fin, código alfa-numérico único y fecha de expiración si requiere seña.
- `Turno.crearTurnoManualMostrador(...)`: Inicializa reservas generadas por el administrador en mostrador.
- `PagoSena.crearPreferenciaPendiente(...)` y `PagoSena.registrarNotificacionWebhook(...)`: Inicializan y auditan pagos de seña.

### 4. Modelo de Dominio Rico (Encapsulamiento Estricto)
- **Setters Privados (`private set...`)**: Los atributos no pueden modificarse desde afuera; el estado solo muta mediante métodos semánticos (`acreditarSena`, `completarAtencion`, `marcarAusente`, `cancelar`).
- **Acceso Interno por Getters (`this.getX()`)**: Los métodos internos de cálculo (`calcularSaldoPendiente`, `calcularTotalRecaudado`) operan respetando la encapsulación.
- **Colecciones Protegidas**: Las colecciones se inicializan en los constructores y se exponen como `Collections.unmodifiableSet(...)` para evitar mutaciones externas indebidas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend Core** | Java 21 LTS, Spring Boot 3.3.5, OpenAPI 3 / Swagger UI |
| **Persistencia & ORM** | Spring Data JPA, Hibernate 6, PostgreSQL 16, HikariCP |
| **Migraciones DB** | Flyway (`V1__init_schema.sql`, `V2__seed_demo_data.sql`) |
| **Seguridad & Pagos** | HMAC-SHA256 Signature Verification, Mercado Pago Checkout Pro REST API |
| **Frontend SPA** | React 18, TypeScript 5.6, Vite 5, React Router 6 |
| **Estilos & UI** | Tailwind CSS 3.4, Lucide React (Iconografía moderna de alto contraste) |
| **Infraestructura** | Docker & Docker Compose, Render (`render.yaml`), Vercel (`vercel.json`), Maven |

---

## 📂 Estructura del Proyecto

```
Saas-Turnos/
├── backend/                        # Código fuente del Backend (Spring Boot 3 + Java 21)
│   ├── src/main/java/              # Capas de Aplicación, Dominio e Infraestructura
│   ├── src/main/resources/
│   │   ├── application.properties  # Configuración principal (Hikari, JPA, MP)
│   │   └── db/migration/           # Scripts SQL versionados de Flyway
│   ├── src/test/java/              # Pruebas unitarias de Disponibilidad, Webhooks y Patrones
│   ├── pom.xml                     # Dependencias Maven
│   └── mvnw.cmd / mvnw             # Maven Wrapper sin requerir instalación global
├── frontend/                       # Código fuente del Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/admin/       # Agenda, Control de Caja, Servicios, Equipo, Perfil
│   │   ├── components/public/      # Turnero Público del Cliente y Pantalla de Confirmación
│   │   ├── services/               # Clientes HTTP (Axios / Fetch centralizado)
│   │   └── types/                  # Tipos TypeScript compartidos con los DTOs
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml              # Contenedor de PostgreSQL 16 con Healthcheck
├── .env.example                    # Plantilla de variables de entorno seguras
└── .gitignore                      # Reglas de exclusión para Git
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- **Java 21** o superior instalado (`java -version`).
- **Node.js 18+** y **npm** (`node -v`).
- **Docker Desktop** (para la base de datos PostgreSQL local).

### 1. Clonar el Repositorio
```bash
git clone https://github.com/LisandroGomez-Dev/Saas-Turnos.git
cd Saas-Turnos
```

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo para configurar tus variables locales:
```bash
cp .env.example .env
```

### 3. Levantar la Base de Datos con Docker
```bash
docker compose up -d postgres
```
> El contenedor `saas_turnos_postgres` se iniciará en el puerto `5432` y ejecutará su healthcheck.

### 4. Iniciar el Backend (Spring Boot)
Las migraciones de **Flyway** se ejecutarán automáticamente al iniciar la aplicación, creando las tablas y cargando los datos demo:
```bash
cd backend
# En Windows:
.\mvnw.cmd spring-boot:run

# En Linux/macOS:
./mvnw spring-boot:run
```
El servidor backend quedará disponible en: `http://localhost:8080` y la documentación interactiva **Swagger UI** en: `http://localhost:8080/swagger-ui.html`.

Para ejecutar la suite de pruebas unitarias:
```bash
.\mvnw.cmd test
```

### 5. Iniciar el Frontend (React + Vite)
En una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```
La aplicación web quedará disponible en: `http://localhost:5173`.

---

## 🔒 Seguridad y Webhooks Idempotentes

### Verificación de Firma HMAC-SHA256 (`MercadoPagoSignatureValidator`)
Cada webhook enviado por Mercado Pago incluye la cabecera `x-signature` con:
- `ts`: Timestamp de emisión de la notificación.
- `v1`: Hash HMAC-SHA256 generado con la clave secreta del webhook (`MP_WEBHOOK_SECRET`).

El backend:
1. Extrae los valores de `ts` y `v1`.
2. Verifica que el timestamp no tenga un desfase mayor a **5 minutos** (previniendo ataques de repetición o *Replay Attacks*).
3. Recalcula el hash con la clave secreta y valida en tiempo constante (`MessageDigest.isEqual`) para prevenir ataques de temporización (*Timing Attacks*).

### Idempotencia en Base de Datos
- Las notificaciones se registran por `mp_payment_id` en una transacción aislada.
- Si Mercado Pago reenvía una notificación duplicada para un pago ya procesado, el sistema responde `200 OK` inmediatamente sin reprocesar ni duplicar registros contables.

---

## 📡 API REST - Endpoints Principales

### Reservas y Turnos Públicos
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/negocios/slug/{slug}` | Obtiene los datos públicos del negocio para el turnero |
| `GET` | `/api/v1/disponibilidad/slug/{slug}?servicioId={id}&fecha={YYYY-MM-DD}` | Calcula los slots libres sin tiempos muertos |
| `POST` | `/api/v1/turnos/reservar/{slug}` | Crea una reserva pública (reserva de slot con bloqueo optimista) |
| `GET` | `/api/v1/turnos/codigo/{codigo}` | Obtiene los detalles de un turno por su código alfa-numérico |
| `POST` | `/api/v1/turnos/codigo/{codigo}/cancelar` | Cancela un turno respetando las horas mínimas de anticipación |

### Pagos y Mercado Pago
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/v1/pagos/mercadopago/preferencia/{codigo}` | Genera la preferencia de pago en Mercado Pago Checkout Pro |
| `POST` | `/api/v1/pagos/mercadopago/webhook` | Webhook idempotente con verificación de firma HMAC-SHA256 |
| `POST` | `/api/v1/pagos/mercadopago/sandbox/aprobar/{codigo}` | Endpoint sandbox para simular acreditación de señas en desarrollo |

### Panel de Administración & Control de Caja
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/v1/turnos/negocio/{id}?fechaDesde={...}&fechaHasta={...}` | Lista turnos de la agenda en el rango de fechas |
| `POST` | `/api/v1/turnos/negocio/{id}/manual` | Da de alta un turno manual en mostrador |
| `POST` | `/api/v1/turnos/negocio/{id}/{turnoId}/completar` | Completa atención liquidando saldo vía **Patrón Strategy** |
| `POST` | `/api/v1/turnos/negocio/{id}/{turnoId}/marcar-ausente` | Marca cliente ausente y protege la seña como ingreso |
| `GET` | `/api/v1/metricas/caja/negocio/{id}?fechaDesde={...}&fechaHasta={...}` | Resumen financiero completo de caja y rendimiento |

---

## 🤝 Contribución y Buenas Prácticas

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`.
2. Asegúrate de que las pruebas pasen: `.\mvnw.cmd test` en backend y `npm run build` en frontend.
3. Respeta el encapsulamiento del modelo de dominio: utiliza setters privados y métodos de negocio con nombres semánticos.
4. Realiza tu commit siguiendo conventional commits: `git commit -m 'feat: agrega soporte para recordatorios por SMS'`.
5. Envía un Pull Request al repositorio oficial.

---

## 📄 Uso y Propiedad

Todos los derechos reservados © Lisandro Gómez. Publicado con fines de demostración técnica y portfolio.

Desarrollado por [Lisandro Gómez](https://github.com/LisandroGomez-Dev).

