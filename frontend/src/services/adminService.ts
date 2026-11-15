import { request } from './api';
import {
  Negocio,
  ActualizarNegocioPayload,
  Servicio,
  CrearServicioPayload,
  Profesional,
  CrearProfesionalPayload,
  HorarioLaboral,
  FranjaHorariaPayload,
  Turno,
  CrearTurnoManualPayload,
  CompletarAtencionPayload,
  ResumenCajaMetricas,
} from '../types';

export const adminService = {
  // Negocio
  getNegocio: (id: number) => request<Negocio>(`/negocios/${id}`),
  getNegocioBySlug: (slug: string) => request<Negocio>(`/negocios/slug/${slug}`),
  updateNegocio: (id: number, data: ActualizarNegocioPayload) =>
    request<Negocio>(`/negocios/${id}`, {
      method: 'PUT',
      body: data,
    }),

  // Servicios
  getServicios: (negocioId: number) =>
    request<Servicio[]>(`/negocios/${negocioId}/servicios`),
  createServicio: (negocioId: number, data: CrearServicioPayload) =>
    request<Servicio>(`/negocios/${negocioId}/servicios`, {
      method: 'POST',
      body: data,
    }),
  updateServicio: (
    negocioId: number,
    servicioId: number,
    data: CrearServicioPayload & { activo?: boolean }
  ) =>
    request<Servicio>(`/negocios/${negocioId}/servicios/${servicioId}`, {
      method: 'PUT',
      body: data,
    }),
  toggleServicioEstado: (negocioId: number, servicioId: number, activo: boolean) =>
    request<void>(
      `/negocios/${negocioId}/servicios/${servicioId}/estado?activo=${activo}`,
      { method: 'PATCH' }
    ),

  // Profesionales
  getProfesionales: (negocioId: number) =>
    request<Profesional[]>(`/negocios/${negocioId}/profesionales`),
  createProfesional: (negocioId: number, data: CrearProfesionalPayload) =>
    request<Profesional>(`/negocios/${negocioId}/profesionales`, {
      method: 'POST',
      body: data,
    }),
  updateProfesional: (
    negocioId: number,
    profesionalId: number,
    data: CrearProfesionalPayload & { activo?: boolean }
  ) =>
    request<Profesional>(`/negocios/${negocioId}/profesionales/${profesionalId}`, {
      method: 'PUT',
      body: data,
    }),

  // Horarios Laborales
  getHorarios: (profesionalId: number) =>
    request<HorarioLaboral[]>(`/profesionales/${profesionalId}/horarios`),
  updateHorarios: (profesionalId: number, franjas: FranjaHorariaPayload[]) =>
    request<HorarioLaboral[]>(`/profesionales/${profesionalId}/horarios`, {
      method: 'PUT',
      body: { franjas },
    }),

  // Turnos & Operatoria de Agenda
  getTurnos: (negocioId: number, desde: string, hasta: string) =>
    request<Turno[]>(`/negocios/${negocioId}/turnos?desde=${desde}&hasta=${hasta}`),

  crearTurnoManual: (negocioId: number, data: CrearTurnoManualPayload) =>
    request<Turno>(`/negocios/${negocioId}/turnos/manual`, {
      method: 'POST',
      body: data,
    }),

  completarAtencion: (
    negocioId: number,
    turnoId: number,
    data: CompletarAtencionPayload
  ) =>
    request<Turno>(`/negocios/${negocioId}/turnos/${turnoId}/atender`, {
      method: 'POST',
      body: data,
    }),

  marcarAusente: (negocioId: number, turnoId: number) =>
    request<Turno>(`/negocios/${negocioId}/turnos/${turnoId}/ausente`, {
      method: 'POST',
    }),

  cancelarTurnoDueno: (negocioId: number, turnoId: number) =>
    request<Turno>(`/negocios/${negocioId}/turnos/${turnoId}/cancelar`, {
      method: 'POST',
    }),

  // Métricas Financieras (ControlCaja)
  getMetricasCaja: (negocioId: number, desde: string, hasta: string) =>
    request<ResumenCajaMetricas>(
      `/negocios/${negocioId}/metricas-caja?desde=${desde}&hasta=${hasta}`
    ),
};
