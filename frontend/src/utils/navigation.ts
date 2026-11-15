import React from 'react';

/**
 * Obtiene la URL de la landing page detectando dinámicamente el origen:
 * 1. Parámetro URL origin/landing (?origin=... o ?landing=...)
 * 2. Memoria de sesión guardada previamente (sessionStorage)
 * 3. Referrer del documento
 * 4. Variable de entorno configurada (si no es localhost en producción)
 * 5. Fallback seguro: localhost:5173 en desarrollo o raíz relativa en producción.
 */
export function getLandingUrl(): string {
  if (typeof window === 'undefined') return '/';

  // 1. Detectar desde query param (?origin=... o ?landing=...)
  const params = new URLSearchParams(window.location.search);
  const paramOrigin = params.get('origin') || params.get('landing');
  if (paramOrigin) {
    try {
      const decoded = decodeURIComponent(paramOrigin);
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        sessionStorage.setItem('saas_landing_origin', decoded);
        return decoded;
      }
    } catch {
      // Ignorar error de decodificación
    }
  }

  // 2. Revisar si ya se había guardado en sessionStorage
  try {
    const guardado = sessionStorage.getItem('saas_landing_origin');
    if (guardado && (guardado.startsWith('http://') || guardado.startsWith('https://'))) {
      return guardado;
    }
  } catch {
    // Ignorar restricciones de almacenamiento
  }

  // 3. Revisar document.referrer si viene de otro dominio o puerto
  if (document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.origin !== window.location.origin) {
        sessionStorage.setItem('saas_landing_origin', ref.origin);
        return ref.origin;
      }
    } catch {
      // Ignorar error de URL
    }
  }

  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  // 4. Variable de entorno configurada (si estamos en local usamos el env; en prod ignoramos si apunta a localhost)
  const envLanding = import.meta.env.VITE_LANDING_URL;
  if (envLanding) {
    if (isLocal) {
      return envLanding;
    } else if (!envLanding.includes('localhost') && !envLanding.includes('127.0.0.1')) {
      return envLanding;
    }
  }

  // 5. Fallback demo seguro
  return isLocal ? 'http://localhost:5173' : '/';
}

/**
 * Función robusta para volver a la landing page desde cualquier contexto:
 * - Si está en un iframe (modal de la landing): avisa al modal con postMessage y redirige.
 * - Si está en pestaña secundaria o ventana directa: garantiza la redirección a la landing.
 */
export function volverALanding(e?: React.MouseEvent) {
  if (e) {
    e.preventDefault();
  }

  const landingUrl = getLandingUrl();

  // 1. Contexto Iframe (Turnero embebido dentro del modal de la landing)
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  if (isIframe) {
    try {
      // Enviar mensaje al modal de la landing para que se cierre limpiamente
      window.parent.postMessage({ type: 'CERRAR_MODAL_TURNOS' }, '*');
    } catch {
      // Ignorar error cross-origin
    }

    try {
      if (window.top) {
        window.top.location.href = landingUrl;
        return;
      }
    } catch {
      // Ignorar restricción de frame superior
    }
    window.location.href = landingUrl;
    return;
  }

  // 2. Contexto Pestaña Secundaria (abierta mediante window.open o target="_blank")
  if (typeof window !== 'undefined') {
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.focus();
        window.close();
      } catch {
        // En móviles window.close() suele bloquearse silenciosamente
      }
    }
    // Redirección definitiva garantizada
    window.location.href = landingUrl;
  }
}

