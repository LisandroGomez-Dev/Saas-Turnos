import React, { useState, useEffect } from 'react';
import { Profesional, Servicio, FranjaHorariaPayload } from '../../types';
import { adminService } from '../../services/adminService';
import { Clock, Plus, Trash2, X, Shield, Check, CheckCircle, AlertCircle } from 'lucide-react';

interface EquipoViewProps {
  negocioId: number;
  profesionales: Profesional[];
  servicios: Servicio[];
  onRefresh: () => void;
}

const DIAS_SEMANA = [
  { dia: 1, label: 'Lunes' },
  { dia: 2, label: 'Martes' },
  { dia: 3, label: 'Miércoles' },
  { dia: 4, label: 'Jueves' },
  { dia: 5, label: 'Viernes' },
  { dia: 6, label: 'Sábado' },
  { dia: 7, label: 'Domingo' },
];

export const EquipoView: React.FC<EquipoViewProps> = ({
  negocioId,
  profesionales,
  servicios,
  onRefresh,
}) => {
  // Modal Crear Profesional
  const [profesionalModalOpen, setProfesionalModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [colorAgenda, setColorAgenda] = useState('#4F46E5');
  const [selectedServicios, setSelectedServicios] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  // Notificación amigable (Toast)
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!toastSuccess) return;
    const timer = setTimeout(() => setToastSuccess(null), 3500);
    return () => clearTimeout(timer);
  }, [toastSuccess]);

  // Modal Horarios
  const [horariosModalOpen, setHorariosModalOpen] = useState(false);
  const [selectedProfesional, setSelectedProfesional] = useState<Profesional | null>(null);
  const [franjas, setFranjas] = useState<FranjaHorariaPayload[]>([]);
  const [errorHorarios, setErrorHorarios] = useState<string | null>(null);

  const openCrearProfesional = () => {
    setNombre('');
    setEspecialidad('');
    setColorAgenda('#4F46E5');
    setSelectedServicios(servicios.map((s) => s.id));
    setErrorCrear(null);
    setProfesionalModalOpen(true);
  };

  const handleCrearProfesional = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorCrear(null);
    try {
      await adminService.createProfesional(negocioId, {
        nombre,
        especialidad: especialidad.trim() || undefined,
        colorAgenda,
        esDueno: false,
        servicioIds: selectedServicios,
      });
      setProfesionalModalOpen(false);
      setToastSuccess(`¡${nombre} se sumó al equipo correctamente!`);
      onRefresh();
    } catch (err: any) {
      setErrorCrear(err.message || 'Ocurrió un error al registrar el colaborador.');
    } finally {
      setLoading(false);
    }
  };

  const openConfigurarHorarios = async (p: Profesional) => {
    setSelectedProfesional(p);
    setErrorHorarios(null);
    try {
      const data = await adminService.getHorarios(p.id);
      if (data && data.length > 0) {
        const converted: FranjaHorariaPayload[] = data.map((h) => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio.substring(0, 5),
          horaFin: h.horaFin.substring(0, 5),
        }));
        setFranjas(converted);
      } else {
        // Horario por defecto Lunes a Viernes 09:00 a 18:00
        setFranjas([
          { diaSemana: 1, horaInicio: '09:00', horaFin: '13:00' },
          { diaSemana: 1, horaInicio: '14:00', horaFin: '18:00' },
          { diaSemana: 2, horaInicio: '09:00', horaFin: '18:00' },
          { diaSemana: 3, horaInicio: '09:00', horaFin: '18:00' },
          { diaSemana: 4, horaInicio: '09:00', horaFin: '18:00' },
          { diaSemana: 5, horaInicio: '09:00', horaFin: '18:00' },
          { diaSemana: 6, horaInicio: '09:00', horaFin: '14:00' },
        ]);
      }
      setHorariosModalOpen(true);
    } catch {
      // Fallback si no hay backend conectado
      setFranjas([
        { diaSemana: 1, horaInicio: '09:00', horaFin: '13:00' },
        { diaSemana: 1, horaInicio: '14:00', horaFin: '18:00' },
        { diaSemana: 2, horaInicio: '09:00', horaFin: '18:00' },
        { diaSemana: 3, horaInicio: '09:00', horaFin: '18:00' },
        { diaSemana: 4, horaInicio: '09:00', horaFin: '18:00' },
        { diaSemana: 5, horaInicio: '09:00', horaFin: '18:00' },
        { diaSemana: 6, horaInicio: '09:00', horaFin: '14:00' },
      ]);
      setHorariosModalOpen(true);
    }
  };

  const handleAddFranja = (dia: number) => {
    setFranjas((prev) => [
      ...prev,
      { diaSemana: dia, horaInicio: '09:00', horaFin: '13:00' },
    ]);
  };

  const handleRemoveFranja = (index: number) => {
    setFranjas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateFranja = (
    index: number,
    field: 'horaInicio' | 'horaFin',
    val: string
  ) => {
    setFranjas((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: val } : f))
    );
  };

  const handleGuardarHorarios = async () => {
    if (!selectedProfesional) return;
    setErrorHorarios(null);
    setLoading(true);

    try {
      await adminService.updateHorarios(selectedProfesional.id, franjas);
      setHorariosModalOpen(false);
      setToastSuccess(`¡Horarios de ${selectedProfesional.nombre} actualizados con éxito!`);
    } catch (err: any) {
      setErrorHorarios(err.message || 'Error al guardar horarios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con tipografía oscura de máximo contraste */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-zinc-50 tracking-tight">
            Equipo & Horarios de Atención
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">
            Gestioná quién atiende en el negocio y personalizá los días y franjas horarias de cada uno.
          </p>
        </div>

        <button
          type="button"
          onClick={openCrearProfesional}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.8} />
          <span>Agregar Colaborador</span>
        </button>
      </div>

      {/* Lista de Profesionales con Alto Contraste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profesionales.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0"
                    style={{ backgroundColor: p.colorAgenda }}
                  >
                    {p.nombre.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-50 leading-tight">
                        {p.nombre}
                      </h3>
                      {p.esDueno && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                          <Shield className="w-3.5 h-3.5 text-amber-700" />
                          Dueño
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300 mt-0.5">
                      {p.especialidad || 'Atención General'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Badges de servicios de alto contraste */}
              <div className="mt-5 pt-3.5 border-t-2 border-slate-100 dark:border-zinc-800">
                <span className="text-xs font-black text-slate-700 dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
                  Servicios que realiza ({p.servicioIds.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {p.servicioIds.map((sid) => {
                    const serv = servicios.find((s) => s.id === sid);
                    return serv ? (
                      <span
                        key={sid}
                        className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border border-slate-300 dark:border-zinc-700 shadow-2xs"
                      >
                        {serv.nombre}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Botón de acción con estilo oscuro de alto contraste */}
            <div className="mt-6 pt-4 border-t-2 border-slate-100 dark:border-zinc-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => openConfigurarHorarios(p)}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-black transition-all cursor-pointer shadow-sm"
              >
                <Clock className="w-4 h-4" />
                <span>Configurar Horarios</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Horarios */}
      {horariosModalOpen && selectedProfesional && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl border-2 border-slate-300 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50">
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-100">
                  Horarios de Atención: {selectedProfesional.nombre}
                </h3>
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-400">
                  Soporta horarios continuos o fraccionados (mañana y tarde).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHorariosModalOpen(false)}
                className="p-1 rounded-lg text-slate-700 hover:text-slate-950 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {errorHorarios && (
                <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold">
                  {errorHorarios}
                </div>
              )}

              {DIAS_SEMANA.map((d) => {
                const franjasDia = franjas
                  .map((f, idx) => ({ ...f, originalIdx: idx }))
                  .filter((f) => f.diaSemana === d.dia);

                return (
                  <div
                    key={d.dia}
                    className="p-4 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-950 dark:text-zinc-100">
                        {d.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddFranja(d.dia)}
                        className="text-xs font-black text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 flex items-center gap-1 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Franja</span>
                      </button>
                    </div>

                    {franjasDia.length === 0 ? (
                      <span className="text-xs font-bold text-slate-500 italic block">
                        No atiende este día (Cerrado)
                      </span>
                    ) : (
                      <div className="space-y-2">
                        {franjasDia.map((f) => (
                          <div
                            key={f.originalIdx}
                            className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-slate-300 dark:border-zinc-700"
                          >
                            <span className="text-xs font-black text-slate-700">De:</span>
                            <input
                              type="time"
                              value={f.horaInicio}
                              onChange={(e) =>
                                handleUpdateFranja(
                                  f.originalIdx,
                                  'horaInicio',
                                  e.target.value
                                )
                              }
                              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-zinc-600 text-xs font-bold text-slate-950 dark:text-white"
                            />
                            <span className="text-xs font-black text-slate-700">A:</span>
                            <input
                              type="time"
                              value={f.horaFin}
                              onChange={(e) =>
                                handleUpdateFranja(
                                  f.originalIdx,
                                  'horaFin',
                                  e.target.value
                                )
                              }
                              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-zinc-600 text-xs font-bold text-slate-950 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFranja(f.originalIdx)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-auto"
                              title="Eliminar franja"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setHorariosModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleGuardarHorarios}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md"
              >
                {loading ? 'Guardando...' : 'Guardar Horarios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Colaborador */}
      {profesionalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border-2 border-slate-300 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50">
              <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-100">
                Nuevo Colaborador
              </h3>
              <button
                type="button"
                onClick={() => setProfesionalModalOpen(false)}
                className="p-1 rounded-lg text-slate-700 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearProfesional} className="p-6 space-y-4">
              {errorCrear && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorCrear}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-bold text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                  Especialidad / Rol (Opcional)
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-medium text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                  Color Identificador en Agenda
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorAgenda}
                    onChange={(e) => setColorAgenda(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">{colorAgenda}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-2">
                  Servicios que realiza
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border-2 border-slate-200 rounded-xl">
                  {servicios.map((s) => {
                    const isChecked = selectedServicios.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-xs font-bold text-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServicios((prev) => [...prev, s.id]);
                            } else {
                              setSelectedServicios((prev) =>
                                prev.filter((id) => id !== s.id)
                              );
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{s.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setProfesionalModalOpen(false)}
                  className="flex-1 min-h-[44px] rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md"
                >
                  {loading ? 'Creando...' : 'Crear Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast flotante amigable */}
      {toastSuccess && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 bg-slate-950 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastSuccess}</span>
        </div>
      )}
    </div>
  );
};
