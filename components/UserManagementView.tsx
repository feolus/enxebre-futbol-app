import React, { useState, ChangeEvent } from 'react';
import type { Player } from '../types';
import Card from './Card';
import { EditIcon } from './Icons';

interface UserManagementViewProps {
    players: Player[];
    onUpdatePassword: (playerId: string, newPassword: string) => void;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ players, onUpdatePassword }) => {
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

    const handleEdit = (player: Player) => {
        setEditingPlayerId(player.id);
        setPassword(player.password || '');
    };

    const handleSave = (playerId: string) => {
        onUpdatePassword(playerId, password);
        setEditingPlayerId(null);
        setPassword('');
    };

    const handleCancel = () => {
        setEditingPlayerId(null);
        setPassword('');
    };
    
    const toggleShowPassword = (playerId: string) => {
        setShowPasswordMap(prev => ({...prev, [playerId]: !prev[playerId]}));
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">Información de Usuarios</h2>
            <p className="text-gray-400 mb-6">Gestiona las contraseñas de acceso de los jugadores.</p>
            <Card className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-800/50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Jugador</th>
                            <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Contraseña</th>
                            <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {players.map((player: Player) => (
                            <tr key={player.id}>
                                <td className="p-4 flex items-center gap-3">
                                    <img src={player.photoUrl} alt={player.name} className="w-9 h-9 rounded-full" />
                                    <span className="font-medium text-white">{player.name}</span>
                                </td>
                                <td className="p-4">
                                    {editingPlayerId === player.id ? (
                                        <input
                                            type="text"
                                            value={password}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                            className="bg-gray-900 border border-cyan-500 rounded-md py-1 px-2 text-white w-full"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-300 font-mono">
                                                {showPasswordMap[player.id] ? player.password : '••••••••'}
                                            </span>
                                            <button onClick={() => toggleShowPassword(player.id)} className="text-xs text-gray-500 hover:text-white underline">
                                                {showPasswordMap[player.id] ? 'Ocultar' : 'Mostrar'}
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {editingPlayerId === player.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleSave(player.id)} className="px-3 py-1 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors">Guardar</button>
                                            <button onClick={handleCancel} className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors">Cancelar</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEdit(player)} title="Editar contraseña" className="p-2 text-gray-400 hover:text-yellow-400 rounded-md hover:bg-gray-700 transition-colors">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default UserManagementView;