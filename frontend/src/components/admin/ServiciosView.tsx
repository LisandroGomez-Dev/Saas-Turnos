import React, { useState, useEffect } from 'react';
import { Servicio, CrearServicioPayload } from '../../types';
import { adminService } from '../../services/adminService';
import { Plus, Clock, ShieldAlert, Edit2, CheckCircle2, XCircle, X, Sparkles } from 'lucide-react';

interface ServiciosViewProps {
  negocioId: number;
  servicios: Servicio[];
  onRefresh: () => void;
}

export const ServiciosView: React.FC<ServiciosViewProps> = ({
  negocioId,
  servicios,
  onRefresh,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Notificaciones amigables (Toast)
  const [toastMsg, setToastMsg] = useState<{ tipo: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Form State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState(40);
  const [precio, setPrecio] = useState<number>(10000);
  const [requiereSena, setRequiereSena] = useState(true);
  const [montoSena, setMontoSena] = useState<number>(3000);

  const openCreateModal = () => {
    setEditingServicio(null);
    setNombre('');
    setDescripcion('');
    setDuracionMinutos(30);
    setPrecio(20000);
    setRequiereSena(true);
    setMontoSena(5000);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (s: Servicio) => {
    setEditingServicio(s);
    setNombre(s.nombre);
    setDescripcion(s.descripcion || '');
    setDuracionMinutos(s.duracionMinutos);
    setPrecio(Number(s.precio));
    setRequiereSena(s.requiereSena);
    setMontoSena(Number(s.montoSena));
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (requiereSena && montoSena > precio) {
      setErrorMsg('El monto de la seña no puede ser mayor al precio total del servicio.');
      return;
    }

    setLoading(true);
    try {
      const payload: CrearServicioPayload = {
        nombre,
        descripcion: descripcion.trim() || undefined,
        duracionMinutos: Number(duracionMinutos),
        precio: Number(precio),
        requiereSena,
        montoSena: requiereSena ? Number(montoSena) : 0,
      };

      if (editingServicio) {
        await adminService.updateServicio(negocioId, editingServicio.id, {
          ...payload,
          activo: editingServicio.activo,
        });
        setToastMsg({
          tipo: 'success',
          text: `¡${nombre} actualizado con éxito!`,
        });
      } else {
        await adminService.createServicio(negocioId, payload);
        setToastMsg({
          tipo: 'success',
          text: `¡${nombre} creado y agregado al catálogo!`,
        });
      }

      setModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (s: Servicio) => {
    try {
      await adminService.toggleServicioEstado(negocioId, s.id, !s.activo);
      setToastMsg({
        tipo: 'success',
        text: !s.activo
          ? `«${s.nombre}» activado para reservas online.`
          : `«${s.nombre}» pausado temporalmente.`,
      });
      onRefresh();
    } catch (err: any) {
      setToastMsg({
        tipo: 'error',
        text: err.message || 'No se pudo actualizar el estado del servicio.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con tipografía oscura de máximo contraste */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-zinc-50 tracking-tight">
            Catálogo de Servicios
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">
            Configurá la duración exacta y el monto fijo de seña para cada prestación.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.8} />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Lista de Servicios: Tarjetas blancas con bordes de alto contraste sobre fondo slate-100 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servicios.map((s) => (
          <div
            key={s.id}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              s.activo
                ? 'bg-white dark:bg-zinc-900 border-slate-300 hover:border-indigo-600 shadow-sm hover:shadow-md'
                : 'bg-slate-200/70 dark:bg-zinc-950/40 border-dashed border-slate-400 dark:border-zinc-700 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-50 leading-tight">
                      {s.nombre}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-300 dark:border-zinc-700 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
                      {s.duracionMinutos} min
                    </span>
                  </div>
                  {s.descripcion && (
                    <p className="mt-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                      {s.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(s)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:text-indigo-600 hover:bg-slate-200 border border-slate-300 dark:border-zinc-700 transition-colors cursor-pointer shadow-2xs"
                    title="Editar servicio"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleEstado(s)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:text-slate-950 border border-slate-300 dark:border-zinc-700 transition-colors cursor-pointer shadow-2xs"
                    title={s.activo ? 'Desactivar servicio' : 'Activar servicio'}
                  >
                    {s.activo ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Fila de Precios Formal y Estructurada */}
            <div className="mt-5 pt-4 border-t-2 border-slate-100 dark:border-zinc-800 flex items-end justify-between gap-2 text-sm">
              <div>
                <span className="text-[11px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                  Arancel Total
                </span>
                <span className="font-black text-slate-950 dark:text-zinc-50 text-2xl tracking-tight">
                  ${Number(s.precio).toLocaleString('es-AR')}
                </span>
                {s.requiereSena && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mt-0.5">
                    Saldo en sillón: ${Number(s.precio - s.montoSena).toLocaleString('es-AR')}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-[11px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Reserva & Seña
                </span>
                {s.requiereSena ? (
                  <span className="inline-flex items-center gap-1.5 font-black text-emerald-900 dark:text-emerald-300 text-xs bg-emerald-100 dark:bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    Seña: ${Number(s.montoSena).toLocaleString('es-AR')}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-xl border border-slate-300 dark:border-zinc-700">
                    Sin seña previa
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border-2 border-slate-300 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50">
              <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-100">
                {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-700 hover:text-slate-950 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                  Nombre de la Prestación o Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder=""
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-medium text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                    Duración Exacta *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={10}
                      step={5}
                      value={duracionMinutos}
                      onChange={(e) => setDuracionMinutos(Number(e.target.value))}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-black text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400">
                      min
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mt-1 block">
                    Bloquea este tiempo en el sillón.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                    Precio Total ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={precio}
                    onChange={(e) => setPrecio(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-black text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Sección Seña Fija Anti-Ausentismo */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 block">
                      ¿Exigir Seña Online por Mercado Pago?
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300">
                      Garantiza el turno y frena clientes que no se presentan.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requiereSena}
                    onChange={(e) => setRequiereSena(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {requiereSena && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200 mb-1">
                      Monto Fijo de Seña ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      max={precio}
                      step={100}
                      value={montoSena}
                      onChange={(e) => setMontoSena(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-black text-sm focus:outline-none focus:border-indigo-600"
                    />
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 mt-1 block">
                      El cliente abona ${Number(montoSena).toLocaleString('es-AR')} al reservar y el resto (${Number(precio - montoSena).toLocaleString('es-AR')}) en el local.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 min-h-[44px] rounded-xl border-2 border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Guardando...' : editingServicio ? 'Guardar Cambios' : 'Crear Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast flotante de confirmación amigable */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-4 ${
            toastMsg.tipo === 'success'
              ? 'bg-slate-950 border-emerald-500/30'
              : 'bg-rose-950 border-rose-500/30'
          }`}
        >
          {toastMsg.tipo === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}
    </div>
  );
};
