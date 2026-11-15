import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ConflictToastProps {
  message: string;
  onRefresh?: () => void;
  onClose: () => void;
}

export const ConflictToast: React.FC<ConflictToastProps> = ({
  message,
  onRefresh,
  onClose,
}) => {
  return (
    <div className="flex items-center gap-3 w-full max-w-md p-4 rounded-xl border border-amber-200 bg-amber-50/95 dark:bg-zinc-900 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-lg shadow-amber-900/5 backdrop-blur-sm transition-all duration-300">
      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
        <AlertCircle className="w-5 h-5" strokeWidth={1.75} />
      </div>

      <div className="flex-1 text-sm font-medium leading-relaxed">
        {message}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-[44px] px-3 py-2 text-xs font-semibold rounded-lg bg-amber-200/80 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refrescar horarios disponibles"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Actualizar</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-100 transition-colors cursor-pointer"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

