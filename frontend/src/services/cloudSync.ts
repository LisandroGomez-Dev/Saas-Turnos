import { Turno } from '../types';

// Sincronización en la nube deshabilitada en la versión pública de demostración
// para mantener el almacenamiento aislado localmente en cada navegador.
export const cloudSync = {
  syncToCloud: async (_negocioId: number, _turnos: Turno[]): Promise<void> => {
    return;
  },

  fetchFromCloud: async (_negocioId: number): Promise<Turno[] | null> => {
    return null;
  },
};
