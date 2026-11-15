import { Turno, EstadoTurno, MetodoPago, ResumenCajaMetricas } from '../types';
import { cloudSync } from './cloudSync';

const STORAGE_KEY = 'saas_turnos_local_db';

export const turnosStorage = {
  getTurnos: (negocioId: number): Turno[] => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${negocioId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  getTurnosLocales: (negocioId: number): Turno[] => {
    return turnosStorage.getTurnos(negocioId);
  },

  getUltimaFechaTurno: (negocioId: number = 2): string | null => {
    try {
      const turnos = turnosStorage.getTurnos(negocioId);
      if (turnos.length > 0 && turnos[0].fechaHoraInicio) {
        return turnos[0].fechaHoraInicio.split('T')[0];
      }
      return null;
    } catch {
      return null;
    }
  },

  saveTurno: (turno: Turno): void => {
    try {
      const existing = turnosStorage.getTurnos(turno.negocioId);
      const filtered = existing.filter(
        (t) => t.id !== turno.id && t.codigoReserva !== turno.codigoReserva
      );
      const updated = [turno, ...filtered];
      localStorage.setItem(
        `${STORAGE_KEY}_${turno.negocioId}`,
        JSON.stringify(updated)
      );

      // Guardar fecha del último turno para que la agenda abra directo en este día
      if (turno.fechaHoraInicio) {
        localStorage.setItem('saas_ultimo_turno_fecha', turno.fechaHoraInicio.split('T')[0]);
      }
      localStorage.setItem('saas_ultimo_turno_id', turno.codigoReserva);

      // Sincronizar con la nube (si hay internet) para que salte en el celular si se reservó en la PC
      cloudSync.syncToCloud(turno.negocioId, updated);

      // Disparar evento para actualizar vistas en tiempo real
      window.dispatchEvent(new CustomEvent('saas_turno_actualizado', { detail: turno }));
    } catch (e) {
      console.warn('Error saving turno to storage', e);
    }
  },

  guardarTurnoLocal: (turno: Turno): void => {
    turnosStorage.saveTurno(turno);
  },

  sincronizarConNube: async (negocioId: number): Promise<Turno[]> => {
    try {
      const remotos = await cloudSync.fetchFromCloud(negocioId);
      if (remotos && remotos.length > 0) {
        const locales = turnosStorage.getTurnos(negocioId);
        const mapa = new Map<string | number, Turno>();
        locales.forEach((t) => mapa.set(t.codigoReserva || t.id, t));
        remotos.forEach((t) => mapa.set(t.codigoReserva || t.id, t));

        const combinados = Array.from(mapa.values());
        localStorage.setItem(
          `${STORAGE_KEY}_${negocioId}`,
          JSON.stringify(combinados)
        );

        if (combinados.length > 0 && combinados[0].fechaHoraInicio) {
          localStorage.setItem(
            'saas_ultimo_turno_fecha',
            combinados[0].fechaHoraInicio.split('T')[0]
          );
        }

        // Disparar evento para que la grilla de la agenda se refresque de inmediato
        window.dispatchEvent(new CustomEvent('saas_turno_actualizado'));
        return combinados;
      }
    } catch {
      // Ignorar si offline
    }
    return turnosStorage.getTurnos(negocioId);
  },

  updateTurnoEstado: (
    negocioId: number,
    turnoId: number,
    nuevoEstado: EstadoTurno,
    metodoPagoResto?: MetodoPago
  ): Turno | null => {
    try {
      const existing = turnosStorage.getTurnos(negocioId);
      const index = existing.findIndex((t) => t.id === turnoId);
      if (index === -1) return null;

      const turno = existing[index];
      const updated: Turno = {
        ...turno,
        estado: nuevoEstado,
        metodoPagoResto: metodoPagoResto || turno.metodoPagoResto,
        saldoPendiente: nuevoEstado === 'ATENDIDO' ? 0 : turno.saldoPendiente,
        montoRestanteCobrado:
          nuevoEstado === 'ATENDIDO'
            ? turno.precioTotal - (turno.montoSenaAbonado || 0)
            : turno.montoRestanteCobrado,
      };

      existing[index] = updated;
      localStorage.setItem(
        `${STORAGE_KEY}_${negocioId}`,
        JSON.stringify(existing)
      );
      return updated;
    } catch {
      return null;
    }
  },

  actualizarEstadoTurno: (
    negocioId: number,
    turnoId: number,
    actualizaciones: Partial<Turno>
  ): Turno | null => {
    try {
      const existing = turnosStorage.getTurnos(negocioId);
      const index = existing.findIndex((t) => t.id === turnoId);
      if (index === -1) return null;

      const updated = { ...existing[index], ...actualizaciones };
      existing[index] = updated;
      localStorage.setItem(`${STORAGE_KEY}_${negocioId}`, JSON.stringify(existing));
      cloudSync.syncToCloud(negocioId, existing);
      window.dispatchEvent(new CustomEvent('saas_turno_actualizado', { detail: updated }));
      return updated;
    } catch {
      return null;
    }
  },

  // Genera datos iniciales limpios si el usuario todavía no tiene turnos guardados
  getOrSeedTurnos: (negocioId: number, fechaActual: string): Turno[] => {
    const existing = turnosStorage.getTurnos(negocioId);
    if (existing.length > 0) {
      return existing;
    }

    if (negocioId === 2) {
      const iniciales: Turno[] = [
        {
          id: 201,
          codigoReserva: 'TRN-8J4K2L',
          negocioId: 2,
          negocioNombre: 'Consultorio Odontológico Sonrisa Plena',
          negocioSlug: 'odontologia-sonrisa-plena',
          negocioWhatsapp: '5491166778899',
          profesionalId: 3,
          profesionalNombre: 'Dra. Valentina Gómez',
          profesionalColor: '#00685f',
          servicioId: 5,
          servicioNombre: 'Limpieza Dental con Ultrasonido',
          duracionMinutos: 45,
          fechaHoraInicio: `${fechaActual}T10:00:00-03:00`,
          fechaHoraFin: `${fechaActual}T10:45:00-03:00`,
          clienteNombre: 'Camila Benítez',
          clienteTelefono: '1145551234',
          clienteEmail: 'camila.benitez@gmail.com',
          notasCliente: null,
          estado: 'SENADO',
          precioTotal: 35000,
          montoSenaAcordado: 10000,
          montoSenaAbonado: 10000,
          montoRestanteCobrado: 0,
          saldoPendiente: 25000,
          metodoPagoResto: null,
          expiraEn: null,
          origen: 'WEB_PUBLICA',
          version: 0,
        },
        {
          id: 202,
          codigoReserva: 'TRN-4Y7P9Q',
          negocioId: 2,
          negocioNombre: 'Consultorio Odontológico Sonrisa Plena',
          negocioSlug: 'odontologia-sonrisa-plena',
          negocioWhatsapp: '5491166778899',
          profesionalId: 3,
          profesionalNombre: 'Dra. Valentina Gómez',
          profesionalColor: '#00685f',
          servicioId: 6,
          servicioNombre: 'Restauraciones & Arreglos Estéticos',
          duracionMinutos: 45,
          fechaHoraInicio: `${fechaActual}T16:00:00-03:00`,
          fechaHoraFin: `${fechaActual}T16:45:00-03:00`,
          clienteNombre: 'Lucas Fernández',
          clienteTelefono: '1145559988',
          clienteEmail: 'lucas.f@gmail.com',
          notasCliente: null,
          estado: 'CONFIRMADO',
          precioTotal: 28000,
          montoSenaAcordado: 10000,
          montoSenaAbonado: 10000,
          montoRestanteCobrado: 0,
          saldoPendiente: 18000,
          metodoPagoResto: null,
          expiraEn: null,
          origen: 'WEB_PUBLICA',
          version: 0,
        },
      ];

      localStorage.setItem(
        `${STORAGE_KEY}_${negocioId}`,
        JSON.stringify(iniciales)
      );
      return iniciales;
    }

    return [];
  },

  // Calcula métricas de caja en tiempo real a partir de los turnos registrados
  calcularMetricasCaja: (
    negocioId: number,
    desde: string,
    hasta: string
  ): ResumenCajaMetricas => {
    const hoy = new Date().toISOString().split('T')[0];
    const turnos = turnosStorage.getOrSeedTurnos(negocioId, hoy);

    const totalTurnos = turnos.length;
    const atendidos = turnos.filter((t) => t.estado === 'ATENDIDO');
    const porAtender = turnos.filter(
      (t) =>
        t.estado === 'CONFIRMADO' ||
        t.estado === 'SENADO' ||
        t.estado === 'PENDIENTE_PAGO'
    );
    const ausentes = turnos.filter((t) => t.estado === 'AUSENTE');
    const cancelados = turnos.filter((t) => t.estado === 'CANCELADO');

    const totalSenas = turnos.reduce(
      (acc, t) => acc + (Number(t.montoSenaAbonado) || 0),
      0
    );
    const totalCobradoLocal = atendidos.reduce(
      (acc, t) => acc + (Number(t.montoRestanteCobrado) || 0),
      0
    );
    const ingresosRealesTotales = totalSenas + totalCobradoLocal;

    const ingresosProyectadosPendientes = porAtender.reduce(
      (acc, t) => acc + (Number(t.saldoPendiente) || 0),
      0
    );

    const dineroProtegidoAusencias = ausentes.reduce(
      (acc, t) => acc + (Number(t.montoSenaAbonado) || 0),
      0
    );

    const ticketPromedio =
      atendidos.length > 0
        ? Math.round(ingresosRealesTotales / atendidos.length)
        : totalTurnos > 0
        ? Math.round(
            turnos.reduce((a, b) => a + Number(b.precioTotal), 0) / totalTurnos
          )
        : 35000;

    // Desglose por servicio para "Servicios más usados"
    const serviciosMap: Record<
      string,
      { id: number; nombre: string; count: number; total: number }
    > = {};

    turnos.forEach((t) => {
      const nombre = t.servicioNombre || 'Consulta General';
      if (!serviciosMap[nombre]) {
        serviciosMap[nombre] = {
          id: t.servicioId,
          nombre,
          count: 0,
          total: 0,
        };
      }
      serviciosMap[nombre].count += 1;
      serviciosMap[nombre].total += Number(t.precioTotal) || 0;
    });

    const serviciosMasRentables = Object.values(serviciosMap)
      .sort((a, b) => b.count - a.count)
      .map((s) => ({
        servicioId: s.id,
        servicioNombre: s.nombre,
        cantidadTurnos: s.count,
        totalRecaudado: s.total,
      }));

    // Rendimiento por profesional demo
    const profNombre =
      negocioId === 2 ? 'Dra. Valentina Gómez' : 'Lisandro';
    const profColor = negocioId === 2 ? '#00685f' : '#4F46E5';

    return {
      negocioId,
      fechaDesde: desde,
      fechaHasta: hasta,
      ingresosRealesTotales,
      totalSenasRecaudadas: totalSenas,
      totalCobradoEnLocal: totalCobradoLocal,
      ingresosProyectadosPendientes,
      dineroProtegidoPorSenasEnAusencias: dineroProtegidoAusencias,
      ticketPromedio,
      desglosePorMetodoPago: {
        SEÑAS_MERCADO_PAGO: totalSenas,
        EFECTIVO: Math.round(totalCobradoLocal * 0.7),
        TRANSFERENCIA: Math.round(totalCobradoLocal * 0.3),
        MERCADO_PAGO: 0,
      },
      totalTurnosPeriodo: totalTurnos,
      turnosAtendidos: atendidos.length,
      turnosPorAtender: porAtender.length,
      turnosAusentes: ausentes.length,
      turnosCancelados: cancelados.length,
      tasaAusentismoPorcentaje:
        totalTurnos > 0
          ? Number(((ausentes.length / totalTurnos) * 100).toFixed(1))
          : 0,
      rendimientoPorProfesional: [
        {
          profesionalId: negocioId === 2 ? 3 : 1,
          profesionalNombre: profNombre,
          profesionalColor: profColor,
          esDueno: true,
          turnosAtendidos: atendidos.length,
          turnosConfirmados: porAtender.length,
          turnosAusentes: ausentes.length,
          totalRecaudado: ingresosRealesTotales,
          porcentajeSobreTotal: 100,
        },
      ],
      serviciosMasRentables,
    };
  },
};
