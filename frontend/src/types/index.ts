export interface Negocio {
  id: number;
  nombre: string;
  slug: string;
  rubro: string;
  descripcion: string | null;
  telefonoWhatsapp: string;
  direccion: string | null;
  logoUrl: string | null;
  cancelacionHorasMinimas: number;
  activo: boolean;
}

export interface ActualizarNegocioPayload {
  nombre: string;
  telefonoWhatsapp: string;
  direccion?: string;
  descripcion?: string;
  logoUrl?: string;
  cancelacionHorasMinimas: number;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  duracionMinutos: number;
  precio: number;
  requiereSena: boolean;
  montoSena: number;
  activo: boolean;
  version: number;
}

export interface CrearServicioPayload {
  nombre: string;
  descripcion?: string;
  duracionMinutos: number;
  precio: number;
  requiereSena: boolean;
  montoSena: number;
}

export interface Profesional {
  id: number;
  nombre: string;
  especialidad: string | null;
  avatarUrl: string | null;
  colorAgenda: string;
  esDueno: boolean;
  activo: boolean;
  servicioIds: number[];
  version: number;
}

export interface CrearProfesionalPayload {
  nombre: string;
  especialidad?: string;
  avatarUrl?: string;
  colorAgenda?: string;
  esDueno?: boolean;
  servicioIds: number[];
}

export interface HorarioLaboral {
  id: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface FranjaHorariaPayload {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

// =============================================================================
// DISPONIBILIDAD Y TURNOS
// =============================================================================

export interface SlotDisponible {
  fechaHoraInicio: string;
  fechaHoraFin: string;
  horaInicioFormateada: string;
  horaFinFormateada: string;
  profesionalId: number;
  profesionalNombre: string;
  profesionalColor: string;
}

export interface DisponibilidadDia {
  fecha: string;
  servicioId: number;
  servicioNombre: string;
  duracionMinutos: number;
  precioTotal: number;
  requiereSena: boolean;
  montoSena: number;
  slotsDisponibles: SlotDisponible[];
}

export type EstadoTurno =
  | 'PENDIENTE_PAGO'
  | 'CONFIRMADO'
  | 'SENADO'
  | 'ATENDIDO'
  | 'CANCELADO'
  | 'AUSENTE'
  | 'EXPIRADO';

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO' | 'TARJETA';

export interface Turno {
  id: number;
  codigoReserva: string;
  negocioId: number;
  negocioNombre: string;
  negocioSlug: string;
  negocioWhatsapp: string;
  profesionalId: number;
  profesionalNombre: string;
  profesionalColor: string;
  servicioId: number;
  servicioNombre: string;
  duracionMinutos: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string | null;
  notasCliente: string | null;
  estado: EstadoTurno;
  precioTotal: number;
  montoSenaAcordado: number;
  montoSenaAbonado: number;
  montoRestanteCobrado: number;
  saldoPendiente: number;
  metodoPagoResto: MetodoPago | null;
  expiraEn: string | null;
  origen: 'WEB_PUBLICA' | 'MANUAL_ADMIN' | 'WHATSAPP';
  version: number;
}

export interface CrearReservaPublicaPayload {
  servicioId: number;
  profesionalId: number;
  fechaHoraInicio: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  notasCliente?: string;
}

export interface PreferenciaPagoResponse {
  turnoId: number;
  codigoReserva: string;
  mpPreferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  montoSena: number;
  expiraEn: string | null;
  modoSandbox: boolean;
}

export interface CrearTurnoManualPayload {
  servicioId: number;
  profesionalId: number;
  fechaHoraInicio: string;
  clienteNombre: string;
  clienteTelefono: string;
  notasCliente?: string;
  senaYaAbonada?: boolean;
}

export interface CompletarAtencionPayload {
  metodoPagoResto: MetodoPago;
}

// =============================================================================
// MÉTRICAS Y FINANZAS (ADN CONTROLCALA)
// =============================================================================

export interface RendimientoProfesional {
  profesionalId: number;
  profesionalNombre: string;
  profesionalColor: string;
  esDueno: boolean;
  turnosAtendidos: number;
  turnosConfirmados: number;
  turnosAusentes: number;
  totalRecaudado: number;
  porcentajeSobreTotal: number;
}

export interface ServicioRentabilidad {
  servicioId: number;
  servicioNombre: string;
  cantidadTurnos: number;
  totalRecaudado: number;
}

export interface ResumenCajaMetricas {
  negocioId: number;
  fechaDesde: string;
  fechaHasta: string;
  ingresosRealesTotales: number;
  totalSenasRecaudadas: number;
  totalCobradoEnLocal: number;
  ingresosProyectadosPendientes: number;
  dineroProtegidoPorSenasEnAusencias: number;
  ticketPromedio: number;
  desglosePorMetodoPago: Record<string, number>;
  totalTurnosPeriodo: number;
  turnosAtendidos: number;
  turnosPorAtender: number;
  turnosAusentes: number;
  turnosCancelados: number;
  tasaAusentismoPorcentaje: number;
  rendimientoPorProfesional: RendimientoProfesional[];
  serviciosMasRentables: ServicioRentabilidad[];
}
