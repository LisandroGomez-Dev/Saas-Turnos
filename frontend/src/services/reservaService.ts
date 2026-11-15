import { request } from './api';
import {
  DisponibilidadDia,
  CrearReservaPublicaPayload,
  Turno,
  PreferenciaPagoResponse,
} from '../types';

export const reservaService = {
  getDisponibilidad: (
    slug: string,
    servicioId: number,
    profesionalId: number | null,
    fecha: string
  ) => {
    let url = `/public/negocios/${slug}/disponibilidad?servicioId=${servicioId}&fecha=${fecha}`;
    if (profesionalId !== null) {
      url += `&profesionalId=${profesionalId}`;
    }
    return request<DisponibilidadDia>(url);
  },

  crearReserva: (slug: string, payload: CrearReservaPublicaPayload) =>
    request<Turno>(`/public/negocios/${slug}/reservas`, {
      method: 'POST',
      body: payload,
    }),

  consultarTurno: (codigoReserva: string) =>
    request<Turno>(`/public/reservas/${codigoReserva}`),

  cancelarTurno: (codigoReserva: string) =>
    request<Turno>(`/public/reservas/${codigoReserva}/cancelar`, {
      method: 'POST',
    }),

  crearPreferenciaMercadoPago: (codigoReserva: string) =>
    request<PreferenciaPagoResponse>(`/public/reservas/${codigoReserva}/preferencia-mp`, {
      method: 'POST',
    }),

  simularPagoSandboxMercadoPago: (codigoReserva: string) =>
    request<Turno>(`/public/reservas/${codigoReserva}/simular-pago-mp`, {
      method: 'POST',
    }),
};
