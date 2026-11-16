import React, { useState, useEffect, useCallback } from 'react';
import { Negocio, Servicio, Profesional, Turno } from './types';
import { adminService } from './services/adminService';
import { AgendaView } from './components/admin/AgendaView';
import { ControlCajaDashboardView } from './components/admin/ControlCajaDashboardView';
import { ServiciosView } from './components/admin/ServiciosView';
import { EquipoView } from './components/admin/EquipoView';
import { NegocioPerfilView } from './components/admin/NegocioPerfilView';
import { ReservaPublicaView } from './components/public/ReservaPublicaView';
import { ConfirmacionTurnoView } from './components/public/ConfirmacionTurnoView';
import { ConflictToast } from './components/ui/ConflictToast';
import { PinLockModal } from './components/admin/PinLockModal';
import { InstallPwaBanner } from './components/ui/InstallPwaBanner';
import {
  Calendar,
  Layers,
  Users,
  Settings,
  DollarSign,
  RefreshCw,
  Smartphone,
  LayoutDashboard,
  Lock,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { getLandingUrl, volverALanding } from './utils/navigation';

export const App: React.FC = () => {
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('saas_admin_pin') || '1234';
  });
  const [adminAutenticado, setAdminAutenticado] = useState<boolean>(() => {
    return localStorage.getItem('admin_authenticated_pin') === 'true';
  });
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  const [modoVista, setModoVista] = useState<'admin' | 'publico'>(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const viewParam = params.get('view');

    // 1. REGLA FUNDAMENTAL: Si la URL pide explícitamente modo público o viene con servicio/paso,
    // SIEMPRE mostrar al paciente el portal de turnos (jamás redirigir al panel de administración).
    if (viewParam === 'publico' || params.has('servicio') || params.has('paso')) {
      return 'publico';
    }

    // 2. Solo activar admin si la URL lo solicita explícitamente (/admin o ?view=admin)
    // o si se abrió la app instalada standalone SIN ningún parámetro de búsqueda.
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    const quiereAdmin =
      path.startsWith('/admin') || viewParam === 'admin' || (isStandalone && !viewParam);
    const authed = localStorage.getItem('admin_authenticated_pin') === 'true';
    if (quiereAdmin && authed) {
      return 'admin';
    }
    return 'publico';
  });

  // Si intentó ingresar directamente a /admin sin estar autenticada, abrir modal de PIN
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const viewParam = params.get('view');

    // Si viene explícitamente para el paciente, jamás pedir PIN de administración
    if (viewParam === 'publico' || params.has('servicio') || params.has('paso')) {
      return;
    }

    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    const quiereAdmin =
      path.startsWith('/admin') || viewParam === 'admin' || (isStandalone && !viewParam);
    if (quiereAdmin && !adminAutenticado) {
      setShowPinModal(true);
    }
  }, [adminAutenticado]);

  // Si la URL cambia en tiempo de ejecución a la vista pública, forzar vista pública y cerrar modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'publico' || params.has('servicio') || params.has('paso')) {
      setModoVista('publico');
      setShowPinModal(false);
    }
  }, []);

  const handleSolicitarAccesoAdmin = () => {
    if (adminAutenticado) {
      setModoVista('admin');
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinExitoso = () => {
    localStorage.setItem('admin_authenticated_pin', 'true');
    setAdminAutenticado(true);
    setModoVista('admin');
    setShowPinModal(false);
  };

  const handleCerrarSesionAdmin = () => {
    localStorage.removeItem('admin_authenticated_pin');
    setAdminAutenticado(false);
    setModoVista('publico');
  };

  const handleChangePin = (nuevoPin: string) => {
    localStorage.setItem('saas_admin_pin', nuevoPin);
    setAdminPin(nuevoPin);
  };

  const [activeTab, setActiveTab] = useState<
    'agenda' | 'caja' | 'servicios' | 'equipo' | 'perfil'
  >('agenda');
  const [currentNegocioId, setCurrentNegocioId] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const neg = params.get('negocio');
    return neg ? parseInt(neg, 10) : 2;
  });

  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [usandoFallback, setUsandoFallback] = useState(false);

  const [turnoConfirmado, setTurnoConfirmado] = useState<Turno | null>(null);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const loadFallbackData = useCallback((_id: number) => {
    setNegocio({
      id: 2,
      nombre: 'Consultorio Odontológico Sonrisa Plena',
      slug: 'odontologia-sonrisa-plena',
      rubro: 'ODONTOLOGIA',
      descripcion: 'Atención odontológica integral, estética dental, ortodoncia y prevención.',
      telefonoWhatsapp: '5491166778899',
      direccion: 'Av. Santa Fe 3210, Piso 4 Depto B',
      logoUrl: null,
      cancelacionHorasMinimas: 24,
      activo: true,
    });
    setServicios([
      {
        id: 4,
        nombre: 'Consulta & Diagnóstico General',
        descripcion: 'Evaluación clínica completa, odontograma y presupuesto personalizado sin dolor.',
        duracionMinutos: 30,
        precio: 20000,
        requiereSena: false,
        montoSena: 0,
        activo: true,
        version: 0,
      },
      {
        id: 5,
        nombre: 'Limpieza Dental con Ultrasonido',
        descripcion: 'Eliminación suave de sarro, placa bacteriana y pulido profiláctico profesional.',
        duracionMinutos: 45,
        precio: 35000,
        requiereSena: true,
        montoSena: 10000,
        activo: true,
        version: 0,
      },
      {
        id: 6,
        nombre: 'Restauraciones y Arreglos Estéticos',
        descripcion: 'Resinas de alta definición al tono de tu esmalte para devolver función y estética.',
        duracionMinutos: 45,
        precio: 28000,
        requiereSena: true,
        montoSena: 10000,
        activo: true,
        version: 0,
      },
      {
        id: 7,
        nombre: 'Extracciones Dentales',
        descripcion: 'Cirugía dental simple y extracciones con anestesia local suave y sin trauma.',
        duracionMinutos: 45,
        precio: 30000,
        requiereSena: true,
        montoSena: 10000,
        activo: true,
        version: 0,
      },
      {
        id: 8,
        nombre: 'Endodoncia (Tratamiento de Conducto)',
        descripcion: 'Alivio del dolor agudo y salvataje de la pieza dental con instrumental rotatorio.',
        duracionMinutos: 60,
        precio: 65000,
        requiereSena: true,
        montoSena: 20000,
        activo: true,
        version: 0,
      },
      {
        id: 9,
        nombre: 'Prótesis Dentales & Rehabilitación',
        descripcion: 'Prótesis fijas, removibles y rehabilitación funcional de piezas dentales ausentes.',
        duracionMinutos: 60,
        precio: 80000,
        requiereSena: true,
        montoSena: 25000,
        activo: true,
        version: 0,
      },
      {
        id: 10,
        nombre: 'Blanqueamiento Dental LED',
        descripcion: 'Aclaramiento estético seguro con protección gingival y lámpara LED.',
        duracionMinutos: 60,
        precio: 75000,
        requiereSena: true,
        montoSena: 25000,
        activo: true,
        version: 0,
      },
      {
        id: 11,
        nombre: 'Urgencia Odontológica Inmediata',
        descripcion: 'Atención en el día prioritaria ante dolor agudo, inflamación o fractura.',
        duracionMinutos: 30,
        precio: 25000,
        requiereSena: false,
        montoSena: 0,
        activo: true,
        version: 0,
      },
    ]);
    setProfesionales([
      {
        id: 3,
        nombre: 'Dra. Valentina Gómez',
        especialidad: 'Odontóloga • M.P. 1000',
        avatarUrl: null,
        colorAgenda: '#00685f',
        esDueno: true,
        activo: true,
        servicioIds: [4, 5, 6, 7, 8, 9, 10, 11],
        version: 0,
      },
    ]);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [neg, servs, profs] = await Promise.all([
        adminService.getNegocio(currentNegocioId),
        adminService.getServicios(currentNegocioId),
        adminService.getProfesionales(currentNegocioId),
      ]);
      setNegocio(neg);
      setServicios(servs);
      setProfesionales(profs);
      setUsandoFallback(false);
    } catch {
      loadFallbackData(currentNegocioId);
      setUsandoFallback(true);
    } finally {
      setLoading(false);
    }
  }, [currentNegocioId, loadFallbackData]);

  const handleActivarVistaPrevia = useCallback(() => {
    loadFallbackData(currentNegocioId);
    setUsandoFallback(true);
    setLoading(false);
  }, [currentNegocioId, loadFallbackData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    // Fondo de alto contraste: slate-100 nítido para que las tarjetas blancas resalten con profundidad
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col pb-24 sm:pb-8">
      {/* Banner de Instalación PWA y Alerta Offline (exclusivo para la Doctora en su panel de gestión) */}
      {modoVista === 'admin' && <InstallPwaBanner />}

      {conflictMsg && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <ConflictToast
            message={conflictMsg}
            onRefresh={fetchData}
            onClose={() => setConflictMsg(null)}
          />
        </div>
      )}

      {/* Header Principal con borde y contraste definido */}
      <header className="border-b border-slate-300/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 shrink-0">
              <span className="text-xl">🦷</span>
            </div>
            <div className="truncate">
              <span className="font-extrabold text-slate-950 dark:text-white text-base tracking-tight block leading-tight truncate">
                {negocio ? negocio.nombre : 'Consultorio Odontológico'}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                {modoVista === 'admin' ? 'Panel de Gestión Profesional' : 'Portal de Turnos Online'}
              </span>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2">
            {modoVista === 'admin' ? (
              <>
                <a
                  href={getLandingUrl()}
                  onClick={volverALanding}
                  target="_top"
                  className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 transition-colors border border-slate-300 dark:border-zinc-700 cursor-pointer"
                  title="Volver al inicio del consultorio"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Volver a la web</span>
                </a>

                <button
                  type="button"
                  onClick={() => setModoVista('publico')}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200 transition-colors border border-slate-300 dark:border-zinc-700 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  <span className="hidden sm:inline">Ver Turnero Paciente</span>
                </button>

                <button
                  type="button"
                  onClick={handleCerrarSesionAdmin}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer"
                  title="Bloquear panel de administración con PIN"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bloquear</span>
                </button>
              </>
            ) : (
              <>
                {/* Botón Volver a la Landing Page para Pacientes */}
                <a
                  href={getLandingUrl()}
                  onClick={volverALanding}
                  target="_top"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-900 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors border border-teal-200/80 dark:border-teal-800 shrink-0 cursor-pointer"
                  title="Volver al inicio del consultorio"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a la web</span>
                </a>

                {/* Contacto Directo WhatsApp */}
                {negocio && (
                  <a
                    href={`https://wa.me/${negocio.telefonoWhatsapp}?text=${encodeURIComponent(
                      'Hola, me comunico desde la web para hacer una consulta sobre los turnos.'
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors border border-emerald-200 shrink-0"
                    title="Chatear por WhatsApp"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                )}
              </>
            )}

            <button
              type="button"
              onClick={fetchData}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-800 transition-colors shrink-0 border border-slate-300/60 dark:border-zinc-700"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {loading && !negocio && (
          <div className="max-w-lg mx-auto my-12 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 text-teal-700 dark:text-teal-400 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Conectando con la API demo (Spring Boot + PostgreSQL)
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Si el servidor gratuito estaba en reposo, el primer arranque puede demorar entre 30 y 50 segundos en despertar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleActivarVistaPrevia}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              <span>Abrir vista previa local mientras conecta</span>
            </button>
          </div>
        )}

        {negocio && (
          <>
            {/* VISTA CLIENTE PÚBLICO */}
            {modoVista === 'publico' && (
              <>
                {turnoConfirmado ? (
                  <ConfirmacionTurnoView
                    turno={turnoConfirmado}
                    onVolverInicio={() => setTurnoConfirmado(null)}
                  />
                ) : (
                  <ReservaPublicaView
                    negocio={negocio}
                    servicios={servicios}
                    profesionales={profesionales}
                    onTurnoConfirmado={(t) => setTurnoConfirmado(t)}
                    onConflict={(msg) => setConflictMsg(msg)}
                  />
                )}
              </>
            )}

            {/* VISTA PANEL ADMINISTRADOR */}
            {modoVista === 'admin' && (
              <>
                {/* Tabs de Navegación Desktop con alto contraste */}
                <div className="hidden sm:flex items-center gap-2 mb-6 border-b-2 border-slate-200 dark:border-zinc-800 pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('agenda')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border-2 ${
                      activeTab === 'agenda'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                        : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Agenda de Turnos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('caja')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border-2 ${
                      activeTab === 'caja'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                        : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Control de Caja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('servicios')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border-2 ${
                      activeTab === 'servicios'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                        : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Servicios ({servicios.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('equipo')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border-2 ${
                      activeTab === 'equipo'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                        : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Equipo & Horarios ({profesionales.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('perfil')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border-2 ${
                      activeTab === 'perfil'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                        : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Perfil & WhatsApp</span>
                  </button>
                </div>

                {activeTab === 'agenda' && (
                  <AgendaView
                    negocioId={negocio.id}
                    servicios={servicios}
                    profesionales={profesionales}
                  />
                )}
                {activeTab === 'caja' && (
                  <ControlCajaDashboardView negocioId={negocio.id} />
                )}
                {activeTab === 'servicios' && (
                  <ServiciosView
                    negocioId={negocio.id}
                    servicios={servicios}
                    onRefresh={fetchData}
                  />
                )}
                {activeTab === 'equipo' && (
                  <EquipoView
                    negocioId={negocio.id}
                    profesionales={profesionales}
                    servicios={servicios}
                    onRefresh={fetchData}
                  />
                )}
                {activeTab === 'perfil' && (
                  <NegocioPerfilView
                    negocio={negocio}
                    onRefresh={fetchData}
                    onSelectNegocioId={(id) => setCurrentNegocioId(id)}
                    adminPin={adminPin}
                    onChangePin={handleChangePin}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Navegación Inferior Móvil con Alto Contraste */}
      {modoVista === 'admin' && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t-2 border-slate-300 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl min-h-[44px] min-w-[44px] cursor-pointer ${
              activeTab === 'agenda'
                ? 'text-indigo-700 dark:text-indigo-400 font-black'
                : 'text-slate-800 dark:text-zinc-200 font-bold'
            }`}
          >
            <Calendar className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[11px]">Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('caja')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl min-h-[44px] min-w-[44px] cursor-pointer ${
              activeTab === 'caja'
                ? 'text-indigo-700 dark:text-indigo-400 font-black'
                : 'text-slate-800 dark:text-zinc-200 font-bold'
            }`}
          >
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[11px]">Caja</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('servicios')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl min-h-[44px] min-w-[44px] cursor-pointer ${
              activeTab === 'servicios'
                ? 'text-indigo-700 dark:text-indigo-400 font-black'
                : 'text-slate-800 dark:text-zinc-200 font-bold'
            }`}
          >
            <Layers className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[11px]">Servicios</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equipo')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl min-h-[44px] min-w-[44px] cursor-pointer ${
              activeTab === 'equipo'
                ? 'text-indigo-700 dark:text-indigo-400 font-black'
                : 'text-slate-800 dark:text-zinc-200 font-bold'
            }`}
          >
            <Users className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[11px]">Equipo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl min-h-[44px] min-w-[44px] cursor-pointer ${
              activeTab === 'perfil'
                ? 'text-indigo-700 dark:text-indigo-400 font-black'
                : 'text-slate-800 dark:text-zinc-200 font-bold'
            }`}
          >
            <Settings className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[11px]">Perfil</span>
          </button>
        </nav>
      )}

      {/* Footer Médico / Pacientes con acceso discreto para el equipo */}
      {modoVista === 'publico' && negocio && (
        <footer className="mt-auto py-8 border-t border-slate-300/70 dark:border-zinc-800 text-center text-xs font-semibold text-slate-500 dark:text-zinc-500 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span>{negocio.nombre}</span>
            <span>•</span>
            <span>{negocio.direccion || 'Av. Santa Fe 3210, Piso 4 Depto B'}</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-zinc-600">
            © {new Date().getFullYear()} Consultorio Odontológico Sonrisa Plena (Demo).{' '}
            {usandoFallback ? 'Vista previa local (sin conexión al backend).' : 'Conectado en vivo a Spring Boot + PostgreSQL.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSolicitarAccesoAdmin}
              className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 underline transition-colors cursor-pointer"
            >
              Acceso Exclusivo Profesionales (Demo)
            </button>
          </div>
        </footer>
      )}

      {/* Modal de Desbloqueo por PIN de 4 Dígitos */}
      <PinLockModal
        isOpen={showPinModal}
        pinCorrecto={adminPin}
        onSuccess={handlePinExitoso}
        onClose={() => setShowPinModal(false)}
      />
    </div>
  );
};

export default App;
