import React, { useState, useMemo, useEffect, ChangeEvent, FormEvent } from 'react';
import type { Player, PlayerEvaluation, CalendarEvent, CalendarEventType, EvaluationMetric, Exercise } from '../types';
import Card from './Card';
import PerformanceChart from './PerformanceChart';
import PlayerRegistrationForm from './PlayerRegistrationForm';
import AddEvaluationModal from './AddEvaluationModal';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { UsersIcon, CalendarIcon, ChartIcon, TrophyIcon, MapPinIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, ActivityIcon, ShieldIcon, HeartPulseIcon, UserMinusIcon, SoccerBallIcon, BarChartSquareIcon, EditIcon, TrashIcon, ClipboardPlusIcon, ShieldCheckIcon, KeyIcon } from './Icons';
import StatisticsView from './StatisticsView';
import UserManagementView from './UserManagementView';

type Tab = 'club' | 'planner' | 'comparison' | 'matchday' | 'statistics' | 'userManagement';
type View = 'list' | 'profile' | 'edit';

const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface CoachDashboardProps {
  players: Player[];
  evaluations: PlayerEvaluation[];
  calendarEvents: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdatePlayer: (player: Player, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null) => void;
  onDeletePlayer: (playerId: string) => void;
  onAddEvaluation: (evaluation: PlayerEvaluation) => void;
  onUpdatePlayerPassword: (playerId: string, newPassword: string) => void;
}

