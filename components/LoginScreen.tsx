import React, { useState, ChangeEvent, FormEvent } from 'react';
import Card from './Card';

interface LoginScreenProps {
  onLogin: (email: string, password?: string) => void;
  error: string;
  onSwitchToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const inputStyle = "w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500";
  const labelStyle = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center text-white mb-2">Bienvenido a Enxebre Futbol</h2>
        <p className="text-center text-gray-400 mb-6">Inicia sesión para continuar</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={labelStyle}>Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className={inputStyle}
              placeholder="tu@email.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className={labelStyle}>Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className={inputStyle}
              placeholder="Introduce la contraseña"
              required
            />
          </div>

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
