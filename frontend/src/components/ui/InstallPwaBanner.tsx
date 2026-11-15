import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
  });
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    // Detectar si ya está en modo standalone (instalada)
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsInstalled(checkStandalone);

    // Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // Escuchar evento de instalación PWA en Chrome / Android / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Escuchar cuando el usuario instala la app
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Escuchar estado de conexión (offline/online)
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      setShowAndroidModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* Banner de Estado Offline */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-xs animate-in fade-in sticky top-0 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo Offline (Sin internet) • Tu agenda y turnos guardados siguen funcionando normalmente.</span>
        </div>
      )}

      {/* Banner flotante de Instalación PWA (solo si no está instalada y no fue descartada) */}
      {!isInstalled && !dismissed && (
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-[#00685f] text-white border-b border-teal-600/30 px-3 py-2 sm:px-4 sm:py-2.5 shadow-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="truncate">
              <span className="font-extrabold text-white block leading-tight truncate">
                Instalá la App de Turnos
              </span>
              <span className="text-[11px] text-teal-100/90 truncate block">
                Usala con o sin internet desde tu pantalla de inicio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-teal-950 font-black text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Instructivo para iPhone (Safari) */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border-2 border-teal-500 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
                <Smartphone className="w-4 h-4 text-teal-700" />
                <span>Instalar en iPhone (Safari)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-black shrink-0">
                  1
                </span>
                <p>
                  Tocá el botón <strong>Compartir</strong> en la barra inferior de Safari{' '}
                  <span className="inline-flex items-center p-1 bg-slate-200 dark:bg-zinc-700 rounded-md">
                    <Share className="w-3.5 h-3.5" />
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-black shrink-0">
                  2
                </span>
                <p>
                  Deslizá hacia abajo y seleccioná <strong>«Agregar al inicio»</strong>{' '}
                  <span className="inline-flex items-center p-1 bg-slate-200 dark:bg-zinc-700 rounded-md">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-black shrink-0">
                  3
                </span>
                <p>
                  Tocá <strong>Agregar</strong> arriba a la derecha. La app quedará lista en tu pantalla y funcionará con o sin internet.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-700 text-white font-black text-xs hover:bg-teal-800 transition-colors cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Modal Instructivo para Android / Otros Navegadores */}
      {showAndroidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border-2 border-teal-500 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
                <Smartphone className="w-4 h-4 text-teal-700" />
                <span>Instalar en tu dispositivo</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-black shrink-0">
                  1
                </span>
                <p>
                  Tocá los <strong>tres puntos (⋮)</strong> en la esquina superior de tu navegador.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-black shrink-0">
                  2
                </span>
                <p>
                  Elegí <strong>«Instalar aplicación»</strong> o <strong>«Agregar a la pantalla principal»</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-black shrink-0">
                  3
                </span>
                <p>
                  Confirmá para tener el acceso directo en tu celular o PC y abrirla a pantalla completa.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-700 text-white font-black text-xs hover:bg-teal-800 transition-colors cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

