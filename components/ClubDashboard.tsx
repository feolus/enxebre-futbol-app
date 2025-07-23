import React, { useState, useMemo } from 'react';
import type { Player, CalendarEvent } from '../types';
import Card from './Card';
import { DownloadIcon } from './Icons';

interface ClubDashboardProps {
  players: Player[];
  calendarEvents: CalendarEvent[];
}

const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ClubDashboard: React.FC<ClubDashboardProps> = ({ players, calendarEvents }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { playerAttendanceInfo, totalActivities } = useMemo(() => {
    const attendanceInfo: Record<string, { attendanceCount: number; attendancePercentage: number }> = {};
    const activityDates = new Set(
        calendarEvents.filter(e => ['training', 'match', 'matchResult'].includes(e.type)).map(e => e.date)
    );
    const totalActs = activityDates.size;

    players.forEach((p) => {
        let absenceCount = 0;
        calendarEvents.forEach((event) => {
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
        
        const attendanceCount = totalActs > 0 ? totalActs - absenceCount : 0;
        const attendancePercentage = totalActs > 0 ? (attendanceCount / totalActs) * 100 : 100;
        
        attendanceInfo[p.id] = {
            attendanceCount,
            attendancePercentage
        };
    });
    return { playerAttendanceInfo: attendanceInfo, totalActivities: totalActs };
  }, [players, calendarEvents]);


  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">Vista General del Club</h2>
        <p className="text-gray-400 mt-1">Resumen de la plantilla y estado de los jugadores.</p>
      </div>
      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Jugador
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                Asistencia
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Email Jugador
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Contacto Padres
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Documentos
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {players.map((player) => {
              const attendanceInfo = playerAttendanceInfo[player.id] || { attendanceCount: 0, attendancePercentage: 100 };
              return (
              <tr key={player.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full" src={player.photoUrl} alt={player.name} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{player.name}</div>
                      <div className="text-sm text-gray-400">#{player.jerseyNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold text-white">
                        {`${attendanceInfo.attendanceCount}/${totalActivities}`}
                      </span>
                      <div className="w-20 bg-gray-700 rounded-full h-2" title={`${attendanceInfo.attendancePercentage.toFixed(0)}% de asistencia`}>
                          <div
                              className="bg-cyan-400 h-2 rounded-full"
                              style={{ width: `${attendanceInfo.attendancePercentage}%` }}
                          ></div>
                      </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.contactInfo.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  <div className="text-gray-300">{player.parentInfo.parentEmail}</div>
                  <div>{player.parentInfo.fatherNamePhone}</div>
                  <div>{player.parentInfo.motherNamePhone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="relative inline-block text-left">
                    <div>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(openDropdown === player.id ? null : player.id)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-600 shadow-sm px-3 py-2 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                        id={`menu-button-${player.id}`}
                        aria-expanded={openDropdown === player.id}
                        aria-haspopup="true"
                      >
                         <DownloadIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {openDropdown === player.id && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5 z-10"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby={`menu-button-${player.id}`}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <div className="py-1" role="none">
                          <a href={player.documents?.dniFrontUrl || '#'} download className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white" role="menuitem">
                            DNI (Frente)
                          </a>
                          <a href={player.documents?.dniBackUrl || '#'} download className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white" role="menuitem">
                            DNI (Dorso)
                          </a>
                          <a href={player.documents?.idPhotoUrl || '#'} download className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white" role="menuitem">
                            Foto Identificación
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ClubDashboard;
