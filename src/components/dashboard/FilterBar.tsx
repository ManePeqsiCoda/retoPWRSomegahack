'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useFilterStore } from '@/store/filterStore';
import { TicketEstado, TipoSolicitud, NivelUrgencia } from '@/types';

export default function FilterBar() {
  const {
    estadoFilter,
    tipoFilter,
    urgenciaFilter,
    searchQuery,
    setEstadoFilter,
    setTipoFilter,
    setUrgenciaFilter,
    setSearchQuery,
    resetFilters,
  } = useFilterStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sincronizar localSearch cuando el store cambie (ej. al resetear)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Manejo de Debounce para la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, setSearchQuery]);

  const isAnyFilterActive = 
    estadoFilter !== 'Todos' || 
    tipoFilter !== 'Todos' || 
    urgenciaFilter !== 'Todos' || 
    searchQuery !== '';

  const selectClass = "text-sm border border-gov-gray-300 dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface focus:outline-none focus:ring-2 focus:ring-gov-blue-500 dark:focus:ring-dark-cyan text-gov-gray-900 dark:text-dark-text";

  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-white dark:bg-dark-surface rounded-xl border border-gov-gray-100 dark:border-dark-border shadow-sm mb-4">
      
      {/* 1. BUSCADOR */}
      <div className="flex-1 min-w-[280px] relative">
        <label htmlFor="search-input" className="sr-only">
          Buscar ciudadano o contenido
        </label>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gov-gray-500">
          <Search size={18} />
        </div>
        <input
          id="search-input"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Buscar por ciudadano o contenido..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gov-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gov-blue-500 dark:focus:ring-dark-cyan focus:border-transparent bg-white dark:bg-dark-surface text-gov-gray-900 dark:text-dark-text"
        />
      </div>

      {/* 2. SELECT ESTADO */}
      <div className="flex items-center gap-2">
        <label htmlFor="estado-select" className="text-xs font-semibold text-gov-gray-500 dark:text-dark-muted uppercase tracking-wider">
          Estado
        </label>
        <select
          id="estado-select"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value as TicketEstado | 'Todos')}
          className={selectClass}
        >
          <option value="Todos">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En_Revision">En Revisión</option>
          <option value="Resuelto">Resuelto</option>
        </select>
      </div>

      {/* 3. SELECT TIPO */}
      <div className="flex items-center gap-2">
        <label htmlFor="tipo-select" className="text-xs font-semibold text-gov-gray-500 dark:text-dark-muted uppercase tracking-wider">
          Tipo
        </label>
        <select
          id="tipo-select"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as TipoSolicitud | 'Todos')}
          className={selectClass}
        >
          <option value="Todos">Todos</option>
          <option value="Peticion">Petición</option>
          <option value="Queja">Queja</option>
          <option value="Reclamo">Reclamo</option>
          <option value="Sugerencia">Sugerencia</option>
          <option value="Denuncia">Denuncia</option>
        </select>
      </div>

      {/* 4. SELECT URGENCIA */}
      <div className="flex items-center gap-2">
        <label htmlFor="urgencia-select" className="text-xs font-semibold text-gov-gray-500 dark:text-dark-muted uppercase tracking-wider">
          Urgencia
        </label>
        <select
          id="urgencia-select"
          value={urgenciaFilter}
          onChange={(e) => setUrgenciaFilter(e.target.value as NivelUrgencia | 'Todos')}
          className={selectClass}
        >
          <option value="Todos">Todas</option>
          <option value="critico">🔴 Crítico</option>
          <option value="atencion">🟡 Atención</option>
          <option value="seguro">🟢 Seguro</option>
        </select>
      </div>

      {/* 5. BOTÓN RESET */}
      {isAnyFilterActive && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gov-gray-500 dark:text-dark-muted hover:text-gov-blue-700 dark:hover:text-dark-cyan hover:bg-gov-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors border border-transparent hover:border-gov-gray-200 dark:hover:border-dark-border"
          aria-label="Limpiar todos los filtros"
        >
          <X size={14} />
          <span>Limpiar</span>
        </button>
      )}
    </div>
  );
}
