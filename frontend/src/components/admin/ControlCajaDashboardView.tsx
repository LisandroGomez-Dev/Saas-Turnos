import React, { useState, useEffect, useCallback } from 'react';
import { ResumenCajaMetricas } from '../../types';
import { adminService } from '../../services/adminService';
import { turnosStorage } from '../../services/turnosStorage';
import {
  DollarSign,
  ShieldCheck,
  UserX,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  Users,
  Award,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';

interface ControlCajaDashboardViewProps {
  negocioId: number;
}

export const ControlCajaDashboardView: React.FC<ControlCajaDashboardViewProps> = ({
  negocioId,
}) => {
  const [periodo, setPeriodo] = useState<'HOY' | 'SEMANA' | 'MES'>('MES');
  const [metricas, setMetricas] = useState<ResumenCajaMetricas | null>(null);
  const [loading, setLoading] = useState(false);

  const getFechasPeriodo = useCallback(() => {
    const hoy = new Date();
    const hoyISO = hoy.toISOString().split('T')[0];

    if (periodo === 'HOY') {
      return { desde: hoyISO, hasta: hoyISO };
    }

    if (periodo === 'SEMANA') {
      const primerDiaSemana = new Date(hoy);
      primerDiaSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
      return {
        desde: primerDiaSemana.toISOString().split('T')[0],
        hasta: hoyISO,
      };
    }

    // MES
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return {
      desde: primerDiaMes.toISOString().split('T')[0],
      hasta: hoyISO,
    };
  }, [periodo]);

  const cargarMetricas = useCallback(async () => {
    setLoading(true);
    const { desde, hasta } = getFechasPeriodo();

    try {
      const data = await adminService.getMetricasCaja(negocioId, desde, hasta);
      if (data && (data.totalTurnosPeriodo > 0 || data.ingresosRealesTotales > 0)) {
        setMetricas(data);
        return;
      }
    } catch {
      // Backend offline o en modo preview
    }

    // Calcula en base a los turnos reales registrados en el sistema
    const metricasReales = turnosStorage.calcularMetricasCaja(negocioId, desde, hasta);
    setMetricas(metricasReales);
    setLoading(false);
  }, [negocioId, getFechasPeriodo]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  if (!metricas && loading) {
    return (
      <div className="py-20 text-center text-sm font-bold text-slate-700">
        Calculando métricas de caja...
      </div>
    );
  }

  if (!metricas) return null;

  return (
    <div className="space-y-6">
      {/* Header con Selector de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-zinc-50 tracking-tight">
              Control de Caja & Facturación
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">
            Registro en tiempo real de ingresos, señas cobradas por Mercado Pago y saldos en consultorio.
          </p>
        </div>

        <div className="flex gap-1.5 p-1.5 rounded-2xl bg-slate-200 dark:bg-zinc-800 border-2 border-slate-300 dark:border-zinc-700 self-start sm:self-auto shadow-2xs">
          {[
            { key: 'HOY', label: 'Hoy' },
            { key: 'SEMANA', label: 'Esta Semana' },
            { key: 'MES', label: 'Este Mes' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPeriodo(item.key as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                periodo === item.key
                  ? 'bg-white dark:bg-zinc-900 text-teal-950 dark:text-teal-400 shadow-sm border border-slate-300'
                  : 'text-slate-800 dark:text-zinc-200 hover:text-slate-950'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de 4 KPIs Financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Caja Real Total */}
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Caja Real Cobrada
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                ${Number(metricas.ingresosRealesTotales).toLocaleString('es-AR')}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Señas cobradas + saldo en consultorio</span>
          </div>
        </div>

        {/* KPI 2: Señas Mercado Pago */}
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Señas Mercado Pago
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-teal-900 dark:text-teal-400 tracking-tight">
                ${Number(metricas.totalSenasRecaudadas).toLocaleString('es-AR')}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-400">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Asegurado por adelantado online</span>
          </div>
        </div>

        {/* KPI 3: Dinero Salvado en Ausencias */}
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Dinero Salvado
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-400 tracking-tight">
                ${Number(metricas.dineroProtegidoPorSenasEnAusencias).toLocaleString('es-AR')}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Señas retenidas ante faltas</span>
          </div>
        </div>

        {/* KPI 4: Tasa de Asistencia */}
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Asistencia Pacientes
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <Users className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                {(100 - metricas.tasaAusentismoPorcentaje).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-400">
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>{metricas.turnosAtendidos} pacientes asistidos</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN: RENDIMIENTO DE TRATAMIENTOS & SERVICIOS */}
      <div className="p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold border border-teal-200 dark:border-teal-800 shrink-0">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-100 tracking-tight">
                Rendimiento de Tratamientos y Servicios
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                Demanda de pacientes y recaudación acumulada por prestación.
              </p>
            </div>
          </div>

          <span className="self-start sm:self-auto text-xs font-black text-teal-900 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-3.5 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
            {metricas.totalTurnosPeriodo} {metricas.totalTurnosPeriodo === 1 ? 'turno agendado' : 'turnos agendados'}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {metricas.serviciosMasRentables.length === 0 ? (
            <p className="text-xs font-semibold text-slate-500 py-6 text-center">
              No hay turnos registrados en este período.
            </p>
          ) : (
            metricas.serviciosMasRentables.map((serv, index) => {
              const porcentaje =
                metricas.totalTurnosPeriodo > 0
                  ? Math.round((serv.cantidadTurnos / metricas.totalTurnosPeriodo) * 100)
                  : 0;

              return (
                <div
                  key={serv.servicioNombre}
                  className="p-4 rounded-xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-2.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        #{index + 1}
                      </span>
                      <span className="font-extrabold text-sm text-slate-950 dark:text-zinc-100 leading-snug">
                        {serv.servicioNombre}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-sm sm:text-base text-slate-950 dark:text-white">
                        ${Number(serv.totalRecaudado).toLocaleString('es-AR')}
                      </div>
                      {Number(serv.totalRecaudado) === 0 && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 block">
                          A liquidar en local
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fila secundaria: badge de turnos + porcentaje */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
                    <span className="bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                      {serv.cantidadTurnos} {serv.cantidadTurnos === 1 ? 'paciente' : 'pacientes'}
                    </span>
                    <span className="text-[11px] font-bold text-teal-800 dark:text-teal-400">
                      {porcentaje}% de la demanda
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="h-2 w-full bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-700 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(porcentaje, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Grid: Métodos de Cobranza & Volumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Desglose de Cobranza */}
        <div className="p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-100 pb-3 dark:border-zinc-800">
            <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-700" />
              <span>Desglose de Cobranza</span>
            </h3>
            <span className="text-xs font-black text-slate-950 dark:text-zinc-200 bg-slate-100 px-3 py-1 rounded-xl border border-slate-300">
              Total: ${Number(metricas.ingresosRealesTotales).toLocaleString('es-AR')}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {[
              {
                label: 'Señas Online (Mercado Pago)',
                amount: metricas.desglosePorMetodoPago['SEÑAS_MERCADO_PAGO'] || 0,
                color: 'bg-teal-600',
              },
              {
                label: 'Efectivo en Consultorio',
                amount: metricas.desglosePorMetodoPago['EFECTIVO'] || 0,
                color: 'bg-emerald-600',
              },
              {
                label: 'Transferencia Bancaria',
                amount: metricas.desglosePorMetodoPago['TRANSFERENCIA'] || 0,
                color: 'bg-sky-500',
              },
            ].map((medio) => {
              const porcentaje =
                metricas.ingresosRealesTotales > 0
                  ? Math.round((medio.amount / metricas.ingresosRealesTotales) * 100)
                  : 0;

              return (
                <div key={medio.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="font-extrabold text-slate-900 dark:text-zinc-100">
                      {medio.label}
                    </span>
                    <span className="font-black text-slate-950 dark:text-white">
                      ${Number(medio.amount).toLocaleString('es-AR')}{' '}
                      <span className="text-slate-600 dark:text-zinc-400 font-bold">
                        ({porcentaje}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-300/80">
                    <div
                      className={`h-full ${medio.color} rounded-full transition-all duration-500`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Volumen de Turnos y Proyección */}
        <div className="p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-100 flex items-center gap-2 border-b-2 border-slate-100 pb-3 dark:border-zinc-800">
              <Calendar className="w-5 h-5 text-teal-700" />
              <span>Estado de la Agenda</span>
            </h3>

            <div className="space-y-3 pt-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 dark:text-zinc-300">
                  Pacientes Atendidos:
                </span>
                <span className="font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
                  {metricas.turnosAtendidos}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 dark:text-zinc-300">
                  Próximos por Atender:
                </span>
                <span className="font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-lg border border-blue-300">
                  {metricas.turnosPorAtender}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 dark:text-zinc-300">
                  Pacientes Ausentes:
                </span>
                <span className="font-black text-rose-900 bg-rose-100 px-3 py-1 rounded-lg border border-rose-300">
                  {metricas.turnosAusentes}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 dark:text-zinc-300">
                  Cancelados:
                </span>
                <span className="font-black text-slate-800 bg-slate-200 px-3 py-1 rounded-lg border border-slate-300">
                  {metricas.turnosCancelados}
                </span>
              </div>
            </div>
          </div>

          {/* Ingresos Proyectados Destacados */}
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/50 border-2 border-teal-200 dark:border-teal-800">
            <span className="text-xs font-black uppercase tracking-wider text-teal-950 dark:text-teal-200 block">
              Ingresos Proyectados por Cobrar:
            </span>
            <span className="text-2xl font-black text-teal-950 dark:text-white block">
              ${Number(metricas.ingresosProyectadosPendientes).toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 mt-0.5 block">
              Saldos pendientes en turnos agendados en la web.
            </span>
          </div>
        </div>
      </div>

      {/* Profesional a Cargo (Sin colaboradores falsos) */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-zinc-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-700" />
          <span>Profesional a Cargo</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metricas.rendimientoPorProfesional.map((prof) => (
            <div
              key={prof.profesionalId}
              className="p-5 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                      style={{ backgroundColor: prof.profesionalColor }}
                    >
                      {prof.profesionalNombre.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-950 dark:text-zinc-50">
                        {prof.profesionalNombre}
                      </h4>
                      <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                        {prof.turnosAtendidos} {prof.turnosAtendidos === 1 ? 'turno atendido' : 'turnos atendidos'}
                      </span>
                    </div>
                  </div>

                  {prof.esDueno && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-100 text-teal-900 border border-teal-300">
                      Titular
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t-2 border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider">
                    Total Facturado
                  </span>
                  <span className="font-black text-xl text-slate-950 dark:text-white">
                    ${Number(prof.totalRecaudado).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-400 mb-1">
                  <span>Aporte al total</span>
                  <span>{prof.porcentajeSobreTotal}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-300">
                  <div
                    className="h-full bg-teal-700 rounded-full"
                    style={{ width: `${prof.porcentajeSobreTotal}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
