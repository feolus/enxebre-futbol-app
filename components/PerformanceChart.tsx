import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PlayerEvaluation } from '../types';

interface PerformanceChartProps {
  evaluations: PlayerEvaluation[];
  title: string;
}

// Define a local interface for custom tooltip props to avoid type conflicts with recharts library versions.
interface CustomTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    dataKey: string;
    payload: { [key: string]: any };
    value: number | string;
    name: string;
  }>;
  label?: string;
}


const PerformanceChart: React.FC<PerformanceChartProps> = ({ evaluations, title }) => {
  const maxMetrics = {
    agility: { min: 15, max: 25 },
    speed: { min: 4, max: 6 },
    endurance: 5000,
    flexibility: 40,
  };

  const data = evaluations.map(e => {
    const agilityScore = ((maxMetrics.agility.max - e.metrics.agility) / (maxMetrics.agility.max - maxMetrics.agility.min)) * 100;
    const speedScore = ((maxMetrics.speed.max - e.metrics.speed) / (maxMetrics.speed.max - maxMetrics.speed.min)) * 100;
    return {
      date: new Date(e.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      Agilidad: Math.max(0, Math.min(100, agilityScore)),
      Velocidad: Math.max(0, Math.min(100, speedScore)),
      Resistencia: (e.metrics.endurance / maxMetrics.endurance) * 100,
      Flexibilidad: (e.metrics.flexibility / maxMetrics.flexibility) * 100,
      original_Agilidad: e.metrics.agility,
      original_Velocidad: e.metrics.speed,
      original_Resistencia: e.metrics.endurance,
      original_Flexibilidad: e.metrics.flexibility,
    };
  });

  const CustomTooltip: React.FC<CustomTooltipContentProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-gray-900/90 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm">
          <p className="label text-gray-300 font-bold mb-2">{`${label}`}</p>
          {payload.map((pld) => (
            <div key={pld.dataKey} style={{ color: pld.color }} className="flex justify-between items-center text-sm">
              <span>{`${pld.dataKey}:`}</span>
              <span className="font-bold ml-4">
                {pld.payload[`original_${pld.dataKey}`]}
                {(pld.dataKey === 'Velocidad' || pld.dataKey === 'Agilidad') ? 's' : ''}
                {pld.dataKey === 'Flexibilidad' ? 'cm' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 md:p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="date" stroke="#A0AEC0" fontSize={12} />
            <YAxis stroke="#A0AEC0" fontSize={12} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}} />
            <Line type="monotone" dataKey="Agilidad" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Velocidad" stroke="#f472b6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Resistencia" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Flexibilidad" stroke="#facc15" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
