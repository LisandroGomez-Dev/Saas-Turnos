import React, { useState, useEffect } from 'react';
import { Turno } from '../../types';
import { reservaService } from '../../services/reservaService';
import { turnosStorage } from '../../services/turnosStorage';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  MessageCircle,
  RotateCcw,
  Sparkles,
  CreditCard,
  Lock,
} from 'lucide-react';

interface ConfirmacionTurnoViewProps {
  turno: Turno;
  onVolverInicio: () => void;
  onIrAdmin?: () => void;
}

export const ConfirmacionTurnoView: React.FC<ConfirmacionTurnoViewProps> = ({
  turno: turnoInicial,
  onVolverInicio,
  onIrAdmin,
}) => {
  const [turno, setTurno] = useState<Turno>(turnoInicial);
  const [procesandoPago, setProcesandoPago] = useState(false);

  // Temporizador para estado PENDIENTE_PAGO
  const [segundosRestantes, setSegundosRestantes] = useState<number>(() => {
    if (turnoInicial.estado === 'PENDIENTE_PAGO' && turnoInicial.expiraEn) {
      const expira = new Date(turnoInicial.expiraEn).getTime();
      const diff = Math.floor((expira - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    return 600;
  });

  useEffect(() => {
    if (turno.estado !== 'PENDIENTE_PAGO') return;

    const interval = setInterval(() => {
      setSegundosRestantes((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [turno.estado]);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos
    .toString()
    .padStart(2, '0')}`;

  // Pago con Mercado Pago Checkout Pro (Modo Demo / Sandbox interactivo)
  const handlePagarConMercadoPago = async () => {
    setProcesandoPago(true);
    const tieneBackendActivo =
      (Boolean(import.meta.env.VITE_API_URL) &&
        !String(import.meta.env.VITE_API_URL).includes('localhost')) ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    try {
      if (tieneBackendActivo) {
        const pref = await reservaService.crearPreferenciaMercadoPago(turno.codigoReserva);
        if (!pref.modoSandbox && pref.initPoint) {
          window.location.href = pref.initPoint;
          return;
        }
        // En modo Sandbox local, simulamos el webhook aprobado con firma HMAC-SHA256
        const turnoActualizado = await reservaService.simularPagoSandboxMercadoPago(
          turno.codigoReserva
        );
        turnosStorage.guardarTurnoLocal(turnoActualizado);
        setTurno(turnoActualizado);
        return;
      }

      // Modo Demo en Vercel: simula la aprobación instantánea sin salir de la app
      await new Promise((resolve) => setTimeout(resolve, 500));
      const updated: Turno = {
        ...turno,
        estado: 'SENADO',
        montoSenaAbonado: turno.montoSenaAcordado,
        saldoPendiente: Math.max(0, turno.precioTotal - turno.montoSenaAcordado),
        expiraEn: null,
      };
      turnosStorage.guardarTurnoLocal(updated);
      setTurno(updated);
    } catch {
      // Fallback local si el servidor backend no está encendido
      const updated: Turno = {
        ...turno,
        estado: 'SENADO',
        montoSenaAbonado: turno.montoSenaAcordado,
        saldoPendiente: Math.max(0, turno.precioTotal - turno.montoSenaAcordado),
        expiraEn: null,
      };
      turnosStorage.guardarTurnoLocal(updated);
      setTurno(updated);
    } finally {
      setProcesandoPago(false);
    }
  };

  // Formato de fecha
  const fechaObj = new Date(turno.fechaHoraInicio);
  const fechaTexto = fechaObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const horaTexto = fechaObj.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const estadoSenaTexto =
    turno.estado === 'SENADO'
      ? `✅ Seña Abonada ($${Number(turno.montoSenaAbonado).toLocaleString('es-AR')})`
      : turno.estado === 'PENDIENTE_PAGO'
      ? `⏳ Seña Pendiente ($${Number(turno.montoSenaAcordado).toLocaleString('es-AR')})`
      : 'Confirmado sin seña';

  // Link para abrir WhatsApp con mensaje pre-armado
  const mensajeWhatsApp = encodeURIComponent(
    `¡Hola ${turno.negocioNombre}! Acabo de reservar mi turno para *${turno.servicioNombre}* con *${turno.profesionalNombre}* el *${fechaTexto}* a las *${horaTexto} hs*.\n\nCódigo: *${turno.codigoReserva}*\nEstado: *${estadoSenaTexto}*\nCliente: *${turno.clienteNombre}*`
  );
  const linkWhatsApp = `https://wa.me/${turno.negocioWhatsapp}?text=${mensajeWhatsApp}`;

  // Link para Google Calendar
  const fechaInicioISO = fechaObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const fechaFinObj = new Date(turno.fechaHoraFin);
  const fechaFinISO = fechaFinObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const linkGoogleCalendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `${turno.servicioNombre} - ${turno.negocioNombre}`
  )}&dates=${fechaInicioISO}/${fechaFinISO}&details=${encodeURIComponent(
    `Turno con ${turno.profesionalNombre}. Código: ${turno.codigoReserva}`
  )}`;

  return (
    <div className="max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Banner de Éxito con Alto Contraste */}
      <div className="text-center pt-2">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 border-2 border-emerald-300 mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/15 mb-3">
          <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
          {turno.estado === 'SENADO'
            ? '¡Seña Aprobada y Turno Confirmado!'
            : '¡Turno Reservado con Éxito!'}
        </h2>
        <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
          Guardá tu código para cualquier consulta o cancelación.
        </p>

        {/* Código de Reserva */}
        <div className="mt-3.5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-100 border-2 border-indigo-300 shadow-2xs">
          <span className="text-xs text-indigo-900 font-black">CÓDIGO:</span>
          <span className="font-mono font-black text-indigo-950 text-lg tracking-widest">
            {turno.codigoReserva}
          </span>
        </div>
      </div>

      {/* Estado SENADO confirmado */}
      {turno.estado === 'SENADO' && (
        <div className="p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-100 text-emerald-950 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-200 text-emerald-800 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-xs leading-relaxed">
            <strong className="block font-black text-sm text-emerald-950">
              Seña de ${Number(turno.montoSenaAbonado).toLocaleString('es-AR')} acreditada vía Mercado Pago
            </strong>
            Saldo restante a abonar en el local al momento de la atención: $
            {Number(turno.precioTotal - turno.montoSenaAbonado).toLocaleString('es-AR')}.
          </div>
        </div>
      )}

      {/* Alerta de Seña Pendiente */}
      {turno.estado === 'PENDIENTE_PAGO' && (
        <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-950 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Seña pendiente de confirmación
            </span>
            <span className="font-mono font-black text-xs bg-amber-200 border border-amber-400 px-2.5 py-1 rounded-lg text-amber-950">
              {segundosRestantes > 0 ? tiempoFormateado : 'Tiempo expirado'}
            </span>
          </div>

          <p className="text-xs font-semibold leading-relaxed text-amber-950">
            Tu horario está reservado por 10 minutos. Para asegurar tu turno definitivamente, aboná la seña de{' '}
            <strong className="font-black text-slate-950">
              ${Number(turno.montoSenaAcordado).toLocaleString('es-AR')}
            </strong>{' '}
            a través de Mercado Pago Checkout Pro.
          </p>

          <button
            type="button"
            disabled={procesandoPago || segundosRestantes <= 0}
            onClick={handlePagarConMercadoPago}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {procesandoPago
                ? 'Conectando con Mercado Pago...'
                : `Abonar Seña con Mercado Pago ($${Number(turno.montoSenaAcordado).toLocaleString('es-AR')})`}
            </span>
          </button>
        </div>
      )}

      {/* Tarjeta de Resumen con Alto Contraste */}
      <div className="p-6 rounded-2xl border-2 border-slate-300 bg-white shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b-2 border-slate-100 pb-2.5">
          Detalle del Turno
        </h3>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Fecha y Hora
            </span>
            <span className="font-black text-slate-950 capitalize">
              {fechaTexto}, {horaTexto} hs
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Servicio ({turno.duracionMinutos} min)
            </span>
            <span className="font-black text-slate-950">
              {turno.servicioNombre}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              Profesional
            </span>
            <span className="font-black text-slate-950 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: turno.profesionalColor }}
              />
              {turno.profesionalNombre}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-slate-500" />
              Precio Total del Servicio
            </span>
            <span className="font-black text-slate-950 text-base">
              ${Number(turno.precioTotal).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="space-y-2.5 pt-1">
        {onIrAdmin && (
          <button
            type="button"
            onClick={onIrAdmin}
            className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border-2 border-teal-700"
          >
            <Lock className="w-4 h-4 text-emerald-300" />
            <span>Ver este turno en el Panel Profesional</span>
          </button>
        )}

        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Enviar Confirmación por WhatsApp al Local</span>
        </a>

        <a
          href={linkGoogleCalendar}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[46px] py-2.5 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Guardar en Google Calendar</span>
        </a>

        <button
          type="button"
          onClick={onVolverInicio}
          className="w-full min-h-[44px] py-2 px-4 text-xs font-black text-slate-700 hover:text-slate-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reservar otro turno o ir al inicio del turnero</span>
        </button>
      </div>
    </div>
  );
};
