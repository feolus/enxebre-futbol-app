
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import CoachDashboard from './components/CoachDashboard';
import PlayerDashboard from './components/PlayerDashboard';
import ClubDashboard from './components/ClubDashboard';
import LoginScreen from './components/LoginScreen';
import PlayerRegistrationForm from './components/PlayerRegistrationForm';
import type { Player, PlayerEvaluation, CalendarEvent } from './types';
import { LogoIcon, LogoutIcon } from './components/Icons';
import * as firebaseServices from './firebaseServices';
import { auth } from './firebaseConfig';

type UserRole = 'coach' | 'club' | 'player';
type View = 'login' | 'register' | 'dashboard';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  const [loggedInPlayer, setLoggedInPlayer] = useState<Player | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [evaluations, setEvaluations] = useState<PlayerEvaluation[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const loadAppData = useCallback(async (roleInfo: { role: string, playerId?: string }) => {
    try {
      const [fetchedPlayers, fetchedEvals, fetchedEvents] = await Promise.all([
        firebaseServices.getPlayers(),
        firebaseServices.getEvaluations(),
        firebaseServices.getCalendarEvents()
      ]);
      setPlayers(fetchedPlayers);
      setEvaluations(fetchedEvals);
      setCalendarEvents(fetchedEvents);

      if (roleInfo.role === 'player' && roleInfo.playerId) {
        const playerProfile = fetchedPlayers.find(p => p.id === roleInfo.playerId);
        setLoggedInPlayer(playerProfile || null);
      }
      
      setUserRole(roleInfo.role as UserRole);
      setCurrentView('dashboard');

    } catch (error: unknown) {
      console.error("Error fetching app data from Firebase:", error);
      setAuthError("No se pudo cargar los datos de la aplicación. Comprueba tu conexión y las reglas de seguridad de Firebase.");
      await auth.signOut(); // Log out user if data fetching fails
    }
  }, []);

  useEffect(() => {
    // Seed the database on first load if necessary
    firebaseServices.seedDatabase();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (isRegistering) return; // Ignore auth changes during registration process

      setIsLoading(true);
      setAuthError('');
      if (user) {
        const roleInfo = await firebaseServices.getUserRole(user.uid);
        if (roleInfo) {
          await loadAppData(roleInfo);
        } else {
          // This can happen if a user is created in Auth but their role document fails to write.
          setAuthError('No se pudo encontrar el rol del usuario.');
          await auth.signOut();
        }
      } else {
        setUserRole(null);
        setLoggedInPlayer(null);
        setCurrentView('login');
        // Clear data on logout
        setPlayers([]);
        setEvaluations([]);
        setCalendarEvents([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loadAppData, isRegistering]);


  const handleLogin = async (email: string, password?: string) => {
    setAuthError('');
    if (!password) {
      setAuthError('La contraseña es obligatoria.');
      return;
    }
    setIsLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle the rest
    } catch (error: unknown) {
        console.error("Login error", error);
        setAuthError('Correo electrónico o contraseña incorrectos.');
        setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // onAuthStateChanged will handle cleanup
    } catch (error: unknown) {
      console.error("Logout error", error);
      setAuthError('Error al cerrar sesión.');
    }
  };

  const handleAddPlayer = async (newPlayerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<void> => {
    setIsRegistering(true);
    try {
        const newPlayer = await firebaseServices.addPlayer(newPlayerData, idPhotoFile, dniFrontFile, dniBackFile);
        
        // This runs ONLY if addPlayer was successful
        await auth.signOut(); // Sign out the newly created user.
        alert('¡Jugador registrado con éxito! El entrenador o administrador debe volver a iniciar sesión para continuar.');
        
        setPlayers(prev => [...prev, newPlayer]); 
        setCurrentView('login');
    } catch(error) {
        console.error("Failed to add player from App.tsx:", error);
        // The service layer now handles auth user cleanup on failure.
        // We just re-throw the error so the form can display a specific message.
        throw error;
    } finally {
        setIsRegistering(false);
    }
  };

  const handleUpdatePlayer = async (updatedPlayer: Player, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<void> => {
    try {
        const result = await firebaseServices.updatePlayer(updatedPlayer, idPhotoFile, dniFrontFile, dniBackFile);
        setPlayers(prevPlayers => prevPlayers.map(p => p.id === result.id ? result : p));
    } catch (error) {
        console.error("Error updating player from App.tsx:", error);
        throw error; // Re-throw for the form to handle
    }
  };
  
  const handleDeletePlayer = async (playerId: string) => {
    const success = await firebaseServices.deletePlayer(playerId);
    if (success) {
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
      setEvaluations(prev => prev.filter(e => e.playerId !== playerId));
      setCalendarEvents(prevEvents => 
          prevEvents.map(event => {
              if (event.playerIds) {
                  const newPlayerIds = event.playerIds.filter(id => id !== playerId);
                  return { ...event, playerIds: newPlayerIds };
              }
              return event;
          }).filter(event => event.playerId !== playerId)
      );
    }
  };
  
  const handleAddEvaluation = async (newEvaluation: Omit<PlayerEvaluation, 'id'>) => {
    const addedEval = await firebaseServices.addEvaluation(newEvaluation);
    if (addedEval) {
      setEvaluations(prev => [...prev, addedEval]);
    }
  };
  
  const handleAddEvent = useCallback(async (newEvent: Omit<CalendarEvent, 'id'>) => {
    const addedEvent = await firebaseServices.addCalendarEvent(newEvent);
    if (addedEvent) {
      setCalendarEvents(prev => [...prev, addedEvent]);
    }
  }, []);

  const handleUpdateEvent = useCallback(async (updatedEvent: CalendarEvent) => {
    const success = await firebaseServices.updateCalendarEvent(updatedEvent);
    if (success) {
      setCalendarEvents(prevEvents => prevEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    }
  }, []);
  
  const handleDeleteEvent = useCallback(async (eventId: string) => {
    const success = await firebaseServices.deleteCalendarEvent(eventId);
    if (success) {
      setCalendarEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
    }
  }, []);

  const handleSwitchToRegister = () => {
      setCurrentView('register');
  }

  const upcomingMatchEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return calendarEvents
        .filter(e => e.type === 'match' && new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    [0];
  }, [calendarEvents]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-10 text-lg font-semibold text-gray-400">Cargando...</div>;
    }

    if (currentView === 'register') {
      return <PlayerRegistrationForm onSave={handleAddPlayer} onClose={() => setCurrentView('login')} />;
    }

    if (currentView === 'login' || !userRole) {
      return <LoginScreen onLogin={handleLogin} error={authError} onSwitchToRegister={handleSwitchToRegister} />;
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
                />;
      case 'club':
        return <ClubDashboard players={players} calendarEvents={calendarEvents} />;
      case 'player':
        if (!loggedInPlayer) return <div className="text-center p-10 text-lg font-semibold text-gray-400">Cargando perfil del jugador...</div>;
        return <PlayerDashboard 
                  player={loggedInPlayer} 
                  allPlayers={players}
                  evaluations={evaluations.filter(e => e.playerId === loggedInPlayer.id)}
                  matchEvent={upcomingMatchEvent}
                  calendarEvents={calendarEvents}
               />;
      default:
        return <LoginScreen onLogin={handleLogin} error={authError} onSwitchToRegister={handleSwitchToRegister} />;
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
