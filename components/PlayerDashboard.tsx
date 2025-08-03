
import React, { useState, useMemo } from 'react';
import type { Player, CalendarEvent, Exercise, PlayerEvaluation } from '../types';
import Card from './Card';
import PerformanceChart from './PerformanceChart';
import { CalendarIcon, TrophyIcon, ClockIcon, MapPinIcon, BarChartSquareIcon, ActivityIcon } from './Icons';
import StatisticsView from './StatisticsView';

interface PlayerDashboardProps {
  player: Player;
  allPlayers: Player[];
  evaluations: PlayerEvaluation[];
  matchEvent?: CalendarEvent;
  calendarEvents: CalendarEvent[];
}

const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface ExerciseDetailProps {
  exercise: Exercise;
  type: string;
}
const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ exercise, type }) => (
    <div className="py-3 sm:py-4">
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    type === 'warmup' ? 'bg-yellow-500/20 text-yellow-300' : 
                    type === 'cooldown' ? 'bg-green-500/20 text-green-300' : 'bg-cyan-500/20 text-cyan-300' 
                }`}>
                    {type.charAt(0).toUpperCase()}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{exercise.name}</p>
                <p className="text-xs text-gray-400 truncate">{exercise.description}</p>
            </div>
            <div className="inline-flex items-center text-base font-semibold text-white">
                {exercise.sets && `${exercise.sets} x ${exercise.reps}`}
                {exercise.duration && `${exercise.duration}`}
            </div>
        </div>
    </div>
);

interface TrainingSessionViewProps {
  event: CalendarEvent;
}
const TrainingSessionView: React.FC<TrainingSessionViewProps> = ({ event }) => {
    const [activeTab, setActiveTab] = useState<'material' | 'warmup' | 'main' | 'cooldown'>('warmup');

    const tabButtonStyle = (isActive: boolean) =>
      `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
        isActive
          ? 'text-cyan-300 border-cyan-400'
          : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'
      }`;
      
    const mainExercises = event.mainExercises || [];
    const warmupExercises = event.warmup || [];
    const cooldownExercises = event.cooldown || [];

    return (
      <div className="bg-gray-800 rounded-lg flex flex-col h-full">
        <div className="p-6">
            <h5 className="text-xl font-bold leading-none text-white mb-4">Próxima Sesión de Entrenamiento</h5>
            <div className="flex items-center justify-between mb-4">
                <p className="text-gray-300">{event.title}</p>
                <div className="flex items-center text-sm font-medium text-cyan-400">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date(event.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>
        </div>
        
        <div className="border-b border-gray-700 px-6">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <button onClick={() => setActiveTab('warmup')} className={tabButtonStyle(activeTab === 'warmup')}>
                    Calentamiento
                </button>
                <button onClick={() => setActiveTab('main')} className={tabButtonStyle(activeTab === 'main')}>
                    Ejercicios Principales
                </button>
                <button onClick={() => setActiveTab('cooldown')} className={tabButtonStyle(activeTab === 'cooldown')}>
                    Estiramientos
                </button>
                 <button onClick={() => setActiveTab('material')} className={tabButtonStyle(activeTab === 'material')}>
                    Material
                </button>
            </nav>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          {activeTab === 'material' && (
            <div className="text-gray-300 space-y-2">
                <h4 className="font-semibold text-white">Material Obligatorio:</h4>
                 <ul className="list-disc list-inside text-sm text-gray-400 pl-4 space-y-1">
                    <li>Botas de fútbol</li>
                    <li>Zapatillas para correr</li>
                    <li>Ropa de entrenamiento adecuada</li>
                    <li>Botella de agua personal</li>
                </ul>
            </div>
          )}
          {activeTab === 'warmup' && (
            <div className="flow-root">
                <ul role="list" className="divide-y divide-gray-700 -my-3">
                    {warmupExercises.map((ex: Exercise) => <ExerciseDetail key={ex.id} exercise={ex} type="warmup" />)}
                </ul>
                {warmupExercises.length === 0 && (
                    <p className="text-center text-sm text-gray-500 pt-8">No hay ejercicios de calentamiento asignados para esta sesión.</p>
                )}
            </div>
          )}
          {activeTab === 'main' && (
             <div className="flow-root">
                <ul role="list" className="divide-y divide-gray-700 -my-3">
                    {mainExercises.map((ex: Exercise) => <ExerciseDetail key={ex.id} exercise={ex} type="main" />)}
                </ul>
                {mainExercises.length === 0 && (
                    <p className="text-center text-sm text-gray-500 pt-8">No hay ejercicios principales asignados para esta sesión.</p>
                )}
            </div>
          )}
          {activeTab === 'cooldown' && (
            <div className="flow-root">
                <ul role="list" className="divide-y divide-gray-700 -my-3">
                    {cooldownExercises.map((ex: Exercise) => <ExerciseDetail key={ex.id} exercise={ex} type="cooldown" />)}
                </ul>
                {cooldownExercises.length === 0 && (
                    <p className="text-center text-sm text-gray-500 pt-8">No hay ejercicios de enfriamiento asignados para esta sesión.</p>
                )}
            </div>
          )}
        </div>
      </div>
    );
}

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ player, allPlayers, evaluations, matchEvent, calendarEvents }) => {
  const [activeTab, setActiveTab] = useState<'session' | 'performance' | 'match' | 'statistics'>('session');
  
  const nextTrainingEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return calendarEvents
      .filter(e =>
        e.type === 'training' &&
        new Date(e.date + 'T00:00:00') >= today &&
        e.playerIds?.includes(player.id)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    [0];
  }, [calendarEvents, player.id]);

  const { attendanceCount, totalActivities, attendancePercentage } = useMemo(() => {
    const activityDates = new Set(
      calendarEvents.filter(e => ['training', 'match', 'matchResult'].includes(e.type)).map(e => e.date)
    );
    const totalActs = activityDates.size;
    
    let absenceCount = 0;
    calendarEvents.forEach((event: CalendarEvent) => {
      if (event.type === 'injury' && event.playerId === player.id) {
        const startDate = new Date(event.date + 'T00:00:00');
        const endDate = event.endDate ? new Date(event.endDate + 'T00:00:00') : startDate;
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateString = toYYYYMMDD(d);
          if (activityDates.has(dateString)) {
            absenceCount++;
          }
        }
      } else if (event.type === 'personal' && event.playerIds?.includes(player.id)) {
        if (activityDates.has(event.date)) {
          absenceCount++;
        }
      }
    });

    const attendance = totalActs > 0 ? totalActs - absenceCount : 0;
    const percentage = totalActs > 0 ? (attendance / totalActs) * 100 : 100;

    return { 
        attendanceCount: attendance, 
        totalActivities: totalActs,
        attendancePercentage: percentage
    };
  }, [player.id, calendarEvents]);


  if (!player) return null;

  const isCalledUp = matchEvent ? matchEvent.squad?.calledUp.includes(player.id) : false;
  const calledUpPlayers = matchEvent ? allPlayers.filter(p => matchEvent.squad?.calledUp.includes(p.id)) : [];
  const matchDate = matchEvent ? new Date(matchEvent.date + 'T00:00:00') : null;

  const tabButtonStyle = (isActive: boolean) =>
    `flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors w-full justify-center sm:w-auto sm:justify-start ${
      isActive
        ? 'bg-gray-700/50 text-white'
        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
    }`;
    
  const renderTabContent = () => {
    switch (activeTab) {
      case 'session':
        return nextTrainingEvent ? (
          <TrainingSessionView event={nextTrainingEvent} />
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400 h-full flex items-center justify-center min-h-[400px]">
            No hay próximas sesiones de entrenamiento.
          </div>
        );
      case 'performance':
        return <PerformanceChart evaluations={evaluations} title="Mi Tendencia de Rendimiento" />;
      case 'match':
        return matchEvent && matchDate ? (
            <div className="bg-gray-800 rounded-lg overflow-hidden h-full">
              <div className="p-6">
                <h5 className="text-xl font-bold text-white mb-4">Próximo Partido</h5>
                <div className={`p-4 rounded-lg ${isCalledUp ? 'bg-green-500/10 border-green-500/50' : 'bg-yellow-500/10 border-yellow-500/50'} border`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${isCalledUp ? 'text-green-300' : 'text-yellow-300'}`}>{isCalledUp ? 'CONVOCADO' : 'NO CONVOCADO'}</p>
                      <p className="text-white text-lg font-semibold">vs {matchEvent.opponent}</p>
                    </div>
                    <TrophyIcon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {matchDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-700 p-6 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">{matchEvent.time} H (Partido)</p>
                    <p className="text-gray-400">{matchEvent.meetingTime} H (Convocatoria)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">{matchEvent.venue} (Partido)</p>
                    <p className="text-gray-400">{matchEvent.meetingPoint} (Convocatoria)</p>
                  </div>
                </div>
              </div>
              {isCalledUp && (
                <div className="border-t border-gray-700 p-6">
                  <h6 className="font-semibold text-white mb-2">Compañeros Convocados</h6>
                  <div className="flex flex-wrap gap-2">
                    {calledUpPlayers.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-gray-700/50 px-2 py-1 rounded-full text-xs">
                        <img src={p.photoUrl} alt={p.name} className="w-5 h-5 rounded-full" />
                        <span className="text-gray-300">{p.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400 h-full flex items-center justify-center min-h-[400px]">
            No hay próximo partido programado.
          </div>
        );
        case 'statistics':
            return <StatisticsView events={calendarEvents} players={allPlayers} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <img className="w-24 h-24 rounded-full border-4 border-gray-700" src={player.photoUrl} alt={player.name} />
                <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white">{player.name} <span className="text-lg font-normal text-cyan-300">"{player.nickname}"</span></h2>
                    <p className="text-gray-400">{player.position} - #{player.jerseyNumber}</p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400 block">Edad</span>
                            <span className="font-semibold text-white">{player.personalInfo.age}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Altura</span>
                            <span className="font-semibold text-white">{player.personalInfo.height}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Peso</span>
                            <span className="font-semibold text-white">{player.personalInfo.weight}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Asistencia</span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{attendanceCount}/{totalActivities}</span>
                                <div className="w-16 bg-gray-700 rounded-full h-2" title={`${attendancePercentage.toFixed(0)}% de asistencia`}>
                                    <div className="bg-cyan-400 h-2 rounded-full" style={{ width: `${attendancePercentage}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        <Card>
          <div className="p-2 sm:p-4 border-b border-gray-700">
             <nav className="flex flex-col sm:flex-row sm:space-x-2">
                <button onClick={() => setActiveTab('session')} className={tabButtonStyle(activeTab === 'session')}>
                  <ActivityIcon className="w-5 h-5" />
                  <span>Próxima Sesión</span>
                </button>
                <button onClick={() => setActiveTab('performance')} className={tabButtonStyle(activeTab === 'performance')}>
                   <BarChartSquareIcon className="w-5 h-5" />
                   <span>Mi Rendimiento</span>
                </button>
                <button onClick={() => setActiveTab('match')} className={tabButtonStyle(activeTab === 'match')}>
                  <TrophyIcon className="w-5 h-5" />
                  <span>Próximo Partido</span>
                </button>
                 <button onClick={() => setActiveTab('statistics')} className={tabButtonStyle(activeTab === 'statistics')}>
                  <BarChartSquareIcon className="w-5 h-5" />
                  <span>Estadísticas</span>
                </button>
             </nav>
          </div>
          <div className="p-2 md:p-4">
            {renderTabContent()}
          </div>
        </Card>
    </div>
  );
};

export default PlayerDashboard;
