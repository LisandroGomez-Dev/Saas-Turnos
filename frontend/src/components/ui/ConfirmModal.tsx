import React, { useEffect } from 'react';
import { AlertTriangle, UserX, XCircle, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Volver',
  variant = 'warning',
  onConfirm,
  onClose,
  loading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const iconConfig = {
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25',
      icon: <UserX className="w-7 h-7 stroke-[2.3]" />,
    },
    danger: {
      bg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25',
      icon: <XCircle className="w-7 h-7 stroke-[2.3]" />,
    },
    info: {
      bg: 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700',
      btn: 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/25',
      icon: <Info className="w-7 h-7 stroke-[2.3]" />,
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm sm:max-w-md bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar sutil */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícono central destacado */}
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border-2 ${iconConfig.bg} shadow-sm`}
        >
          {iconConfig.icon}
        </div>

        {/* Título & Descripción */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-zinc-50 tracking-tight leading-snug">
            {title}
          </h3>
          <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed">
            {description}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs sm:text-sm font-black transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 min-h-[46px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${iconConfig.btn} disabled:opacity-50`}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

