'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  disabled?: boolean;
}

const NavItem = ({ icon: Icon, label, href, active, disabled }: NavItemProps) => {
  if (disabled) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5 text-gov-gray-300 opacity-40 cursor-not-allowed"
        aria-label={label}
      >
        <Icon size={20} />
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-gov-blue-700 text-white rounded-lg"
          : "text-gov-gray-300 hover:bg-gov-blue-700/40 hover:text-white rounded-lg"
      )}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { usuario } = useAuthStore();

  return (
    <nav
      className="flex flex-col h-screen w-64 bg-gov-blue-900 border-r border-gov-blue-700 shrink-0 dark:bg-dark-sidebar dark:border-dark-border"
      aria-label="Navegación principal"
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg">
            {/* TODO: Reemplazar con escudo SVG oficial de la Alcaldía de Medellín */}
            <span className="text-xl" role="img" aria-label="Escudo Medellín">🏛️</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">
              Alcaldía de Medellín
            </h1>
            <p className="text-gov-cyan-400 text-xs font-medium uppercase tracking-wider">
              CRM PQRSD
            </p>
          </div>
        </div>
        <div className="border-b border-gov-blue-700 dark:border-dark-border" />
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 space-y-1">
        <NavItem
          icon={LayoutDashboard}
          label="Bandeja de Entrada"
          href="/dashboard"
          active={pathname === '/dashboard'}
        />
        <NavItem
          icon={BarChart3}
          label="Reportes"
          href="/reports"
          active={pathname === '/reports'}
        />
        <NavItem
          icon={Settings}
          label="Configuración"
          href="/settings"
          active={pathname === '/settings'}
        />
      </div>

      {/* Footer */}
      <div className="p-6 mt-auto space-y-4">
        <div className="px-3 py-1.5 bg-gov-blue-700/50 rounded-full inline-block dark:bg-dark-accent/20">
          <span className="text-gov-cyan-400 text-xs font-semibold dark:text-dark-cyan">
            {usuario?.secretariaNombre || 'Secretaría de Salud'}
          </span>
        </div>
        <div className="text-gov-gray-500 text-xs font-medium dark:text-dark-muted">
          v1.0 · OmegaHack 2026
        </div>
      </div>
    </nav>
  );
}
