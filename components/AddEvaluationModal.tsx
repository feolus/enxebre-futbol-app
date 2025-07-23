import React, { useState, ChangeEvent, FormEvent } from 'react';
import Card from './Card';
import type { Player, PlayerEvaluation } from '../types';

interface AddEvaluationModalProps {
  player: Player;
  onClose: () => void;
  onSave: (evaluation: PlayerEvaluation) => void;
}

const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddEvaluationModal: React.FC<AddEvaluationModalProps> = ({ player, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: toYYYYMMDD(new Date()),
    agility: 18.0,
    speed: 5.0,
    endurance: 4000,
    flexibility: 15,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isMetric = ['agility', 'speed', 'endurance', 'flexibility'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isMetric ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newEvaluation: PlayerEvaluation = {
      playerId: player.id,
      date: formData.date,
      metrics: {
        agility: formData.agility,
        speed: formData.speed,
        endurance: formData.endurance,
        flexibility: formData.flexibility,
      }
    };
    onSave(newEvaluation);
    onClose();
  };
  
  const inputStyle = "w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500";
  const labelStyle = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Registrar Evaluación para <span className="text-cyan-400">{player.name}</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="date" className={labelStyle}>Fecha de la Evaluación</label>
              <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className={inputStyle} required />
            </div>
            <div>
              <label htmlFor="agility" className={labelStyle}>Agilidad (segundos, 0-300)</label>
              <input type="number" step="0.01" id="agility" name="agility" value={formData.agility} onChange={handleChange} className={inputStyle} min="0" max="300" />
            </div>
            <div>
              <label htmlFor="speed" className={labelStyle}>Velocidad (segundos, ej: 4.5)</label>
              <input type="number" step="0.01" id="speed" name="speed" value={formData.speed} onChange={handleChange} className={inputStyle} min="0" />
            </div>
            <div>
              <label htmlFor="endurance" className={labelStyle}>Resistencia (0-5000)</label>
              <input type="number" id="endurance" name="endurance" value={formData.endurance} onChange={handleChange} className={inputStyle} min="0" max="5000" />
            </div>
            <div>
              <label htmlFor="flexibility" className={labelStyle}>Flexibilidad (cm)</label>
              <input type="number" id="flexibility" name="flexibility" value={formData.flexibility} onChange={handleChange} className={inputStyle} min="0" />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors">Guardar</button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddEvaluationModal;