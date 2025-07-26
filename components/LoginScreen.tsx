import React, { useState, ChangeEvent, FormEvent } from 'react';
import type { Player } from '../types';
import Card from './Card';

type Role = 'coach' | 'club' | 'player';

interface LoginScreenProps {
  onLogin: (role: Role, password?: string, playerId?: string) => void;
  players: Player[];
  error: string;
  onSwitchToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, players, error, onSwitchToRegister }) => {
  const [role, setRole] = useState<Role>('coach');
  const [password, setPassword] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (role === 'player') {
      onLogin(role, password, selectedPlayerId);
    } else {
      onLogin(role, password);
    }
  };

  const inputStyle = "w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500";
  const labelStyle = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center text-white mb-2">Bienvenido a Enxebre Futbol</h2>
        <p className="text-center text-gray-400 mb-6">Selecciona tu rol para continuar</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="role" className={labelStyle}>Rol</label>
            <select
              id="role"
              value={role}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as Role)}
              className={inputStyle}
            >
              <option value="coach">Entrenador</option>
              <option value="club">Club</option>
              <option value="player">Jugador</option>
            </select>
          </div>

          {role === 'player' ? (
            <>
              <div>
                <label htmlFor="player" className={labelStyle}>Selecciona tu Perfil</label>
                <select
                  id="player"
                  value={selectedPlayerId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedPlayerId(e.target.value)}
                  className={inputStyle}
                >
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
               <div>
                <label htmlFor="password" className={labelStyle}>Contraseña</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className={inputStyle}
                    placeholder="Tu contraseña"
                />
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="password" className={labelStyle}>Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className={inputStyle}
                placeholder="Introduce la contraseña"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
            >
              Entrar
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
            ¿Eres un nuevo jugador?{' '}
            <button onClick={onSwitchToRegister} className="font-medium text-cyan-400 hover:text-cyan-300 underline">
                Regístrate aquí
            </button>
        </p>

      </Card>
    </div>
  );
};

export default LoginScreen;