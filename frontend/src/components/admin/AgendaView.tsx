import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Turno,
  Servicio,
  Profesional,
  EstadoTurno,
  MetodoPago,
  CrearTurnoManualPayload,
} from '../../types';
import { adminService } from '../../services/adminService';
import { turnosStorage } from '../../services/turnosStorage';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  CheckCircle,
  UserX,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Phone,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  CalendarDays,
} from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

interface AgendaViewProps {
  negocioId: number;
  servicios: Servicio[];
  profesionales: Profesional[];
  onRefreshCaja?: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  negocioId,
  servicios,
  profesionales,
  onRefreshCaja,
}) => {
  const [fechaActual, setFechaActual] = useState<string>(() => {
    // Si se reservó un turno recientemente, abrir en esa fecha para que aparezca de inmediato
    const ultima = turnosStorage.getUltimaFechaTurno();
    return ultima || new Date().toISOString().split('T')[0];
  });
  const [profesionalFiltro, setProfesionalFiltro] = useState<number | 'TODOS'>('TODOS');
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [turnosOtrasFechas, setTurnosOtrasFechas] = useState<
    { fecha: string; count: number; primerTurno: Turno }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Mini Calendario Mensual Desplegable (Popover DatePicker)
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [mesVisualizado, setMesVisualizado] = useState<Date>(() => {
    const ultima = turnosStorage.getUltimaFechaTurno();
    return ultima ? new Date(ultima + 'T12:00:00') : new Date();
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Modales de Acción
  const [modalAtenderTurno, setModalAtenderTurno] = useState<Turno | null>(null);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<MetodoPago>('EFECTIVO');
  const [modalManualOpen, setModalManualOpen] = useState(false);

  // Form Turno Manual
  const [manualServicioId, setManualServicioId] = useState<number>(servicios[0]?.id || 1);
  const [manualProfesionalId, setManualProfesionalId] = useState<number>(profesionales[0]?.id || 1);
  const [manualHora, setManualHora] = useState<string>('10:00');
  const [manualClienteNombre, setManualClienteNombre] = useState('');
  const [manualClienteTelefono, setManualClienteTelefono] = useState('');
  const [manualSenaAbonada, setManualSenaAbonada] = useState(false);
  const [guardandoManual, setGuardandoManual] = useState(false);

  // Cerrar popover si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalendarioAbierto(false);
      }
    };
    if (calendarioAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarioAbierto]);

  const cargarTurnos = useCallback(async () => {
    setLoading(true);

    // 1. Obtener todos los turnos guardados localmente
    const todosLocales = turnosStorage.getTurnosLocales(negocioId);

    // 2. Agrupar turnos en otras fechas
    const mapaOtras = todosLocales
      .filter((t) => t.fechaHoraInicio && !t.fechaHoraInicio.startsWith(fechaActual))
      .reduce((acc, t) => {
        const f = t.fechaHoraInicio.split('T')[0];
        if (!acc[f]) acc[f] = { fecha: f, count: 0, primerTurno: t };
        acc[f].count++;
        return acc;
      }, {} as Record<string, { fecha: string; count: number; primerTurno: Turno }>);
    setTurnosOtrasFechas(Object.values(mapaOtras));

    // 3. Filtrar turnos locales para la fecha actual
    const localesHoy = todosLocales.filter(
      (t) => t.fechaHoraInicio && t.fechaHoraInicio.startsWith(fechaActual)
    );

    const hoyStr = new Date().toISOString().split('T')[0];
    const ultimaFechaGuardada = turnosStorage.getUltimaFechaTurno();
    const esFechaInicial = fechaActual === hoyStr || fechaActual === ultimaFechaGuardada;

    const getMockTurnos = (): Turno[] => {
      // Solo mostrar datos demo de cortesía en la fecha inicial si no hay turnos cargados
      if (negocioId === 2 && esFechaInicial && todosLocales.length === 0) {
        return [
          {
            id: 201,
            codigoReserva: 'TRN-8J4K2L',
            negocioId: 2,
            negocioNombre: 'Consultorio Sonrisa Plena',
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
            clienteTelefono: '11 4555-1234',
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
            negocioNombre: 'Consultorio Sonrisa Plena',
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
            clienteTelefono: '11 4555-9988',
            clienteEmail: 'lucas.f@hotmail.com',
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
      }
      return [];
    };

    try {
      const data = await adminService.getTurnos(negocioId, fechaActual, fechaActual);
      const mapa = new Map<string | number, Turno>();
      (data || []).forEach((t) => mapa.set(t.codigoReserva || t.id, t));
      localesHoy.forEach((t) => mapa.set(t.codigoReserva || t.id, t));

      if (mapa.size > 0) {
        setTurnos(Array.from(mapa.values()));
      } else if (todosLocales.length > 0) {
        setTurnos([]);
      } else {
        setTurnos(getMockTurnos());
      }
    } catch {
      if (localesHoy.length > 0) {
        setTurnos(localesHoy);
      } else if (todosLocales.length > 0) {
        setTurnos([]);
      } else {
        setTurnos(getMockTurnos());
      }
    } finally {
      setLoading(false);
    }
  }, [negocioId, fechaActual]);

  useEffect(() => {
    cargarTurnos();

    // Sincronizar en segundo plano con la nube sin forzar reinicio de fecha
    const sincronizarRemoto = async () => {
      await turnosStorage.sincronizarConNube(negocioId);
      cargarTurnos();
    };

    sincronizarRemoto();

    // Sincronizar al volver a enfocar la app en el celular
    const handleFocus = () => {
      sincronizarRemoto();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('saas_turno_actualizado', cargarTurnos);

    // Polling ligero cada 20 segundos si hay conexión a internet
    const interval = setInterval(() => {
      if (navigator.onLine) {
        sincronizarRemoto();
      }
    }, 20000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('saas_turno_actualizado', cargarTurnos);
      clearInterval(interval);
    };
  }, [cargarTurnos, negocioId]);

  // Cambiar fecha en 1 día (+1 o -1)
  const cambiarDia = (deltaDias: number) => {
    const d = new Date(fechaActual + 'T12:00:00');
    d.setDate(d.getDate() + deltaDias);
    const nuevaFecha = d.toISOString().split('T')[0];
    setFechaActual(nuevaFecha);
    setMesVisualizado(new Date(nuevaFecha + 'T12:00:00'));
  };

  // Seleccionar día desde el popover
  const seleccionarDiaCalendario = (iso: string) => {
    setFechaActual(iso);
    setCalendarioAbierto(false);
  };

  // Navegar meses en el popover
  const cambiarMesPopover = (deltaMeses: number) => {
    setMesVisualizado((prev) => {
      const nuevo = new Date(prev);
      nuevo.setMonth(nuevo.getMonth() + deltaMeses);
      return nuevo;
    });
  };

  // Cobrar saldo restante y completar atención
  const handleConfirmarCobroAtencion = async () => {
    if (!modalAtenderTurno) return;
    try {
      await adminService.completarAtencion(negocioId, modalAtenderTurno.id, {
        metodoPagoResto: metodoPagoSeleccionado,
      });
    } catch {
      // Continuar con actualización local
    } finally {
      turnosStorage.actualizarEstadoTurno(negocioId, modalAtenderTurno.id, {
        estado: 'ATENDIDO',
        montoRestanteCobrado: modalAtenderTurno.saldoPendiente,
        saldoPendiente: 0,
        metodoPagoResto: metodoPagoSeleccionado,
      });
      setTurnos((prev) =>
        prev.map((t) =>
          t.id === modalAtenderTurno.id
            ? {
                ...t,
                estado: 'ATENDIDO',
                montoRestanteCobrado: t.saldoPendiente,
                saldoPendiente: 0,
                metodoPagoResto: metodoPagoSeleccionado,
              }
            : t
        )
      );
      setModalAtenderTurno(null);
      if (onRefreshCaja) onRefreshCaja();
    }
  };

  // Modal de Confirmación Amigable
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    tipo: 'AUSENTE' | 'CANCELAR';
    turno: Turno;
  } | null>(null);
  const [procesandoConfirmacion, setProcesandoConfirmacion] = useState(false);

  // Solicitar Marcar como Ausente (Abre modal amigable)
  const solicitarMarcarAusente = (turno: Turno) => {
    setModalConfirmacion({ tipo: 'AUSENTE', turno });
  };

  // Solicitar Cancelar Turno (Abre modal amigable)
  const solicitarCancelarTurno = (turno: Turno) => {
    setModalConfirmacion({ tipo: 'CANCELAR', turno });
  };

  // Ejecutar Acción Confirmada desde el modal
  const ejecutarAccionConfirmada = async () => {
    if (!modalConfirmacion) return;
    const { tipo, turno } = modalConfirmacion;
    setProcesandoConfirmacion(true);

    try {
      if (tipo === 'AUSENTE') {
        await adminService.marcarAusente(negocioId, turno.id);
        turnosStorage.actualizarEstadoTurno(negocioId, turno.id, { estado: 'AUSENTE' });
        setTurnos((prev) =>
          prev.map((t) => (t.id === turno.id ? { ...t, estado: 'AUSENTE' } : t))
        );
      } else {
        await adminService.cancelarTurnoDueno(negocioId, turno.id);
        turnosStorage.actualizarEstadoTurno(negocioId, turno.id, { estado: 'CANCELADO' });
        setTurnos((prev) =>
          prev.map((t) => (t.id === turno.id ? { ...t, estado: 'CANCELADO' } : t))
        );
      }
      if (onRefreshCaja) onRefreshCaja();
    } catch {
      // Fallback local garantizado
      const nuevoEstado = tipo === 'AUSENTE' ? 'AUSENTE' : 'CANCELADO';
      turnosStorage.actualizarEstadoTurno(negocioId, turno.id, { estado: nuevoEstado });
      setTurnos((prev) =>
        prev.map((t) => (t.id === turno.id ? { ...t, estado: nuevoEstado } : t))
      );
      if (onRefreshCaja) onRefreshCaja();
    } finally {
      setProcesandoConfirmacion(false);
      setModalConfirmacion(null);
    }
  };

  // Crear Turno Manual
  const handleCrearTurnoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoManual(true);

    const servicioSel = servicios.find((s) => s.id === manualServicioId);
    const profSel = profesionales.find((p) => p.id === manualProfesionalId);

    const payload: CrearTurnoManualPayload = {
      servicioId: manualServicioId,
      profesionalId: manualProfesionalId,
      fechaHoraInicio: `${fechaActual}T${manualHora}:00-03:00`,
      clienteNombre: manualClienteNombre.trim(),
      clienteTelefono: manualClienteTelefono.trim(),
      senaYaAbonada: manualSenaAbonada,
    };

    const turnoManualLocal: Turno = {
      id: Date.now(),
      codigoReserva: `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      negocioId,
      negocioNombre: 'Consultorio Sonrisa Plena',
      negocioSlug: 'odontologia-sonrisa-plena',
      negocioWhatsapp: '5491166778899',
      profesionalId: manualProfesionalId,
      profesionalNombre: profSel?.nombre || 'Dra. Valentina Gómez',
      profesionalColor: profSel?.colorAgenda || '#00685f',
      servicioId: manualServicioId,
      servicioNombre: servicioSel?.nombre || 'Consulta Odontológica',
      duracionMinutos: servicioSel?.duracionMinutos || 45,
      fechaHoraInicio: `${fechaActual}T${manualHora}:00-03:00`,
      fechaHoraFin: `${fechaActual}T${manualHora}:45-03:00`,
      clienteNombre: manualClienteNombre.trim(),
      clienteTelefono: manualClienteTelefono.trim(),
      clienteEmail: null,
      notasCliente: 'Turno manual agendado desde el panel',
      estado: manualSenaAbonada ? 'SENADO' : 'CONFIRMADO',
      precioTotal: servicioSel?.precio || 25000,
      montoSenaAcordado: servicioSel?.montoSena || 0,
      montoSenaAbonado: manualSenaAbonada ? (servicioSel?.montoSena || 10000) : 0,
      montoRestanteCobrado: 0,
      saldoPendiente: servicioSel
        ? manualSenaAbonada
          ? servicioSel.precio - servicioSel.montoSena
          : servicioSel.precio
        : 25000,
      metodoPagoResto: null,
      expiraEn: null,
      origen: 'MANUAL_ADMIN',
      version: 0,
    };

    try {
      await adminService.crearTurnoManual(negocioId, payload);
    } catch (err: any) {
      console.info('Guardando turno manual en modo local:', err);
    } finally {
      turnosStorage.guardarTurnoLocal(turnoManualLocal);
      setModalManualOpen(false);
      setManualClienteNombre('');
      setManualClienteTelefono('');
      cargarTurnos();
      if (onRefreshCaja) onRefreshCaja();
      setGuardandoManual(false);
    }
  };

  // Filtrado de turnos
  const turnosFiltrados = turnos.filter((t) => {
    if (profesionalFiltro === 'TODOS') return true;
    return t.profesionalId === profesionalFiltro;
  });

  const fechaFormateada = new Date(fechaActual + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const hoyISO = new Date().toISOString().split('T')[0];

  // Días que tienen turnos agendados para pintar un punto indicador en el calendario
  const diasConTurnos = React.useMemo(() => {
    const setDias = new Set<string>();
    turnosStorage.getTurnosLocales(negocioId).forEach((t) => {
      if (t.fechaHoraInicio) {
        setDias.add(t.fechaHoraInicio.split('T')[0]);
      }
    });
    return setDias;
  }, [negocioId, turnos]);

  // Cálculo de la cuadrícula mensual para el DatePicker Popover
  const anioPopover = mesVisualizado.getFullYear();
  const mesPopover = mesVisualizado.getMonth();
  const primerDiaMes = new Date(anioPopover, mesPopover, 1);
  const ultimoDiaMes = new Date(anioPopover, mesPopover + 1, 0);
  const diasEnMes = ultimoDiaMes.getDate();
  const diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7; // Lunes=0, Domingo=6

  const diasCuadricula: ({ dia: number; iso: string } | null)[] = [];
  for (let i = 0; i < diaSemanaInicio; i++) {
    diasCuadricula.push(null);
  }
  for (let d = 1; d <= diasEnMes; d++) {
    const mesStr = String(mesPopover + 1).padStart(2, '0');
    const diaStr = String(d).padStart(2, '0');
    diasCuadricula.push({ dia: d, iso: `${anioPopover}-${mesStr}-${diaStr}` });
  }

  const nombreMesAnio = mesVisualizado.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Barra de Control de Fecha & Acciones con Selector de Calendario Integrado */}
      <div className="p-5 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Selector de Fecha Híbrido: Flechas rápidas + Popover Calendario */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative" ref={popoverRef}>
          {/* Botón Día Anterior */}
          <button
            type="button"
            onClick={() => cambiarDia(-1)}
            className="p-2.5 rounded-xl border-2 border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Día anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Botón Central: Clic para abrir el Calendario Mensual */}
          <button
            type="button"
            onClick={() => {
              setMesVisualizado(new Date(fechaActual + 'T12:00:00'));
              setCalendarioAbierto((prev) => !prev);
            }}
            className="flex items-center gap-3 px-4 py-2 rounded-xl border-2 border-slate-300 hover:border-indigo-600 bg-slate-50 hover:bg-indigo-50/50 transition-all cursor-pointer text-left group"
            title="Hacé clic para elegir cualquier fecha en el calendario"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-100 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
              <CalendarDays className="w-5 h-5 stroke-[2.3]" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block leading-tight">
                Fecha Seleccionada (Clic para cambiar)
              </span>
              <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-zinc-50 capitalize leading-tight">
                {fechaFormateada}
              </h2>
            </div>
          </button>

          {/* Botón Día Siguiente */}
          <button
            type="button"
            onClick={() => cambiarDia(1)}
            className="p-2.5 rounded-xl border-2 border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Día siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Botón Volver a Hoy */}
          <button
            type="button"
            onClick={() => {
              setFechaActual(hoyISO);
              setMesVisualizado(new Date());
            }}
            className={`px-3.5 py-2 text-xs font-black rounded-xl border-2 transition-colors cursor-pointer shrink-0 ${
              fechaActual === hoyISO
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-950'
            }`}
          >
            Hoy
          </button>

          {/* ============================================================ */}
          {/* POPOVER CALENDARIO MENSUAL COMPLETO                          */}
          {/* ============================================================ */}
          {calendarioAbierto && (
            <>
              {/* Overlay oscuro de fondo en móviles para cerrar al tocar afuera */}
              <div
                className="fixed inset-0 bg-black/40 z-40 sm:hidden"
                onClick={() => setCalendarioAbierto(false)}
              />

              <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:left-0 top-24 sm:top-full mt-2 z-50 max-w-xs sm:w-80 mx-auto p-4 bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {/* Encabezado del mes con navegación */}
                <div className="flex items-center justify-between mb-3 border-b-2 border-slate-100 dark:border-zinc-800 pb-2.5">
                  <button
                    type="button"
                    onClick={() => cambiarMesPopover(-1)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-black text-sm text-slate-950 dark:text-white capitalize">
                    {nombreMesAnio}
                  </span>

                  <button
                    type="button"
                    onClick={() => cambiarMesPopover(1)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                  {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d) => (
                    <span key={d} className="text-[11px] font-black text-slate-500 uppercase">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Cuadrícula de días */}
                <div className="grid grid-cols-7 gap-1">
                  {diasCuadricula.map((item, idx) => {
                    if (!item) {
                      return <div key={`empty-${idx}`} className="h-8 w-8" />;
                    }

                    const isSeleccionado = item.iso === fechaActual;
                    const isHoy = item.iso === hoyISO;
                    const tieneTurnos = diasConTurnos.has(item.iso);

                    return (
                      <button
                        key={item.iso}
                        type="button"
                        onClick={() => seleccionarDiaCalendario(item.iso)}
                        className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-xs font-black flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                          isSeleccionado
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                            : isHoy
                            ? 'bg-indigo-50 border-2 border-indigo-400 text-indigo-900 font-black'
                            : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        <span>{item.dia}</span>
                        {tieneTurnos && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full absolute bottom-0.5 ${
                              isSeleccionado ? 'bg-white' : 'bg-teal-600'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Botón inferior rápido */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => seleccionarDiaCalendario(hoyISO)}
                    className="font-black text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Ir al día de Hoy
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalendarioAbierto(false)}
                    className="font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filtro de Colaborador & Botón Turno Manual */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-slate-300 bg-slate-100 text-xs font-bold text-slate-950 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-700 shrink-0" />
            <select
              value={profesionalFiltro}
              onChange={(e) =>
                setProfesionalFiltro(
                  e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value)
                )
              }
              className="bg-transparent border-0 focus:outline-none cursor-pointer font-bold text-slate-950 w-full"
            >
              <option value="TODOS">Todos los colaboradores</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setModalManualOpen(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.8} />
            <span>Turno Manual</span>
          </button>
        </div>
      </div>

      {/* Banner de Turnos en Otras Fechas */}
      {turnosOtrasFechas.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-200 text-amber-800 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <strong className="block font-black text-sm text-amber-950">
                🔔 Tenés turnos agendados en otras fechas
              </strong>
              <span>
                Hay reservas registradas en el sistema para días distintos a la fecha seleccionada ({fechaFormateada}).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {turnosOtrasFechas.map((item) => {
              const dObj = new Date(item.fecha + 'T12:00:00');
              const fechaLabel = dObj.toLocaleDateString('es-AR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              return (
                <button
                  key={item.fecha}
                  type="button"
                  onClick={() => {
                    setFechaActual(item.fecha);
                    setMesVisualizado(dObj);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 border border-amber-400 text-xs font-black text-amber-950 flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                  title={`Ver turnos del ${fechaLabel}`}
                >
                  <span>📅 Ir al {fechaLabel}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-900 text-white text-[10px] font-black">
                    {item.count} {item.count === 1 ? 'turno' : 'turnos'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de Turnos del Día */}
      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-slate-700">
          Cargando agenda de turnos...
        </div>
      ) : turnosFiltrados.length === 0 ? (
        <div className="py-16 text-center space-y-2 p-8 rounded-2xl border-2 border-dashed border-slate-400 bg-white shadow-sm">
          <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-slate-950">
            No hay turnos agendados para este día ({fechaFormateada})
          </h3>
          <p className="text-xs font-semibold text-slate-700 max-w-sm mx-auto">
            Los clientes que reserven desde el turnero público aparecerán acá automáticamente, o podés agregar uno manualmente con el botón superior.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {turnosFiltrados.map((turno) => {
            const formatearHora = (iso: string) => {
              try {
                if (iso.includes('T')) {
                  return iso.split('T')[1].substring(0, 5) + ' hs';
                }
                const d = new Date(iso);
                return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} hs`;
              } catch {
                return '10:00 hs';
              }
            };
            const horaInicio = formatearHora(turno.fechaHoraInicio);
            const horaFin = formatearHora(turno.fechaHoraFin);
            const iniciales = (turno.clienteNombre || 'PA')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={turno.id}
                className="p-4 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md space-y-3.5"
              >
                {/* Cabecera del Turno: Horario & Estado */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {horaInicio} - {horaFin}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 block -mt-0.5">
                        {turno.duracionMinutos} min • {turno.profesionalNombre}
                      </span>
                    </div>
                  </div>

                  {/* Badges de Estado con diseño clínico pulido */}
                  {turno.estado === 'SENADO' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Seña ${Number(turno.montoSenaAbonado).toLocaleString('es-AR')}</span>
                    </span>
                  )}
                  {turno.estado === 'CONFIRMADO' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Confirmado</span>
                    </span>
                  )}
                  {turno.estado === 'PENDIENTE_PAGO' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Esperando seña</span>
                    </span>
                  )}
                  {turno.estado === 'ATENDIDO' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Atendido</span>
                    </span>
                  )}
                  {turno.estado === 'AUSENTE' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      <UserX className="w-3.5 h-3.5 text-rose-600" />
                      <span>No asistió</span>
                    </span>
                  )}
                  {turno.estado === 'CANCELADO' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 line-through border border-slate-200">
                      Cancelado
                    </span>
                  )}
                </div>

                {/* Tratamiento */}
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-zinc-50 leading-snug">
                    {turno.servicioNombre}
                  </h3>
                </div>

                {/* Tarjeta del Paciente */}
                <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {iniciales}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {turno.clienteNombre}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Paciente
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${turno.clienteTelefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${turno.clienteNombre}! Te escribimos desde el consultorio por tu turno de ${turno.servicioNombre}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] dark:text-[#25D366] text-xs font-bold border border-[#25D366]/30 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Notas si existen (sin comillas raras) */}
                {turno.notasCliente && (
                  <div className="text-xs text-slate-700 dark:text-zinc-300 bg-amber-50/70 border border-amber-200/80 px-3 py-1.5 rounded-lg">
                    <span className="font-bold text-amber-900">Nota del paciente: </span>
                    {turno.notasCliente}
                  </div>
                )}

                {/* Pie: Finanzas y Botones de Acción */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Total del Tratamiento: ${Number(turno.precioTotal).toLocaleString('es-AR')}
                    </span>
                    {turno.saldoPendiente > 0 && turno.estado !== 'ATENDIDO' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-md mt-0.5">
                        Resta cobrar en consultorio: ${Number(turno.saldoPendiente).toLocaleString('es-AR')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-md mt-0.5">
                        Cobrado completo
                      </span>
                    )}
                  </div>

                  {/* Botones de acción clínica */}
                  <div className="flex items-center gap-2">
                    {turno.estado !== 'ATENDIDO' &&
                      turno.estado !== 'CANCELADO' &&
                      turno.estado !== 'AUSENTE' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModalAtenderTurno(turno)}
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Cobrar saldo restante y marcar atendido"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Cobrar & Atender</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => solicitarMarcarAusente(turno)}
                            className="min-h-[40px] px-3 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                            title="Marcar como No Asistió (Seña retenida)"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}

                    {turno.estado !== 'CANCELADO' && turno.estado !== 'ATENDIDO' && (
                      <button
                        type="button"
                        onClick={() => solicitarCancelarTurno(turno)}
                        className="min-h-[40px] px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                        title="Cancelar turno"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cobrar Saldo y Atender */}
      {modalAtenderTurno && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border-2 border-slate-300 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-base text-slate-950 dark:text-zinc-100">
                  Cobrar Saldo & Finalizar Atención
                </h3>
                <span className="text-xs font-bold text-slate-700">
                  Cliente: {modalAtenderTurno.clienteNombre}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalAtenderTurno(null)}
                className="p-1 rounded-lg text-slate-700 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-100 border-2 border-slate-300 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Precio Total del Servicio:</span>
                  <span className="font-black text-slate-950">
                    ${Number(modalAtenderTurno.precioTotal).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Seña Ya Abonada Online:</span>
                  <span className="font-black">
                    -${Number(modalAtenderTurno.montoSenaAbonado).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="pt-2 border-t-2 border-slate-200 flex justify-between font-black text-base text-indigo-950">
                  <span>Saldo a Cobrar en Local:</span>
                  <span className="text-emerald-700 text-lg">
                    ${Number(modalAtenderTurno.saldoPendiente).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                  ¿Cómo pagó el cliente el saldo en el local?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { key: 'TRANSFERENCIA', label: 'Transferencia', icon: Smartphone },
                    { key: 'MERCADO_PAGO', label: 'Mercado Pago (QR)', icon: CreditCard },
                    { key: 'TARJETA', label: 'Tarjeta Débito/Crédito', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = metodoPagoSeleccionado === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMetodoPagoSeleccionado(m.key as MetodoPago)}
                        className={`p-3 rounded-xl border-2 text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-sm ring-2 ring-indigo-500/20'
                            : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-indigo-600" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalAtenderTurno(null)}
                  className="flex-1 min-h-[44px] rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarCobroAtencion}
                  className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md"
                >
                  Confirmar Cobro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Turno Manual */}
      {modalManualOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border-2 border-slate-300 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-base text-slate-950">
                Nuevo Turno Manual (Walk-in / Telefónico)
              </h3>
              <button
                type="button"
                onClick={() => setModalManualOpen(false)}
                className="p-1 rounded-lg text-slate-700 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearTurnoManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                  Servicio *
                </label>
                <select
                  value={manualServicioId}
                  onChange={(e) => setManualServicioId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-bold text-sm focus:border-indigo-600"
                >
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} (${Number(s.precio).toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                  Colaborador que Atenderá *
                </label>
                <select
                  value={manualProfesionalId}
                  onChange={(e) => setManualProfesionalId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-bold text-sm focus:border-indigo-600"
                >
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  required
                  value={manualHora}
                  onChange={(e) => setManualHora(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-950 font-black text-sm focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                  Nombre y Apellido del Paciente *
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={manualClienteNombre}
                  onChange={(e) => setManualClienteNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-white font-bold text-sm focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={manualClienteTelefono}
                  onChange={(e) => setManualClienteTelefono(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-white font-bold text-sm focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 border-2 border-slate-300">
                <span className="text-xs font-black text-slate-900">
                  ¿El cliente ya dejó una seña en efectivo?
                </span>
                <input
                  type="checkbox"
                  checked={manualSenaAbonada}
                  onChange={(e) => setManualSenaAbonada(e.target.checked)}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalManualOpen(false)}
                  className="flex-1 min-h-[44px] rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoManual}
                  className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md"
                >
                  {guardandoManual ? 'Guardando...' : 'Agendar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación amigable para Ausente / Cancelar */}
      {modalConfirmacion && (
        <ConfirmModal
          isOpen={!!modalConfirmacion}
          loading={procesandoConfirmacion}
          onClose={() => !procesandoConfirmacion && setModalConfirmacion(null)}
          onConfirm={ejecutarAccionConfirmada}
          variant={modalConfirmacion.tipo === 'AUSENTE' ? 'warning' : 'danger'}
          title={
            modalConfirmacion.tipo === 'AUSENTE'
              ? '¿Marcar al paciente como ausente?'
              : '¿Confirmás cancelar este turno?'
          }
          confirmText={
            modalConfirmacion.tipo === 'AUSENTE'
              ? 'Sí, marcar ausente'
              : 'Sí, cancelar turno'
          }
          cancelText="No, volver"
          description={
            modalConfirmacion.tipo === 'AUSENTE' ? (
              <div className="space-y-2.5 text-left bg-slate-50 dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 mt-2">
                <p className="text-xs text-slate-700 dark:text-zinc-200">
                  Paciente:{' '}
                  <strong className="text-slate-950 dark:text-white font-black">
                    {modalConfirmacion.turno.clienteNombre}
                  </strong>
                </p>
                <p className="text-xs text-slate-700 dark:text-zinc-200">
                  Tratamiento:{' '}
                  <strong className="text-slate-950 dark:text-white font-bold">
                    {modalConfirmacion.turno.servicioNombre}
                  </strong>
                </p>
                {modalConfirmacion.turno.montoSenaAbonado > 0 ? (
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                    🛡️ La seña abonada de ${modalConfirmacion.turno.montoSenaAbonado.toLocaleString('es-AR')} queda retenida e imputada en caja del consultorio.
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    El turno pasará al historial de ausencias del consultorio.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 text-left bg-slate-50 dark:bg-zinc-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 mt-2">
                <p className="text-xs text-slate-700 dark:text-zinc-200">
                  Paciente:{' '}
                  <strong className="text-slate-950 dark:text-white font-black">
                    {modalConfirmacion.turno.clienteNombre}
                  </strong>
                </p>
                <p className="text-xs text-slate-700 dark:text-zinc-200">
                  Tratamiento:{' '}
                  <strong className="text-slate-950 dark:text-white font-bold">
                    {modalConfirmacion.turno.servicioNombre}
                  </strong>
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                  ⚠️ El turno quedará liberado en la agenda y el horario estará disponible nuevamente para otros pacientes.
                </p>
              </div>
            )
          }
        />
      )}
    </div>
  );
};
