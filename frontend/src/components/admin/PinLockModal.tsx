import React, { useState } from 'react';
import { Lock, Delete, X, ShieldAlert, Sparkles } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  pinCorrecto?: string;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  pinCorrecto = '1234', // PIN de acceso demo para el panel profesional
}) => {
  const [pinIngresado, setPinIngresado] = useState<string>('');
  const [errorAnim, setErrorAnim] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePressNumero = (num: number) => {
    if (pinIngresado.length >= 4) return;
    const nuevoPin = pinIngresado + num.toString();
    setPinIngresado(nuevoPin);
    setErrorMsg(null);

    // Si completó los 4 dígitos, verificar inmediatamente
    if (nuevoPin.length === 4) {
      if (nuevoPin === pinCorrecto) {
        onSuccess();
        setPinIngresado('');
      } else {
        setErrorAnim(true);
        setErrorMsg('PIN incorrecto. Intentá nuevamente.');
        setTimeout(() => {
          setPinIngresado('');
          setErrorAnim(false);
        }, 600);
      }
    }
  };

  const handleBorrar = () => {
    setPinIngresado((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xs bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-6 text-center ${
          errorAnim ? 'animate-shake' : ''
        }`}
      >
        {/* Header del Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-[#00685f]" />
            <span>Acceso Profesional</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Título y Mensaje */}
        <div className="space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#00685f]/10 text-[#00685f] flex items-center justify-center">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-black text-slate-950 dark:text-white">
            Ingresá tu PIN
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
            Consultorio Sonrisa Plena • Gestión del Consultorio
          </p>
        </div>

        {/* Círculos Indicadores de Dígitos */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[0, 1, 2, 3].map((idx) => {
            const hasDigit = pinIngresado.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasDigit
                    ? 'bg-[#00685f] scale-110 shadow-sm shadow-[#00685f]/40'
                    : 'bg-slate-200 dark:bg-zinc-800 border-2 border-slate-300 dark:border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 animate-in fade-in">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Teclado Numérico Touch-Friendly */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handlePressNumero(num)}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-950 dark:text-white text-xl font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Fila inferior: Vacío / 0 / Borrar */}
          <div />

          <button
            type="button"
            onClick={() => handlePressNumero(0)}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-950 dark:text-white text-xl font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBorrar}
            disabled={pinIngresado.length === 0}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-30 flex items-center justify-center"
            title="Borrar último dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setPinIngresado(pinCorrecto);
              setTimeout(() => {
                onSuccess();
                setPinIngresado('');
              }, 100);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-300 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            <span>Ingresar directo (PIN Demo: {pinCorrecto})</span>
          </button>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
            💡 PIN de demostración por defecto: <span className="font-mono font-bold text-[#00685f]">1234</span>
          </div>
        </div>
      </div>
    </div>
  );
};

