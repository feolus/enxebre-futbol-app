
import React, { useState, useMemo, ChangeEvent } from 'react';
import type { Player, PlayerEvaluation, CalendarEvent } from '../types';
import Card from './Card';
import PerformanceChart from './PerformanceChart';
import PlayerRegistrationForm from './PlayerRegistrationForm';
import AddEvaluationModal from './AddEvaluationModal';
import CreateUserAccessModal from './CreateUserAccessModal';
import { UsersIcon, SearchIcon, PlusCircleIcon, EditIcon, TrashIcon, ClipboardPlusIcon, ShieldCheckIcon, KeyIcon } from './Icons';

type View = 'list' | 'profile' | 'edit' | 'register';

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
  onAddPlayer: (playerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null) => Promise<void>;
  onUpdatePlayer: (player: Player, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null) => Promise<void>;
  onDeletePlayer: (playerId: string) => void;
  onAddEvaluation: (evaluation: Omit<PlayerEvaluation, 'id'>) => void;
  onCreatePlayerAuthUser: (player: Player, password: string) => Promise<void>;
}

const CoachDashboard: React.FC<CoachDashboardProps> = (props) => {
  const [view, setView] = useState<View>('list');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [playerForUserCreation, setPlayerForUserCreation] = useState<Player | null>(null);

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
    today.setUTCHours(0,0,0,0);
    const todayString = toYYYYMMDD(today);

    const activeInjury = props.calendarEvents.find(event =>
        event.type === 'injury' &&
        event.playerId === playerToActivate.id &&
        new Date(event.date + 'T00:00:00') <= today &&
        (!event.endDate || new Date(event.endDate + 'T00:00:00') >= today)
    );
    
    if (activeInjury) {
        // This won't work now as onUpdateEvent is removed from props.
        // For now, the status is just updated on the player object.
        console.log("An active injury was found, but event modification is disabled in this view.");
    }
    
    setSelectedPlayer(updatedPlayer);
  };


  const handleSavePlayerUpdate = async (updatedPlayerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<void> => {
      if (!selectedPlayer) return;
      
      const fullPlayer: Player = {
        ...selectedPlayer,
        name: `${updatedPlayerData.name} ${updatedPlayerData.lastName}`,
        lastName: updatedPlayerData.lastName,
        nickname: updatedPlayerData.nickname,
        idNumber: updatedPlayerData.idNumber,
        jerseyNumber: updatedPlayerData.jerseyNumber,
        position: updatedPlayerData.position,
        previousClub: updatedPlayerData.previousClub,
        observations: updatedPlayerData.observations,
        personalInfo: {
            ...selectedPlayer.personalInfo,
            age: parseInt(updatedPlayerData.age, 10) || 0,
            height: updatedPlayerData.height,
            weight: updatedPlayerData.weight,
        },
        medicalInfo: {
            ...selectedPlayer.medicalInfo,
            treatments: updatedPlayerData.treatments,
        },
        contactInfo: {
            ...selectedPlayer.contactInfo,
            email: updatedPlayerData.email,
            phone: updatedPlayerData.phone,
        },
        parentInfo: {
            ...selectedPlayer.parentInfo,
            fatherNamePhone: updatedPlayerData.fatherNamePhone,
            motherNamePhone: updatedPlayerData.motherNamePhone,
            parentEmail: updatedPlayerData.parentEmail,
        },
    };
    
    await props.onUpdatePlayer(fullPlayer, idPhotoFile, dniFrontFile, dniBackFile);
    handleCloseSubView();
  };

  const handleSaveNewPlayer = async (playerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<void> => {
    await props.onAddPlayer(playerData, idPhotoFile, dniFrontFile, dniBackFile);
    handleCloseSubView();
  };
  
  const handleOpenEvalModal = () => {
      if (selectedPlayer) {
          setIsEvalModalOpen(true);
      }
  };

  const handleSaveEvaluation = (evaluation: Omit<PlayerEvaluation, 'id'>) => {
      props.onAddEvaluation(evaluation);
      setIsEvalModalOpen(false);
  };

  const renderContent = () => {
    switch (view) {
        case 'profile':
            return (
                <>
                    {selectedPlayer && <PlayerProfile 
                      player={selectedPlayer} 
                      evaluations={props.evaluations.filter(e => e.playerId === selectedPlayer!.id)} 
                      onClose={handleCloseSubView} 
                      onOpenEvalModal={handleOpenEvalModal}
                      onMarkAsActive={handleMarkAsActive}
                      onCreateUserAccess={setPlayerForUserCreation}
                    />}
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
            return <PlayerRegistrationForm playerToEdit={selectedPlayer} onSave={handleSavePlayerUpdate} onClose={handleCloseSubView} />;
        case 'register':
            return <PlayerRegistrationForm onSave={handleSaveNewPlayer} onClose={handleCloseSubView} />;
        case 'list':
        default:
            return <ClubView players={props.players} calendarEvents={props.calendarEvents} onSelectPlayer={handleSelectPlayer} onEditPlayer={handleEditPlayer} onDeletePlayer={handleDeleteClick} onAddPlayerClick={() => setView('register')} />;
    }
  };

  return (
    <div>
      {renderContent()}
      {playerForUserCreation && <CreateUserAccessModal player={playerForUserCreation} onClose={() => setPlayerForUserCreation(null)} onCreateUser={props.onCreatePlayerAuthUser} />}
    </div>
  );
};


interface ClubViewProps {
    players: Player[];
    calendarEvents: CalendarEvent[];
    onSelectPlayer: (player: Player) => void;
    onEditPlayer: (player: Player) => void;
    onDeletePlayer: (playerId: string) => void;
    onAddPlayerClick: () => void;
}

const ClubView: React.FC<ClubViewProps> = ({ players, calendarEvents, onSelectPlayer, onEditPlayer, onDeletePlayer, onAddPlayerClick }) => {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white">Gestión del Equipo</h2>
            <p className="text-gray-400 mt-1">Añade, edita y gestiona los miembros de tu equipo.</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onAddPlayerClick}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                <PlusCircleIcon className="w-5 h-5" />
                <span>Añadir Jugador</span>
            </button>
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
  onCreateUserAccess: (player: Player) => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ player, evaluations, onClose, onOpenEvalModal, onMarkAsActive, onCreateUserAccess }) => (
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
    
    <div className="mt-4 flex flex-wrap justify-end gap-4">
        {!player.authUid && (
            <button
                onClick={() => onCreateUserAccess(player)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
                <KeyIcon className="w-5 h-5" />
                Crear Acceso de Usuario
            </button>
        )}
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

export default CoachDashboard;
