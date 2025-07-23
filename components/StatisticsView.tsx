import React, { useMemo } from 'react';
import type { Player, CalendarEvent } from '../types';
import Card from './Card';
import { HomeIcon, PlaneIcon } from './Icons';

interface StatisticsViewProps {
    events: CalendarEvent[];
    players: Player[];
}

type RankedPlayer = { player?: Player; count: number };

const StatisticsView: React.FC<StatisticsViewProps> = ({ events, players }) => {
    
    const rankings = useMemo(() => {
        const scorerCounts: { [key: string]: number } = {};
        const assistCounts: { [key: string]: number } = {};

        events.filter(e => e.type === 'matchResult').forEach((event: CalendarEvent) => {
            event.scorers?.forEach((playerId: string) => {
                scorerCounts[playerId] = (scorerCounts[playerId] || 0) + 1;
            });
            event.assists?.forEach((playerId: string) => {
                assistCounts[playerId] = (assistCounts[playerId] || 0) + 1;
            });
        });

        const getRankedList = (counts: { [key: string]: number }): RankedPlayer[] => {
            return Object.entries(counts)
                .map(([playerId, count]) => ({
                    player: players.find(p => p.id === playerId),
                    count
                }))
                .filter((item): item is RankedPlayer & { player: Player } => !!item.player)
                .sort((a, b) => b.count - a.count);
        };

        return {
            scorers: getRankedList(scorerCounts),
            assists: getRankedList(assistCounts)
        };
    }, [events, players]);
    
    const matchHistory = useMemo(() => {
      return events
        .filter(e => e.type === 'matchResult')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [events]);

    const getResultColor = (result?: string) => {
        if (!result) return 'text-gray-400';
        const [ourScore, theirScore] = result.split('-').map(Number);
        if (ourScore > theirScore) return 'text-green-400 bg-green-500/10';
        if (ourScore < theirScore) return 'text-red-400 bg-red-500/10';
        return 'text-yellow-400 bg-yellow-500/10';
    };
    
    interface RankingTableProps {
      title: string;
      data: RankedPlayer[];
      metricName: string;
    }
    const RankingTable: React.FC<RankingTableProps> = ({title, data, metricName}) => (
        <Card className="p-6 flex-1">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-2 text-sm font-semibold text-gray-400 uppercase w-10">#</th>
                            <th className="p-2 text-sm font-semibold text-gray-400 uppercase">Jugador</th>
                            <th className="p-2 text-sm font-semibold text-gray-400 uppercase text-right">{metricName}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(({player, count}, index) => (
                            <tr key={player?.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="p-2 font-bold text-lg text-gray-500">{index + 1}</td>
                                <td className="p-2 flex items-center gap-3">
                                    <img src={player?.photoUrl} alt={player?.name} className="w-9 h-9 rounded-full" />
                                    <span className="font-medium text-white">{player?.name}</span>
                                </td>
                                <td className="p-2 font-bold text-lg text-white text-right">{count}</td>
                            </tr>
                        ))}
                         {data.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center p-8 text-gray-500">No hay datos disponibles.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">Estadísticas del Equipo</h2>
            <div className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <RankingTable title="Tabla de Goleadores" data={rankings.scorers} metricName="Goles" />
                    <RankingTable title="Tabla de Asistentes" data={rankings.assists} metricName="Asistencias" />
                </div>
                <Card>
                    <h3 className="text-xl font-bold text-white p-6">Historial de Enfrentamientos</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800/50">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">L/V</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Oponente</th>
                                    <th className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-center">Resultado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {matchHistory.map((match: CalendarEvent) => (
                                    <tr key={match.id}>
                                        <td className="p-4 text-sm text-gray-300">{new Date(match.date + 'T00:00:00').toLocaleDateString('es-ES', {year: 'numeric', month: 'short', day: 'numeric'})}</td>
                                        <td className="p-4">
                                            {match.locationType === 'home' 
                                                ? <span title="Local"><HomeIcon className="w-5 h-5 text-cyan-400" /></span> 
                                                : <span title="Visitante"><PlaneIcon className="w-5 h-5 text-yellow-400" /></span>}
                                        </td>
                                        <td className="p-4 text-white font-medium">{match.opponent}</td>
                                        <td className={`p-4 text-center font-bold text-lg`}>
                                            <span className={`px-3 py-1 rounded-full text-sm ${getResultColor(match.result)}`}>
                                                {match.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {matchHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center p-8 text-gray-500">No hay partidos registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default StatisticsView;
