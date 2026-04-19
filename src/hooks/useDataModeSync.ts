'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { setServiceDataMode } from '@/services/ticketService';

/**
 * Hook que sincroniza el DataMode del auth store con el servicio de tickets.
 * Debe invocarse en el layout raíz del CRM.
 */
export function useDataModeSync() {
  const dataMode = useAuthStore(s => s.dataMode);

  useEffect(() => {
    setServiceDataMode(dataMode);
    console.log(`[DataMode] Modo activo: ${dataMode === 'live' ? '🟢 MotherDuck (Live)' : '🟡 Mock Data'}`);
  }, [dataMode]);
}
