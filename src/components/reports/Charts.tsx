'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

/**
 * 1. Gráfica de Barras: Tendencia Semanal
 */
export function GraficaBarras({ data }: { data: { semana: string; ingresados: number; resueltos: number; vencidos: number }[] }) {
  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="semana" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '10px' }}
          />
          <Bar dataKey="ingresados" name="Ingresados" fill="#003DA5" radius={[4, 4, 0, 0]} />
          <Bar dataKey="resueltos" name="Resueltos" fill="#00875A" radius={[4, 4, 0, 0]} />
          <Bar dataKey="vencidos" name="Vencidos" fill="#DC2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * 2. Gráfica de Donut: Distribución por Tipo
 */
export function GraficaDonut({ data }: { data: { tipo: string; cantidad: number; porcentaje: number; color: string }[] }) {
  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={5}
            dataKey="cantidad"
            nameKey="tipo"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip isPie />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * 3. Gráfica de Barras Horizontales: Canales de Entrada
 */
export function GraficaCanales({ data }: { data: { canal: string; cantidad: number; porcentaje: number }[] }) {
  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="canal" 
            type="category" 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 800, fill: '#374151' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Bar 
            dataKey="cantidad" 
            name="Tickets" 
            fill="#003DA5" 
            radius={[0, 4, 4, 0]} 
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Componentes Auxiliares
 */
interface PayloadItem {
  color?: string;
  name?: string;
  value?: number | string;
  payload?: Record<string, string | number>;
  [key: string]: unknown;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
  isPie?: boolean;
}

const CustomTooltip = ({ active, payload, label, isPie }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-surface p-3 border border-gov-gray-100 dark:border-dark-border shadow-xl rounded-xl">
        {!isPie && <p className="text-[10px] font-black text-gov-gray-400 dark:text-dark-muted uppercase tracking-widest mb-2 border-b border-gov-gray-50 dark:border-dark-border pb-1">{label}</p>}
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 py-0.5">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: p.color || (p.payload?.color as string) }} 
            />
            <span className="text-xs font-bold text-gov-gray-700 dark:text-dark-text">
              {p.name || p.payload?.tipo || p.payload?.canal}:
            </span>
            <span className="text-xs font-black text-gov-blue-700 dark:text-dark-cyan">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
