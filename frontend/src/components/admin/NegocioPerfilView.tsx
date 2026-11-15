import React, { useState } from 'react';
import { Negocio } from '../../types';
import { adminService } from '../../services/adminService';
import {
  Store,
  Phone,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Clock,
  ShieldCheck,
  Smartphone,
  Share2,
  Sparkles,
  Lock,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

interface NegocioPerfilViewProps {
  negocio: Negocio;
  onRefresh: () => void;
  onSelectNegocioId: (id: number) => void;
  adminPin?: string;
  onChangePin?: (newPin: string) => void;
}

export const NegocioPerfilView: React.FC<NegocioPerfilViewProps> = ({
  negocio,
  onRefresh,
  onSelectNegocioId,
  adminPin = '1621',
  onChangePin,
}) => {
  const [nombre, setNombre] = useState(negocio.nombre);
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState(negocio.telefonoWhatsapp);
  const [direccion, setDireccion] = useState(negocio.direccion || '');
  const [descripcion, setDescripcion] = useState(negocio.descripcion || '');
  const [cancelacionHorasMinimas, setCancelacionHorasMinimas] = useState(
    negocio.cancelacionHorasMinimas
  );
  const [pinLocal, setPinLocal] = useState(adminPin);
  const [pinActualizadoMsg, setPinActualizadoMsg] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const publicUrl = `${window.location.origin}/reservar/${negocio.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(false);
    setErrorMsg(null);

    try {
      await adminService.updateNegocio(negocio.id, {
        nombre,
        telefonoWhatsapp,
        direccion: direccion.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        cancelacionHorasMinimas: Number(cancelacionHorasMinimas),
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar los datos del negocio');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Encabezado de la Sección con Alto Contraste */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-zinc-50 tracking-tight">
          Configuración del Negocio & Canales
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">
          Personalizá los datos de tu establecimiento, gestioná el enlace público para Instagram/WhatsApp y cambiá de negocio demo.
        </p>
      </div>

      {/* Grid Balanceado y 100% Responsive: Formulario Principal + Sidebar de Acceso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda (2/3): Formulario de Información del Negocio */}
        <form
          onSubmit={handleGuardar}
          className="lg:col-span-2 p-6 sm:p-7 rounded-2xl border-2 border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-zinc-800 pb-3">
            <h3 className="font-black text-base sm:text-lg text-slate-950 dark:text-zinc-100 flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-600" />
              <span>Información del Establecimiento</span>
            </h3>
            <span className="text-xs font-black text-slate-700 dark:text-zinc-300 bg-slate-100 px-3 py-1 rounded-xl border border-slate-300">
              ID: {negocio.id} • Rubro: {negocio.rubro}
            </span>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>¡Datos actualizados correctamente en base de datos!</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs font-black flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1.5">
              Nombre Comercial del Negocio *
            </label>
            <div className="relative">
              <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-bold text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1.5">
              WhatsApp para Confirmaciones y Notificaciones *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                placeholder=""
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-bold text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mt-1 block">
              A este número los clientes enviarán su confirmación de turno y comprobante de seña con 1 clic.
            </span>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1.5">
              Dirección Física del Local o Consultorio
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder=""
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-bold text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1.5">
              Descripción Breve para Clientes
            </label>
            <textarea
              rows={3}
              placeholder=""
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-medium text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1.5">
              Horas Mínimas de Cancelación Anticipada
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="number"
                min={0}
                value={cancelacionHorasMinimas}
                onChange={(e) => setCancelacionHorasMinimas(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-950 dark:text-zinc-100 font-bold text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mt-1 block">
              Tiempo previo necesario para que el cliente pueda cancelar (12 o 24 horas antes).
            </span>
          </div>

          <div className="pt-3 border-t-2 border-slate-100 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="min-h-[46px] px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {/* Columna Derecha (1/3): Seguridad PIN y Estado del Consultorio */}
        <div className="space-y-6">
          {/* Card 1: Seguridad & PIN de Acceso */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="font-black text-base text-slate-950 dark:text-zinc-100">
                PIN de Acceso al Panel
              </h3>
            </div>

            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed">
              Código numérico de 4 dígitos para ingresar rápidamente a tu panel desde tu celular sin contraseñas largas.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 block">
                PIN Actual / Nuevo (4 Dígitos)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pinLocal}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPinLocal(val);
                  }}
                  className="w-28 text-center text-lg font-mono font-black tracking-widest px-3 py-2 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-950 dark:text-white focus:outline-none focus:border-teal-700"
                  placeholder="••••"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (pinLocal.length === 4 && onChangePin) {
                      onChangePin(pinLocal);
                      setPinActualizadoMsg(true);
                      setTimeout(() => setPinActualizadoMsg(false), 2500);
                    }
                  }}
                  disabled={pinLocal.length !== 4}
                  className="min-h-[42px] px-4 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-black text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {pinActualizadoMsg ? '¡PIN Guardado!' : 'Actualizar PIN'}
                </button>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
              Protege la caja y la agenda contra pacientes curiosos cuando uses tu celular o tablet.
            </div>
          </div>

          {/* Card 2: Estado del Consultorio en Producción */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border-2 border-slate-300 dark:border-zinc-700 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
                <h3 className="font-black text-sm text-slate-950 dark:text-zinc-100">
                  Estado de Producción
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operativo
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-700 dark:text-zinc-300 pt-1">
              <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                <span className="font-semibold text-slate-500">Profesional:</span>
                <span className="font-bold text-slate-950 dark:text-white">Dra. Valentina Gómez (M.P. 1000)</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                <span className="font-semibold text-slate-500">Ubicación:</span>
                <span className="font-bold text-slate-950 dark:text-white">Av. Santa Fe 3210, Piso 4 Depto B</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                <span className="font-semibold text-slate-500">WhatsApp Oficial:</span>
                <span className="font-bold text-slate-950 dark:text-white">+54 9 11 6677-8899</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="font-semibold text-slate-500">Página Web:</span>
                <span className="font-bold text-teal-700 flex items-center gap-1">
                  <span>sonrisaplena-demo.local</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
