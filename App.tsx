import { useState, useMemo } from 'react';
import CoachDashboard from './components/CoachDashboard';
import PlayerDashboard from './components/PlayerDashboard';
import ClubDashboard from './components/ClubDashboard';
import LoginScreen from './components/LoginScreen';
import PlayerRegistrationForm from './components/PlayerRegistrationForm';
import { mockPlayers, mockEvaluations, mockCalendarEvents, mockTrainingSessions } from './data/mockData';
import type { Player, PlayerEvaluation, CalendarEvent, TrainingSession } from './types';
import { LogoIcon, LogoutIcon } from './components/Icons';

type UserRole = 'coach' | 'club' | 'player' | null;
type View = 'login' | 'register' | 'dashboard';

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  const [loggedInPlayer, setLoggedInPlayer] = useState<Player | null>(null);
  const [authError, setAuthError] = useState<string>('');

  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [evaluations, setEvaluations] = useState<PlayerEvaluation[]>(mockEvaluations);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  const [trainingSessions] = useState<TrainingSession[]>(mockTrainingSessions);

  const handleLogin = (role: 'coach' | 'club' | 'player', password?: string, playerId?: string) => {
    setAuthError('');
    if (role === 'coach' && password === 'coach123') {
      setUserRole('coach');
      setCurrentView('dashboard');
    } else if (role === 'club' && password === 'club123') {
      setUserRole('club');
      setCurrentView('dashboard');
    } else if (role === 'player' && playerId && password) {
      const player = players.find(p => p.id === playerId);
      if (player && player.password === password) {
        setLoggedInPlayer(player);
        setUserRole('player');
        setCurrentView('dashboard');
      } else {
        setAuthError('Jugador o contraseña incorrectos.');
      }
    } else {
      setAuthError('Credenciales incorrectas.');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setLoggedInPlayer(null);
    setAuthError('');
    setCurrentView('login');
  };

  const handleAddPlayer = async (newPlayerData: Omit<Player, 'id' | 'photoUrl' | 'documents'>, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null) => {
    let photoUrl = `https://picsum.photos/seed/p${Date.now()}/200/200`;
    const documents: { dniFrontUrl?: string; dniBackUrl?: string; idPhotoUrl?: string; } = {};

    if (idPhotoFile) {
        try {
            photoUrl = await convertFileToBase64(idPhotoFile);
            documents.idPhotoUrl = photoUrl;
        } catch (error) {
            console.error("Error converting photo file to Base64", error);
        }
    }

    if (dniFrontFile) {
        try {
            documents.dniFrontUrl = await convertFileToBase64(dniFrontFile);
        } catch (error) {
            console.error("Error converting DNI front file to Base64", error);
        }
    }

    if (dniBackFile) {
        try {
            documents.dniBackUrl = await convertFileToBase64(dniBackFile);
        } catch (error) {
            console.error("Error converting DNI back file to Base64", error);
        }
    }

    const playerToAdd: Player = {
        ...newPlayerData,
        id: `p${Date.now()}`,
        photoUrl: photoUrl,
        name: `${newPlayerData.name} ${newPlayerData.lastName}`,
        documents: documents,
    };
    setPlayers(prev => [...prev, playerToAdd]);
    setCurrentView('login');
  };

  const handleUpdatePlayer = async (updatedPlayer: Player, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null) => {
    let playerToUpdate = { ...updatedPlayer };
    let documents = { ...(playerToUpdate.documents || {}) };

    if (idPhotoFile) {
        try {
            playerToUpdate.photoUrl = await convertFileToBase64(idPhotoFile);
            documents.idPhotoUrl = playerToUpdate.photoUrl;
        } catch (error) {
            console.error("Error converting file to Base64", error);
        }
    }

    if (dniFrontFile) {
        try {
            documents.dniFrontUrl = await convertFileToBase64(dniFrontFile);
        } catch (error) {
            console.error("Error converting DNI front file to Base64", error);
        }
    }

    if (dniBackFile) {
        try {
            documents.dniBackUrl = await convertFileToBase64(dniBackFile);
        } catch (error) {
            console.error("Error converting DNI back file to Base64", error);
        }
    }
    
    playerToUpdate.documents = documents;

    setPlayers(prevPlayers => prevPlayers.map(p => p.id === playerToUpdate.id ? playerToUpdate : p));
  };
  
  const handleUpdatePlayerPassword = (playerId: string, newPassword: string) => {
    setPlayers(prevPlayers => prevPlayers.map(p => 
        p.id === playerId ? { ...p, password: newPassword } : p
    ));
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
    setEvaluations(prev => prev.filter(e => e.playerId !== playerId));
    
    setCalendarEvents(prevEvents => 
        prevEvents.map(event => {
            if (event.playerIds) {
                const newPlayerIds = event.playerIds.filter(id => id !== playerId);
                return { ...event, playerIds: newPlayerIds };
            }
            return event;
        }).filter(event => {
            if (event.playerId === playerId) return false;
            if (event.playerIds && event.playerIds.length === 0) return false;
            return true;
        })
    );
  };
  
  const handleAddEvaluation = (newEvaluation: PlayerEvaluation) => {
    setEvaluations(prev => [...prev, newEvaluation]);
  };
  
  const handleAddEvent = (newEvent: CalendarEvent) => {
    setCalendarEvents(prev => [...prev, newEvent]);
  };

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    setCalendarEvents(prevEvents => prevEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };
  
  const handleDeleteEvent = (eventId: string) => {
    setCalendarEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
  };

  const handleSwitchToRegister = () => {
      setCurrentView('register');
  }

  const upcomingMatchEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    return calendarEvents
        .filter(e => e.type === 'match' && new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    [0];
  }, [calendarEvents]);

  const renderContent = () => {
    if (currentView === 'register') {
      return <PlayerRegistrationForm onSave={handleAddPlayer} onClose={() => setCurrentView('login')} />;
    }

    if (currentView === 'login' || !userRole) {
      return <LoginScreen onLogin={handleLogin} players={players} error={authError} onSwitchToRegister={handleSwitchToRegister} />;
    }

    switch (userRole) {
      case 'coach':
        return <CoachDashboard
                  players={players}
                  evaluations={evaluations}
                  calendarEvents={calendarEvents}
                  onAddEvent={handleAddEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onUpdatePlayer={handleUpdatePlayer}
                  onDeletePlayer={handleDeletePlayer}
                  onAddEvaluation={handleAddEvaluation}
                  onUpdatePlayerPassword={handleUpdatePlayerPassword}
                />;
      case 'club':
        return <ClubDashboard players={players} calendarEvents={calendarEvents} />;
      case 'player':
        if (!loggedInPlayer) return null;
        return <PlayerDashboard 
                  player={loggedInPlayer} 
                  allPlayers={players}
                  matchEvent={upcomingMatchEvent}
                  calendarEvents={calendarEvents}
                  trainingSessions={trainingSessions}
               />;
      default:
        return <LoginScreen onLogin={handleLogin} players={players} error={authError} onSwitchToRegister={handleSwitchToRegister} />;
    }
  };
  
  const getHeaderTitle = () => {
      if (currentView === 'register') return 'Registro de Nuevo Jugador';
      switch(userRole) {
          case 'coach': return 'Panel del Entrenador';
          case 'club': return 'Panel del Club';
          case 'player': return `Panel de ${loggedInPlayer?.name.split(' ')[0]}`;
          default: return 'Plataforma de Rendimiento';
      }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <LogoIcon className="h-10 w-10 text-cyan-400" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Enxebre Futbol</h1>
                <p className="text-xs text-gray-400">{getHeaderTitle()}</p>
              </div>
            </div>
            {userRole && currentView === 'dashboard' && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 hover:text-red-300 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                <LogoutIcon className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;