const CoachDashboard: React.FC<CoachDashboardProps> = (props) => {
  const [activeTab, setActiveTab] = useState<Tab>('club');
  const [view, setView] = useState<View>('list');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);

  const upcomingMatch = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return props.calendarEvents
        .filter(e => e.type === 'match' && new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    [0];
  }, [props.calendarEvents]);


  const handleSetMatchSquad = (eventId: string, updatedSquad: { calledUp: string[], notCalledUp: string[] }) => {
    const eventToUpdate = props.calendarEvents.find(event => event.id === eventId);
    if (eventToUpdate) {
      props.onUpdateEvent({ ...eventToUpdate, squad: updatedSquad });
    }
  };


  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setView('profile');
  };

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setView('edit');
  };
  
  const handleDeleteClick = (playerId: string) => {
      if(window.confirm('¿Estás seguro de que quieres eliminar a este jugador? Esta acción no se puede deshacer.')) {
          props.onDeletePlayer(playerId);
          setView('list');
      }
  }

  const handleCloseSubView = () => {
    setSelectedPlayer(null);
    setView('list');
  };
  
  const handleMarkAsActive = (playerToActivate: Player) => {
    const updatedPlayer = { ...playerToActivate, medicalInfo: { ...playerToActivate.medicalInfo, status: 'Activo' as const }};
    props.onUpdatePlayer(updatedPlayer, null, null, null);

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayString = toYYYYMMDD(today);

    const activeInjury = props.calendarEvents.find(event =>
        event.type === 'injury' &&
        event.playerId === playerToActivate.id &&
        new Date(event.date + 'T00:00:00') <= today &&
        (!event.endDate || new Date(event.endDate + 'T00:00:00') >= today)
    );
    
    if (activeInjury) {
        props.onUpdateEvent({ ...activeInjury, endDate: todayString });
    }
    
    setSelectedPlayer(updatedPlayer);
  };


  const handleSavePlayerUpdate = (updatedPlayerData: Omit<Player, 'id' | 'photoUrl' | 'documents'>, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null) => {
      if (!selectedPlayer) return;
      const fullPlayer: Player = {
        ...selectedPlayer,
        ...updatedPlayerData,
        name: `${updatedPlayerData.name} ${updatedPlayerData.lastName}`,
    };
    props.onUpdatePlayer(fullPlayer, idPhotoFile, dniFrontFile, dniBackFile);
    handleCloseSubView();
  };
  
  const handleOpenEvalModal = () => {
      if (selectedPlayer) {
          setIsEvalModalOpen(true);
      }
  };

  const handleSaveEvaluation = (evaluation: PlayerEvaluation) => {
      props.onAddEvaluation(evaluation);
      setIsEvalModalOpen(false);
  };

  const renderContent = () => {
    if (activeTab === 'club') {
        switch (view) {
            case 'profile':
                return (
                    <>
                        <PlayerProfile 
                          player={selectedPlayer!} 
                          evaluations={props.evaluations.filter(e => e.playerId === selectedPlayer!.id)} 
                          onClose={handleCloseSubView} 
                          onOpenEvalModal={handleOpenEvalModal}
                          onMarkAsActive={handleMarkAsActive}
                        />
                        {isEvalModalOpen && selectedPlayer && (
                           <AddEvaluationModal 
                                player={selectedPlayer}
                                onClose={() => setIsEvalModalOpen(false)}
                                onSave={handleSaveEvaluation}
                            />
                        )}
                    </>
                );
            case 'edit':
                return <PlayerRegistrationForm playerToEdit={selectedPlayer!} onSave={handleSavePlayerUpdate} onClose={handleCloseSubView} />;
            case 'list':
            default:
                return <ClubView players={props.players} calendarEvents={props.calendarEvents} onSelectPlayer={handleSelectPlayer} onEditPlayer={handleEditPlayer} onDeletePlayer={handleDeleteClick}/>;
        }
    }

    switch (activeTab) {
      case 'planner':
        return <TrainingPlanner
                  events={props.calendarEvents}
                  players={props.players}
                  onAddEvent={props.onAddEvent}
                  onUpdateEvent={props.onUpdateEvent}
                  onDeleteEvent={props.onDeleteEvent}
                />;
      case 'comparison':
        return <ComparisonView players={props.players} evaluations={props.evaluations} />;
      case 'matchday':
        return <MatchDayView 
                  players={props.players} 
                  match={upcomingMatch} 
                  setSquad={handleSetMatchSquad}
                  calendarEvents={props.calendarEvents}
                />;
      case 'statistics':
        return <StatisticsView events={props.calendarEvents} players={props.players} />;
      case 'userManagement':
        return <UserManagementView players={props.players} onUpdatePassword={props.onUpdatePlayerPassword} />;
      default:
        return <ClubView players={props.players} calendarEvents={props.calendarEvents} onSelectPlayer={handleSelectPlayer} onEditPlayer={handleEditPlayer} onDeletePlayer={handleDeleteClick}/>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: Tab; name: string; icon: React.ElementType }[] = [
    { id: 'club', name: 'Equipo', icon: UsersIcon },
    { id: 'planner', name: 'Planificador', icon: CalendarIcon },
    { id: 'comparison', name: 'Comparativa', icon: ChartIcon },
    { id: 'statistics', name: 'Estadísticas', icon: BarChartSquareIcon },
    { id: 'matchday', name: 'Día de Partido', icon: TrophyIcon },
    { id: 'userManagement', name: 'Información de Usuarios', icon: KeyIcon },
  ];

  return (
    <aside className="w-full md:w-64">
      <nav className="flex md:flex-col gap-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
              activeTab === item.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon className="w-6 h-6 mr-3" />
            <span className="text-sm font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

interface ClubViewProps {
    players: Player[];
    calendarEvents: CalendarEvent[];
    onSelectPlayer: (player: Player) => void;
    onEditPlayer: (player: Player) => void;
    onDeletePlayer: (playerId: string) => void;
}

const ClubView: React.FC<ClubViewProps> = ({ players, calendarEvents, onSelectPlayer, onEditPlayer, onDeletePlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const playerStats = useMemo(() => {
    const stats: Record<string, { calledUp: number; notCalledUp: number; attendance: number; totalActivities: number }> = {};
    
    const activityDates = new Set(
        calendarEvents.filter(e => ['training', 'match', 'matchResult'].includes(e.type)).map(e => e.date)
    );
    const totalActivities = activityDates.size;

    players.forEach((p: Player) => {
        let absenceCount = 0;
        
        calendarEvents.forEach((event: CalendarEvent) => {
            if (event.type === 'injury' && event.playerId === p.id) {
                const startDate = new Date(event.date + 'T00:00:00');
                const endDate = event.endDate ? new Date(event.endDate + 'T00:00:00') : startDate;
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateString = toYYYYMMDD(d);
                    if (activityDates.has(dateString)) {
                        absenceCount++;
                    }
                }
            } else if (event.type === 'personal' && event.playerIds?.includes(p.id)) {
                 if (activityDates.has(event.date)) {
                    absenceCount++;
                }
            }
        });
      
      const attendanceCount = totalActivities > 0 ? totalActivities - absenceCount : 0;
      stats[p.id] = { calledUp: 0, notCalledUp: 0, attendance: attendanceCount, totalActivities: totalActivities };
    });

    calendarEvents.forEach(event => {
      if ((event.type === 'match' || event.type === 'matchResult') && event.squad) {
        event.squad.calledUp?.forEach(playerId => {
          if (stats[playerId]) {
            stats[playerId].calledUp++;
          }
        });
        event.squad.notCalledUp?.forEach(playerId => {
          if (stats[playerId]) {
            stats[playerId].notCalledUp++;
          }
        });
      }
    });
    return stats;
  }, [players, calendarEvents]);

  const filteredPlayers = players.filter(player =>
    `${player.name} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-white">Equipo</h2>
            <p className="text-gray-400 mt-1">Gestiona los miembros de tu equipo</p>
        </div>
      </div>

      <div className="mb-6 relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
              type="text"
              placeholder="Buscar jugadores"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
      </div>

      <Card className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Nombre</th>
                <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Posición</th>
                <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-center">Asistencia</th>
                <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-center">Convocado</th>
                <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-center">No Convocado</th>
                <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPlayers.map(player => {
                const stats = playerStats[player.id] || { calledUp: 0, notCalledUp: 0, attendance: 0, totalActivities: 0 };
                const attendancePercentage = stats.totalActivities > 0 ? (stats.attendance / stats.totalActivities) * 100 : 100;

                return (
                  <tr key={player.id} className="hover:bg-gray-700/50 group">
                    <td className="p-4 text-white font-medium flex items-center gap-3 cursor-pointer" onClick={() => onSelectPlayer(player)}>
                      <img src={player.photoUrl} alt={player.name} className="w-8 h-8 rounded-full" />
                      {player.name}
                    </td>
                    <td className="p-4 text-gray-300 cursor-pointer" onClick={() => onSelectPlayer(player)}>{player.position}</td>
                    <td className="p-4 text-gray-300 text-center cursor-pointer" onClick={() => onSelectPlayer(player)}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-white">
                            {`${stats.attendance}/${stats.totalActivities}`}
                        </span>
                        <div className="w-20 bg-gray-700 rounded-full h-2" title={`${attendancePercentage.toFixed(0)}% de asistencia`}>
                            <div
                                className="bg-cyan-400 h-2 rounded-full"
                                style={{ width: `${attendancePercentage}%` }}
                            ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-green-400 font-bold text-center cursor-pointer" onClick={() => onSelectPlayer(player)}>{stats.calledUp}</td>
                    <td className="p-4 text-red-400 font-bold text-center cursor-pointer" onClick={() => onSelectPlayer(player)}>{stats.notCalledUp}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button onClick={() => onSelectPlayer(player)} title="Ver Perfil" className="p-1.5 text-gray-400 hover:text-cyan-400 rounded-md hover:bg-gray-700 transition-colors">
                            <UsersIcon className="w-5 h-5" />
                        </button>
                        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEditPlayer(player); }} title="Editar" className="p-1.5 text-gray-400 hover:text-yellow-400 rounded-md hover:bg-gray-700 transition-colors">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeletePlayer(player.id); }} title="Eliminar" className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-700 transition-colors">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500">No se encontraron jugadores.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

interface PlayerProfileProps {
  player: Player;
  evaluations: PlayerEvaluation[];
  onClose: () => void;
  onOpenEvalModal: () => void;
  onMarkAsActive: (player: Player) => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, evaluations, onClose, onOpenEvalModal, onMarkAsActive }) => (
  <Card className="p-6">
    <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
            <img className="w-24 h-24 rounded-full" src={player.photoUrl} alt={player.name} />
            <div>
            <h2 className="text-2xl font-bold text-white">{player.name}</h2>
            <p className="text-cyan-300">"{player.nickname}"</p>
            <p className="text-gray-400">{player.position} - #{player.jerseyNumber}</p>
            <p className="text-sm text-gray-400">{player.contactInfo.email}</p>
            </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
    </div>
    
    <div className="mt-4 flex justify-end gap-4">
        {player.medicalInfo.status === 'Lesionado' && (
             <button
                onClick={() => onMarkAsActive(player)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                <ShieldCheckIcon className="w-5 h-5" />
                Marcar como Activo
            </button>
        )}
        <button
            onClick={onOpenEvalModal}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
            <ClipboardPlusIcon className="w-5 h-5" />
            Registrar Nueva Evaluación
        </button>
    </div>
    
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Detalles</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p><strong>Edad:</strong> {player.personalInfo.age}</p>
          <p><strong>Altura:</strong> {player.personalInfo.height}</p>
          <p><strong>Peso:</strong> {player.personalInfo.weight}</p>
          <p><strong>Estado Médico:</strong> <span className={`${player.medicalInfo.status === 'Lesionado' ? 'text-red-400' : 'text-green-400'}`}>{player.medicalInfo.status}</span></p>
          <p className="text-xs text-gray-400">{player.medicalInfo.notes}</p>
        </div>
      </div>
       <div>
        <h3 className="text-lg font-semibold text-white mb-2">Información Adicional</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p><strong>Club Anterior:</strong> {player.previousClub}</p>
          <p><strong>Email Padres:</strong> {player.parentInfo.parentEmail}</p>
          <p><strong>Observaciones:</strong> {player.observations}</p>
        </div>
      </div>
    </div>
    <div className="mt-6">
      <PerformanceChart evaluations={evaluations} title={`Tendencia de Rendimiento de ${player.name.split(' ')[0]}`} />
    </div>
  </Card>
);

interface TrainingPlannerProps {
  events: CalendarEvent[];
  players: Player[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

const TrainingPlanner: React.FC<TrainingPlannerProps> = ({ events, players, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);


  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    d.setUTCHours(0,0,0,0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const handleOpenAddModal = (date: Date) => {
    setSelectedDate(date);
    setEventToEdit(null);
  };
  
  const handleStartEdit = (event: CalendarEvent) => {
    const eventDate = new Date(event.date);
    eventDate.setUTCHours(0,0,0,0);
    setSelectedDate(eventDate);
    setEventToEdit(event);
  };
  
  const handleRequestDelete = (eventId: string) => {
    setEventToDelete(eventId);
  };

  const executeDelete = () => {
    if (eventToDelete) {
      onDeleteEvent(eventToDelete);
      setEventToDelete(null);
    }
  };

  const handleCloseModals = () => {
    setSelectedDate(null);
    setEventToEdit(null);
  };

  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    onAddEvent(eventData);
    handleCloseModals();
  };
  
  const handleUpdateCurrentEvent = (updatedEvent: CalendarEvent) => {
    onUpdateEvent(updatedEvent);
    handleCloseModals();
  };
  
  const weekStartDate = startOfWeek(currentDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const weekRange = `${weekStartDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${addDays(weekStartDate, 6).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  
  const eventsByDate = useMemo(() => {
    const acc: Record<string, CalendarEvent[]> = {};
    weekDates.forEach(date => {
        acc[toYYYYMMDD(date)] = [];
    });

    events.forEach(event => {
        const startDate = new Date(event.date);
        startDate.setUTCHours(0,0,0,0);
        const endDate = event.endDate ? new Date(event.endDate) : startDate;
        endDate.setUTCHours(0,0,0,0);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = toYYYYMMDD(d);
            if (dateKey in acc) {
                acc[dateKey].push(event);
            }
        }
    });
    return acc;
  }, [events, weekDates]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Planificador Semanal</h2>
          <p className="text-gray-400 mt-1">{weekRange}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevWeek} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full"><ChevronLeftIcon className="w-5 h-5 text-gray-300" /></button>
          <button onClick={handleNextWeek} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full"><ChevronRightIcon className="w-5 h-5 text-gray-300" /></button>
        </div>
      </div>
      
       <div className="bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="grid grid-cols-7 divide-x divide-gray-700">
              {weekDates.map(date => (
                  <div key={`header-${toYYYYMMDD(date)}`} className="p-3 text-left">
                      <span className="text-gray-400 text-xs uppercase">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                      <span className="text-white text-lg ml-2 font-semibold">{date.getDate()}</span>
                  </div>
              ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-1 auto-rows-fr divide-x divide-gray-700 border-t border-gray-700">
              {weekDates.map(date => {
                  const dateString = toYYYYMMDD(date);
                  const dayEvents = eventsByDate[dateString] || [];
                  return (
                      <div key={dateString} className="p-2 min-h-[12rem] flex flex-col gap-1.5">
                        <div className="flex-grow space-y-1.5">
                          {dayEvents.map(event => (
                              <CalendarEventItem
                                  key={`${event.id}-${dateString}`}
                                  event={event}
                                  onEdit={() => handleStartEdit(event)}
                                  onDelete={() => handleRequestDelete(event.id)}
                              />
                          ))}
                        </div>
                        <div className="text-center pt-2">
                            <button onClick={() => handleOpenAddModal(date)} className="text-gray-500 hover:text-cyan-400 transition-colors">
                                <PlusCircleIcon className="w-6 h-6 inline-block" />
                            </button>
                        </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {selectedDate && (
        <AddEventModal
          onClose={handleCloseModals}
          onAddEvent={handleSaveEvent}
          onUpdateEvent={handleUpdateCurrentEvent}
          players={players}
          selectedDate={selectedDate}
          eventToEdit={eventToEdit}
        />
      )}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={() => setEventToDelete(null)}>
            <Card className="w-full max-w-sm p-6 text-center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">Confirmar Eliminación</h3>
                <p className="text-gray-300 mb-6">¿Estás seguro de que quieres eliminar este evento?</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => setEventToDelete(null)} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button onClick={executeDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
                        Eliminar
                    </button>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
};

interface CalendarEventItemProps {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
}

const CalendarEventItem: React.FC<CalendarEventItemProps> = ({ event, onEdit, onDelete }) => {
    const eventStyles: Record<CalendarEventType, { icon: React.ElementType; color: string }> = {
        training: { icon: ActivityIcon, color: 'cyan' },
        match: { icon: ShieldIcon, color: 'green' },
        injury: { icon: HeartPulseIcon, color: 'red' },
        personal: { icon: UserMinusIcon, color: 'yellow' },
        matchResult: { icon: SoccerBallIcon, color: 'purple' },
    };

    const styleInfo = eventStyles[event.type];
    if (!styleInfo) return null;
    
    const { icon: Icon, color } = styleInfo;
    const colorClasses: Record<string, string> = {
      cyan: 'border-cyan-500 text-cyan-300 bg-cyan-500/10',
      green: 'border-green-500 text-green-300 bg-green-500/10',
      red: 'border-red-500 text-red-300 bg-red-500/10',
      yellow: 'border-yellow-500 text-yellow-300 bg-yellow-500/10',
      purple: 'border-purple-500 text-purple-300 bg-purple-500/10',
    };
    const [borderColor, textColor, bgColor] = colorClasses[color].split(' ');

    return (
        <div className={`relative group p-1.5 rounded-md text-xs ${bgColor} border-l-2 ${borderColor}`}>
            <div className={`flex items-start gap-1.5`}>
                <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${textColor}`} />
                <p className="text-gray-200 font-medium leading-tight pr-8">{event.title}</p>
            </div>
             <div className="absolute top-1 right-1 hidden group-hover:flex bg-gray-900/50 rounded-sm shadow-lg">
                <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(); }} title="Editar Evento" className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"><EditIcon className="w-3.5 h-3.5" /></button>
                <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(); }} title="Eliminar Evento" className="p-1 text-gray-400 hover:text-red-400 transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
            </div>
        </div>
    );
};

interface AddEventModalProps {
  onClose: () => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  players: Player[];
  selectedDate: Date;
  eventToEdit?: CalendarEvent | null;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, onAddEvent, onUpdateEvent, players, selectedDate, eventToEdit }) => {
  const isEditMode = !!eventToEdit;
  const [eventType, setEventType] = useState<CalendarEventType>(isEditMode ? eventToEdit.type : 'training');
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({ locationType: 'home' });
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [scorers, setScorers] = useState<string[]>([]);
  const [assists, setAssists] = useState<string[]>([]);
  const [tempScorer, setTempScorer] = useState('');
  const [tempAssister, setTempAssister] = useState('');
  const [mainExercises, setMainExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState({ name: '', description: '', sets: '', reps: '' });
  
  useEffect(() => {
    if (isEditMode && eventToEdit) {
      const { id: _id, type, ...eventData } = eventToEdit;
      setEventType(type);
      setFormData(eventData);
      setMainExercises(eventToEdit.mainExercises || []);
      if(type === 'matchResult') {
        setScorers(eventToEdit.scorers || []);
        setAssists(eventToEdit.assists || []);
      }
      if (type === 'personal' || type === 'training') {
        setSelectedPlayerIds(eventToEdit.playerIds || []);
      }
    } else {
        setEventType('training');
        setFormData({ locationType: 'home' });
        setSelectedPlayerIds(players.map(p => p.id));
        setScorers([]);
        setAssists([]);
        setMainExercises([]);
    }
  }, [eventToEdit, isEditMode, selectedDate, players]);
  
  const handlePlayerIdToggle = (playerId: string) => {
    setSelectedPlayerIds(prev =>
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const inputStyle = "w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm";
  const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleAddToList = (listType: 'scorer' | 'assist') => {
      if (listType === 'scorer' && tempScorer) {
          setScorers(prev => [...prev, tempScorer]);
          setTempScorer('');
      } else if (listType === 'assist' && tempAssister) {
          setAssists(prev => [...prev, tempAssister]);
          setTempAssister('');
      }
  };
  
  const handleRemoveFromList = (listType: 'scorer' | 'assist', index: number) => {
      if (listType === 'scorer') {
          setScorers(prev => prev.filter((_, i) => i !== index));
      } else {
          setAssists(prev => prev.filter((_, i) => i !== index));
      }
  }

  const handleCurrentExerciseChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentExercise(prev => ({ ...prev, [name]: value }));
  };

  const handleAddExercise = () => {
      if (!currentExercise.name.trim()) return;
      const newEx: Exercise = {
          id: `ex-${Date.now()}`,
          name: currentExercise.name,
          description: currentExercise.description,
          sets: currentExercise.sets ? parseInt(currentExercise.sets, 10) : undefined,
          reps: currentExercise.reps,
      };
      setMainExercises(prev => [...prev, newEx]);
      setCurrentExercise({ name: '', description: '', sets: '', reps: '' });
  };

  const handleRemoveExercise = (indexToRemove: number) => {
      setMainExercises(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const date = toYYYYMMDD(selectedDate);
    
    let finalFormData = { ...formData };
    if (finalFormData.endDate === '') {
        delete finalFormData.endDate;
    }

    let title = finalFormData.title;
    switch (eventType) {
      case 'match':
        title = `Partido vs ${finalFormData.opponent}`;
        break;
      case 'matchResult':
        title = `Resultado: vs ${finalFormData.opponent}`;
        break;
      case 'injury':
        const player = players.find(p => p.id === finalFormData.playerId);
        title = `Lesión: ${player?.name || ''}`;
        break;
      case 'personal':
        title = `Ausencia Personal (${selectedPlayerIds.length} jug.)`;
        break;
      case 'training':
        title = finalFormData.title || 'Entrenamiento';
        break;
    }
    
    const eventData = { ...finalFormData, date, type: eventType, title, scorers, assists, playerIds: selectedPlayerIds, mainExercises };
    
    if (isEditMode && eventToEdit) {
      onUpdateEvent({ ...eventToEdit, ...eventData });
    } else {
      onAddEvent(eventData as Omit<CalendarEvent, 'id'>);
    }
  };
  
  interface PlayerListProps {
    playerIds: string[];
    onRemove: (index: number) => void;
  }
  const PlayerList: React.FC<PlayerListProps> = ({playerIds, onRemove}) => (
      <div className="space-y-1">
          {playerIds.map((id, index) => {
              const player = players.find(p => p.id === id);
              return (
                  <div key={`${id}-${index}`} className="flex items-center justify-between bg-gray-900/50 p-1 rounded-md text-xs">
                      <span className="text-gray-300">{player?.name}</span>
                      <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-300 font-bold w-4 h-4 rounded-full flex items-center justify-center">×</button>
                  </div>
              )
          })}
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                    {isEditMode ? 'Editar Evento' : `Añadir Evento para ${selectedDate.toLocaleDateString('es-ES', {day: 'numeric', month: 'long'})}`}
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className={labelStyle}>Tipo de Evento</label>
                        <select name="type" value={eventType} onChange={(e: ChangeEvent<HTMLSelectElement>) => setEventType(e.target.value as CalendarEventType)} className={inputStyle}>
                            <option value="training">Entrenamiento</option>
                            <option value="match">Partido</option>
                            <option value="matchResult">Resultado de Partido</option>
                            <option value="injury">Lesión</option>
                            <option value="personal">Ausencia Personal</option>
                        </select>
                    </div>

                    {eventType === 'training' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="title" className={labelStyle}>Título del Entrenamiento</label>
                                <input type="text" name="title" value={formData.title || ''} onChange={handleChange} className={inputStyle} required placeholder="Ej: Táctica defensiva"/>
                            </div>
                            <div>
                                <label className={labelStyle}>Ejercicios Principales</label>
                                <div className="space-y-2 p-3 bg-gray-900/50 border border-gray-600 rounded-md">
                                    {mainExercises.map((ex, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                                            <div className="text-sm">
                                                <p className="font-semibold text-white">{ex.name}</p>
                                                <p className="text-xs text-gray-400">{ex.description} - {ex.sets} series x {ex.reps} reps</p>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveExercise(index)} className="text-red-400 hover:text-red-300 font-bold w-6 h-6 rounded-full flex items-center justify-center">&times;</button>
                                        </div>
                                    ))}
                                    {mainExercises.length === 0 && <p className="text-xs text-gray-500 text-center">No se han añadido ejercicios.</p>}
                                </div>
                                <div className="mt-3 p-3 border border-dashed border-gray-600 rounded-md space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-300">Añadir Nuevo Ejercicio</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="text" placeholder="Nombre" name="name" value={currentExercise.name} onChange={handleCurrentExerciseChange} className={inputStyle + ' text-xs'} />
                                        <input type="text" placeholder="Descripción" name="description" value={currentExercise.description} onChange={handleCurrentExerciseChange} className={inputStyle + ' text-xs'} />
                                        <input type="text" placeholder="Series (ej: 4)" name="sets" value={currentExercise.sets} onChange={handleCurrentExerciseChange} className={inputStyle + ' text-xs'} />
                                        <input type="text" placeholder="Reps (ej: 10-12)" name="reps" value={currentExercise.reps} onChange={handleCurrentExerciseChange} className={inputStyle + ' text-xs'} />
                                    </div>
                                    <button type="button" onClick={handleAddExercise} className="w-full text-xs bg-cyan-700 hover:bg-cyan-600 text-white font-semibold py-1.5 px-3 rounded-md transition-colors">Añadir Ejercicio</button>
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Jugadores Asignados</label>
                                <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-gray-800/50 border border-gray-600 rounded-md">
                                    {players.map(p => (
                                        <label key={p.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedPlayerIds.includes(p.id)}
                                                onChange={() => handlePlayerIdToggle(p.id)}
                                                className="w-4 h-4 rounded bg-gray-700 border-gray-500 text-cyan-500 focus:ring-cyan-600"
                                            />
                                            <span className="text-sm text-gray-300">{p.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {eventType === 'injury' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="playerId" className={labelStyle}>Jugador</label>
                                <select name="playerId" value={formData.playerId || ''} onChange={handleChange} className={inputStyle} required>
                                    <option value="">Selecciona un jugador...</option>
                                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="endDate" className={labelStyle}>Fecha de Fin (Opcional)</label>
                                <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} className={inputStyle} min={toYYYYMMDD(selectedDate)}/>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="reason" className={labelStyle}>Motivo</label>
                                <textarea name="reason" rows={3} value={formData.reason || ''} onChange={handleChange} className={inputStyle} required></textarea>
                            </div>
                        </div>
                    )}

                    {eventType === 'personal' && (
                        <div>
                             <label className={labelStyle}>Jugadores Ausentes</label>
                             <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-gray-800/50 border border-gray-600 rounded-md">
                                {players.map(p => (
                                    <label key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedPlayerIds.includes(p.id)}
                                            onChange={() => handlePlayerIdToggle(p.id)}
                                            className="w-4 h-4 rounded bg-gray-700 border-gray-500 text-cyan-500 focus:ring-cyan-600"
                                        />
                                        <img src={p.photoUrl} alt={p.name} className="w-6 h-6 rounded-full" />
                                        <span className="text-sm text-gray-200">{p.name}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-4">
                                <label htmlFor="reason" className={labelStyle}>Motivo</label>
                                <textarea name="reason" rows={2} value={formData.reason || ''} onChange={handleChange} className={inputStyle} required placeholder="Ej: Viaje familiar"></textarea>
                            </div>
                        </div>
                    )}

                    {(eventType === 'match' || eventType === 'matchResult') && (
                       <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
                               <label htmlFor="opponent" className={labelStyle}>Oponente</label>
                               <input type="text" name="opponent" value={formData.opponent || ''} onChange={handleChange} className={inputStyle} required />
                           </div>
                           <div className="col-span-2">
                                <label htmlFor="locationType" className={labelStyle}>Ubicación</label>
                                <select name="locationType" value={formData.locationType || 'home'} onChange={handleChange} className={inputStyle} required>
                                    <option value="home">Local</option>
                                    <option value="away">Visitante</option>
                                </select>
                           </div>
                           
                           {eventType === 'match' ? (
                            <>
                               <div>
                                    <label htmlFor="time" className={labelStyle}>Hora del Partido</label>
                                    <input type="time" name="time" value={formData.time || ''} onChange={handleChange} className={inputStyle} required />
                               </div>
                               <div>
                                    <label htmlFor="venue" className={labelStyle}>Lugar del Partido</label>
                                    <input type="text" name="venue" value={formData.venue || ''} onChange={handleChange} className={inputStyle} required />
                               </div>
                               <div>
                                    <label htmlFor="meetingTime" className={labelStyle}>Hora de Convocatoria</label>
                                    <input type="time" name="meetingTime" value={formData.meetingTime || ''} onChange={handleChange} className={inputStyle} required />
                               </div>
                               <div>
                                    <label htmlFor="meetingPoint" className={labelStyle}>Lugar de Convocatoria</label>
                                    <input type="text" name="meetingPoint" value={formData.meetingPoint || ''} onChange={handleChange} className={inputStyle} required />
                               </div>
                           </>
                           ) : (
                            <div className="col-span-2 space-y-4">
                               <div>
                                   <label htmlFor="result" className={labelStyle}>Resultado (Ej: 3-1)</label>
                                   <input type="text" name="result" value={formData.result || ''} onChange={handleChange} className={inputStyle} placeholder="Nuestro Equipo - Oponente" required />
                               </div>
                               
                               <div>
                                   <label className={labelStyle}>Goleadores</label>
                                   <div className="flex gap-2">
                                       <select value={tempScorer} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTempScorer(e.target.value)} className={inputStyle}>
                                           <option value="">Selecciona jugador...</option>
                                           {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                       </select>
                                       <button type="button" onClick={() => handleAddToList('scorer')} className="px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm">Añadir</button>
                                   </div>
                                   <div className="mt-2"><PlayerList playerIds={scorers} onRemove={(index: number) => handleRemoveFromList('scorer', index)} /></div>
                               </div>

                               <div>
                                   <label className={labelStyle}>Asistentes</label>
                                   <div className="flex gap-2">
                                       <select value={tempAssister} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTempAssister(e.target.value)} className={inputStyle}>
                                           <option value="">Selecciona jugador...</option>
                                           {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                       </select>
                                       <button type="button" onClick={() => handleAddToList('assist')} className="px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-sm">Añadir</button>
                                   </div>
                                   <div className="mt-2"><PlayerList playerIds={assists} onRemove={(index: number) => handleRemoveFromList('assist', index)} /></div>
                               </div>
                            </div>
                           )}
                       </div>
                    )}

                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors">
                        {isEditMode ? 'Guardar Cambios' : 'Añadir'}
                    </button>
                </div>
            </form>
        </Card>
    </div>
  );
};

interface ComparisonViewProps {
  players: Player[];
  evaluations: PlayerEvaluation[];
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ players, evaluations }) => {
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

    const handlePlayerToggle = (playerId: string) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    };

    const maxMetrics = {
        agility: { min: 15, max: 25 },
        speed: { min: 4, max: 6 },
        endurance: 5000,
        flexibility: 40,
    };

    const lastEvals = players
        .map(p => {
            const playerEvals = evaluations
                .filter(e => e.playerId === p.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return playerEvals.length > 0 ? { ...p, lastEval: playerEvals[0].metrics } : null;
        })
        .filter((p): p is Player & { lastEval: EvaluationMetric } => p !== null && !!p.lastEval);
        
    const chartData = lastEvals
        .filter(p => selectedPlayerIds.includes(p.id))
        .map(p => {
            const agilityScore = ((maxMetrics.agility.max - p.lastEval.agility) / (maxMetrics.agility.max - maxMetrics.agility.min)) * 100;
            const speedScore = ((maxMetrics.speed.max - p.lastEval.speed) / (maxMetrics.speed.max - maxMetrics.speed.min)) * 100;
            return {
                name: p.name.split(' ')[0],
                Agilidad: Math.max(0, Math.min(100, agilityScore)),
                Velocidad: Math.max(0, Math.min(100, speedScore)),
                Resistencia: (p.lastEval.endurance / maxMetrics.endurance) * 100,
                Flexibilidad: (p.lastEval.flexibility / maxMetrics.flexibility) * 100,
            }
        });
    
    const radarDataMetrics = ['Agilidad', 'Velocidad', 'Resistencia', 'Flexibilidad'];
    const radarData = radarDataMetrics.map(metric => {
        const entry: { metric: string; [key: string]: string | number } = { metric };
        chartData.forEach(playerData => {
            entry[playerData.name] = playerData[metric as keyof typeof playerData];
        });
        return entry;
    });

    const colors = ['#38bdf8', '#f472b6', '#34d399', '#facc15', '#a78bfa'];

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Comparativa de Rendimiento</h2>
            <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Selecciona jugadores para comparar</h3>
                <div className="flex flex-wrap gap-2">
                    {players.map(player => (
                        <button key={player.id} onClick={() => handlePlayerToggle(player.id)}
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${selectedPlayerIds.includes(player.id) ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'}`}>
                            {player.name}
                        </button>
                    ))}
                </div>
            </Card>
            {chartData.length > 0 &&
            <Card className="p-6">
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <defs>
                                {chartData.map((player, index) => (
                                    <radialGradient id={`color${player.name}`} key={player.name}>
                                        <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1}/>
                                    </radialGradient>
                                ))}
                            </defs>
                            <PolarGrid stroke="#4A5568" />
                            <PolarAngleAxis dataKey="metric" stroke="#A0AEC0" fontSize={14} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#A0AEC0" tickFormatter={(tick: number) => `${tick}%`} />
                            <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4A5568', borderRadius: '0.5rem' }} />
                            <Legend />
                            {chartData.map((player, index) => (
                                <Radar key={player.name} name={player.name} dataKey={player.name} stroke={colors[index % colors.length]} fill={`url(#color${player.name})`} fillOpacity={0.8} />
                            ))}
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            }
        </div>
    );
};

interface MatchDayViewProps {
    players: Player[];
    match: CalendarEvent | undefined;
    setSquad: (eventId: string, squad: { calledUp: string[]; notCalledUp: string[] }) => void;
    calendarEvents: CalendarEvent[];
}

const MatchDayView: React.FC<MatchDayViewProps> = ({ players, match, setSquad, calendarEvents }) => {
    
    const unavailablePlayersMap = useMemo(() => {
        if (!match) return new Map();
        
        const unavailable = new Map<string, string>();
        const matchDate = new Date(match.date + 'T00:00:00');

        calendarEvents.forEach(event => {
            if ((event.type === 'injury' || event.type === 'personal') && event.reason) {
                if(event.type === 'injury' && event.playerId) {
                    const startDate = new Date(event.date + 'T00:00:00');
                    const endDate = event.endDate ? new Date(event.endDate + 'T00:00:00') : startDate;
                    if (matchDate >= startDate && matchDate <= endDate) {
                        unavailable.set(event.playerId, `Lesión: ${event.reason}`);
                    }
                }
                if(event.type === 'personal' && event.playerIds) {
                    const eventDate = new Date(event.date + 'T00:00:00');
                    if (eventDate.getTime() === matchDate.getTime()) {
                        event.playerIds.forEach(id => {
                            unavailable.set(id, `Ausencia: ${event.reason}`);
                        });
                    }
                }
            }
        });
        return unavailable;
    }, [match, calendarEvents]);

    if (!match) {
        return <Card className="p-6 text-center text-gray-400">No hay partidos programados.</Card>
    }

    const { squad = { calledUp: [], notCalledUp: [] } } = match;

    const handleSetCalledUp = (playerId: string) => {
        const newSquad = { ...squad };
        newSquad.notCalledUp = newSquad.notCalledUp.filter((id: string) => id !== playerId);
        if (!newSquad.calledUp.includes(playerId)) {
            newSquad.calledUp.push(playerId);
        }
        setSquad(match.id, newSquad);
    };

    const handleSetNotCalledUp = (playerId: string) => {
        const newSquad = { ...squad };
        newSquad.calledUp = newSquad.calledUp.filter((id: string) => id !== playerId);
        if (!newSquad.notCalledUp.includes(playerId)) {
            newSquad.notCalledUp.push(playerId);
        }
        setSquad(match.id, newSquad);
    };

    const handleMakeAvailable = (playerId: string) => {
        const newSquad = { ...squad };
        newSquad.calledUp = newSquad.calledUp.filter((id: string) => id !== playerId);
        newSquad.notCalledUp = newSquad.notCalledUp.filter((id: string) => id !== playerId);
        setSquad(match.id, newSquad);
    };

    const unavailablePlayers = players.filter(p => unavailablePlayersMap.has(p.id));
    const calledUpPlayers = players.filter(p => squad.calledUp.includes(p.id) && !unavailablePlayersMap.has(p.id));
    const notCalledUpPlayers = players.filter(p => squad.notCalledUp.includes(p.id) && !unavailablePlayersMap.has(p.id));
    const availablePlayers = players.filter(p => !squad.calledUp.includes(p.id) && !squad.notCalledUp.includes(p.id) && !unavailablePlayersMap.has(p.id));
    
    const matchDate = new Date(match.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    interface PlayerItemProps {
        player: Player;
        listType: 'available' | 'calledUp' | 'notCalledUp' | 'unavailable';
        reason?: string;
    }
    const PlayerItem: React.FC<PlayerItemProps> = ({ player, listType, reason }) => (
        <div className="flex items-center justify-between p-2 bg-gray-700/60 rounded-lg animate-fade-in">
            <div className="flex items-center gap-3">
                <img src={player.photoUrl} className="w-8 h-8 rounded-full" alt={player.name}/>
                <div>
                  <span className="text-sm font-medium text-white">{player.name}</span>
                  {reason && <p className="text-xs text-red-300">{reason}</p>}
                </div>
            </div>
            <div className="flex gap-1">
                 {listType === 'available' && (
                    <>
                        <button onClick={() => handleSetCalledUp(player.id)} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded-md transition-colors">Convocar</button>
                        <button onClick={() => handleSetNotCalledUp(player.id)} className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded-md transition-colors">No Convocar</button>
                    </>
                 )}
                 {(listType === 'calledUp' || listType === 'notCalledUp') && (
                    <button onClick={() => handleMakeAvailable(player.id)} title="Mover a Disponibles" className="text-xs bg-gray-600 hover:bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-md transition-colors">X</button>
                 )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                 <h2 className="text-2xl font-bold text-white mb-2">Día de Partido: vs {match.opponent}</h2>
                 <p className="text-lg text-gray-400">{matchDate}</p>
            </div>
            
             <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><TrophyIcon className="w-6 h-6 text-cyan-400" /> Detalles del Partido</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong className="text-gray-400 font-medium">Fecha:</strong> <span className="text-white">{matchDate}</span></p>
                            <p><strong className="text-gray-400 font-medium">Hora:</strong> <span className="text-white">{match.time} H</span></p>
                            <p><strong className="text-gray-400 font-medium">Lugar:</strong> <span className="text-white">{match.venue}</span></p>
                        </div>
                    </div>
                    <div className="border-t md:border-t-0 md:border-l border-gray-700 pt-6 md:pt-0 md:pl-6">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><MapPinIcon className="w-6 h-6 text-cyan-400" /> Detalles de la Convocatoria</h3>
                         <div className="space-y-2 text-sm">
                            <p><strong className="text-gray-400 font-medium">Fecha:</strong> <span className="text-white">{matchDate}</span></p>
                            <p><strong className="text-gray-400 font-medium">Hora:</strong> <span className="text-white">{match.meetingTime} H</span></p>
                            <p><strong className="text-gray-400 font-medium">Lugar:</strong> <span className="text-white">{match.meetingPoint}</span></p>
                        </div>
                    </div>
                </div>
            </Card>
            
            {unavailablePlayers.length > 0 && (
                <Card className="p-4 border-red-500/50">
                    <h3 className="font-semibold text-lg text-red-300 mb-4">No Disponibles ({unavailablePlayers.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {unavailablePlayers.map(p => <PlayerItem key={p.id} player={p} listType='unavailable' reason={unavailablePlayersMap.get(p.id)} />)}
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4 bg-gray-800/30">
                    <h3 className="font-semibold text-lg text-white mb-4">Jugadores Disponibles ({availablePlayers.length})</h3>
                    <div className="space-y-2">
                        {availablePlayers.map(p => <PlayerItem key={p.id} player={p} listType='available' />)}
                        {availablePlayers.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No hay jugadores disponibles.</p>}
                    </div>
                </Card>
                <Card className="p-4 border-cyan-500/50">
                    <h3 className="font-semibold text-lg text-cyan-300 mb-4">Convocados ({calledUpPlayers.length})</h3>
                    <div className="space-y-2">
                        {calledUpPlayers.map(p => <PlayerItem key={p.id} player={p} listType='calledUp' />)}
                        {calledUpPlayers.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Añade jugadores aquí.</p>}
                    </div>
                </Card>
                <Card className="p-4 border-yellow-500/50">
                    <h3 className="font-semibold text-lg text-yellow-300 mb-4">No Convocados ({notCalledUpPlayers.length})</h3>
                    <div className="space-y-2">
                        {notCalledUpPlayers.map(p => <PlayerItem key={p.id} player={p} listType='notCalledUp' />)}
                         {notCalledUpPlayers.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Añade jugadores aquí.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CoachDashboard;