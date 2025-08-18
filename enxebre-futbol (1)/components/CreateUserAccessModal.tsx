
import React, { useState, FormEvent } from 'react';
import Card from './Card';
import type { Player } from '../types';

interface CreateUserAccessModalProps {
  player: Player;
  onClose: () => void;
  onCreateUser: (player: Player, password: string) => Promise<void>;
}

const CreateUserAccessModal: React.FC<CreateUserAccessModalProps> = ({ player, onClose, onCreateUser }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await onCreateUser(player, password);
      onClose();
    } catch (err: any) {
        let message = "Ha ocurrido un error inesperado.";
        if (err.code) {
            switch(err.code) {
                case 'auth/email-already-in-use':
                    message = 'Este correo electrónico ya está en uso por otra cuenta.';
                    break;
                case 'auth/weak-password':
                    message = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
                    break;
                default:
                    message = `Error: ${err.message}`;
            }
        }
        setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = "w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500";
  const labelStyle = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">
            Crear Acceso para <span className="text-cyan-400">{player.name}</span>
          </h3>
          
          <div>
            <label className={labelStyle}>Correo Electrónico del Usuario</label>
            <p className="text-sm text-gray-400 p-2 bg-gray-800 rounded-md border border-gray-600">{player.contactInfo.email}</p>
          </div>

          <div>
            <label htmlFor="password" className={labelStyle}>Contraseña Inicial</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Establece una contraseña segura"
              className={inputStyle}
              required
            />
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoading ? 'Creando...' : 'Crear Acceso'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateUserAccessModal;
