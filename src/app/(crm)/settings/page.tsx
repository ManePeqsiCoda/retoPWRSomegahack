'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/settings/ThemeToggle';
import SettingsSection from '@/components/settings/SettingsSection';
import { 
  User, 
  Palette, 
  Bell, 
  Shield, 
  LogOut,
  Hash,
  Info,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { obtenerIniciales } from '@/lib/utils';

export default function SettingsPage() {
  const { usuario, logout } = useAuthStore();
  const router = useRouter();

  // Estado para las notificaciones
  const [notifConfig, setNotifConfig] = useState({
    criticos: true,
    vencimiento: true,
    sonido: false
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. CABECERA */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-gov-gray-900 dark:text-dark-text tracking-tighter">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-gov-gray-500 dark:text-dark-muted">
          Personaliza tu entorno de gestión de PQRSDs · Medellín GovTech
        </p>
      </div>

      {/* 2. SECCIÓN: PERFIL */}
      <SettingsSection 
        titulo="Perfil del Funcionario" 
        descripcion="Datos de identificación y secretaría asignada"
        icono={<User size={22} />}
      >
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-gov-gray-50 dark:border-dark-border">
          <div className="relative group">
            <div className="w-24 h-24 bg-gov-blue-700 dark:bg-dark-accent rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-gov-blue-900/20 transition-transform group-hover:rotate-3 duration-500">
              {obtenerIniciales(usuario?.nombreCompleto || '')}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-sem-green text-white p-2 rounded-xl border-4 border-white dark:border-dark-surface">
               <Check size={16} strokeWidth={3} />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-xl font-black text-gov-gray-900 dark:text-dark-text tracking-tight">
              {usuario?.nombreCompleto}
            </h3>
            <p className="text-sm font-bold text-gov-blue-700 dark:text-dark-cyan uppercase tracking-widest">
              {usuario?.rol === 'admin' ? 'Administrador de Sede' : 'Funcionario Operativo'}
            </p>
            <div className="flex items-center gap-2 justify-center md:justify-start text-xs text-gov-gray-500 dark:text-dark-muted mt-2">
               <span className="w-2 h-2 rounded-full bg-sem-green" />
               Cuenta de funcionario activa
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReadOnlyField label="Cargo" value="Gestor de Trámites y PQRSD" />
          <ReadOnlyField label="Secretaría Asignada" value={usuario?.secretariaNombre || 'Secretaría de Salud'} />
          <ReadOnlyField 
            label="ID de Usuario" 
            value={usuario?.idUsuario || 'USR-0982-MED'} 
            icon={<Hash size={12} />} 
          />
          <ReadOnlyField 
            label="Correo Institucional" 
            value={`${usuario?.idUsuario?.toLowerCase() || 'funcionario'}@medellin.gov.co`} 
          />
        </div>

        <div className="mt-8 flex items-start gap-3 p-4 bg-gov-gray-50 dark:bg-dark-bg rounded-2xl border border-gov-gray-100 dark:border-dark-border">
          <Info size={16} className="text-gov-gray-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gov-gray-500 dark:text-dark-muted leading-relaxed">
            Los datos del perfil son gestionados centralmente por la <strong>Secretaría de Gestión Humana</strong>. 
            Para solicitar cambios en su cargo o asignación de secretaría, por favor levante un ticket de soporte en la mesa de ayuda interna.
          </p>
        </div>
      </SettingsSection>

      {/* 3. SECCIÓN: APARIENCIA */}
      <SettingsSection 
        titulo="Apariencia y Visualización" 
        descripcion="Adapta la interfaz a tu entorno de trabajo actual"
        icono={<Palette size={22} />}
      >
        <div className="space-y-4">
           <p className="text-xs font-bold text-gov-gray-700 dark:text-dark-text uppercase tracking-widest">Tema de la interfaz</p>
           <ThemeToggle variant="card" />
           <p className="text-[11px] text-gov-gray-400 mt-4 italic">
             Consejo: El Modo Oscuro reduce la fatiga visual si trabajas en horarios nocturnos.
           </p>
        </div>
      </SettingsSection>

      {/* 4. SECCIÓN: NOTIFICACIONES */}
      <SettingsSection 
        titulo="Notificaciones y Alertas" 
        descripcion="Gestiona cómo recibes los avisos de urgencia legal"
        icono={<Bell size={22} />}
      >
        <div className="divide-y divide-gov-gray-50 dark:divide-dark-border">
           <ToggleRow 
             label="Alertas de tickets críticos" 
             desc="Mostrar banner rojo cuando hay tickets con menos de 3 días restantes" 
             active={notifConfig.criticos}
             onClick={() => setNotifConfig(prev => ({ ...prev, criticos: !prev.criticos }))}
           />
           <ToggleRow 
             label="Notificaciones de vencimiento" 
             desc="Mostrar campana con contador de tickets a punto de vencer en la barra superior" 
             active={notifConfig.vencimiento}
              onClick={() => setNotifConfig(prev => ({ ...prev, vencimiento: !prev.vencimiento }))}
           />
           <ToggleRow 
             label="Sonido de alerta" 
             desc="Reproducir pitido institucional al recibir un ticket clasificado como prioritario" 
             active={notifConfig.sonido}
             disabled
             onClick={() => {}}
           />
        </div>
      </SettingsSection>

      {/* 5. SECCIÓN: SEGURIDAD */}
      <SettingsSection 
        titulo="Seguridad y Acceso" 
        descripcion="Información técnica sobre tu sesión y permisos"
        icono={<Shield size={22} />}
      >
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SecurityBadge label="Nivel de Acceso" value="Funcionario" />
            <SecurityBadge label="Región de Acceso" value="Medellín / Ts.net" />
            <SecurityBadge label="Protocolo RBAC" value="V3.2 Activo" />
         </div>
         <p className="mt-4 text-[10px] text-gov-gray-400 text-center">
           Tu sesión está cifrada mediante una red privada de Tailscale para protección de datos ciudadanos.
         </p>
      </SettingsSection>

      {/* 6. CIERRE DE SESIÓN */}
      <div className="flex justify-center pt-8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-10 py-4 bg-sem-red/5 dark:bg-sem-red/10 border-2 border-sem-red/20 rounded-2xl text-sem-red font-black text-sm uppercase tracking-widest hover:bg-sem-red hover:text-white transition-all duration-300 shadow-lg shadow-sem-red/10"
        >
          <LogOut size={20} />
          Finalizar Sesión Operativa
        </button>
      </div>
    </div>
  );
}

/** Componentes Atómicos para la página */

function ReadOnlyField({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black text-gov-gray-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2 px-4 py-3 bg-gov-gray-50/50 dark:bg-dark-bg border border-gov-gray-100 dark:border-dark-border rounded-xl">
        {icon && <span className="text-gov-gray-400">{icon}</span>}
        <span className="text-sm font-bold text-gov-gray-700 dark:text-dark-text">{value}</span>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, active, onClick, disabled }: { label: string, desc: string, active: boolean, onClick: () => void, disabled?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between py-4 group transition-opacity",
      disabled && "opacity-50"
    )}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-gov-gray-900 dark:text-dark-text">{label}</p>
          {disabled && (
            <span className="px-1.5 py-0.5 bg-gov-gray-100 dark:bg-dark-border text-[8px] font-black text-gov-gray-500 rounded uppercase">Próximamente</span>
          )}
        </div>
        <p className="text-xs text-gov-gray-500 dark:text-dark-muted max-w-sm">{desc}</p>
      </div>
      
      <button 
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-12 h-6 rounded-full transition-colors relative",
          active ? "bg-gov-blue-700" : "bg-gov-gray-200 dark:bg-dark-border",
          disabled && "cursor-not-allowed"
        )}
      >
        <div className={cn(
          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-md",
          active ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

function SecurityBadge({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-gov-gray-50 dark:bg-dark-bg border border-gov-gray-100 dark:border-dark-border rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
      <p className="text-[9px] font-black text-gov-gray-400 uppercase tracking-tighter">{label}</p>
      <p className="text-xs font-bold text-gov-blue-700 dark:text-dark-cyan">{value}</p>
    </div>
  );
}
