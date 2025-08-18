import React, { useState } from 'react';
import Card from './Card';
import type { Player } from '../types';

interface ImportPlayersModalProps {
  onClose: () => void;
  onImport: (newPlayersData: Partial<Player>[]) => Promise<void>;
}

const requiredHeaders = ['name', 'lastName', 'email', 'jerseyNumber', 'position'];
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1L1wc40T70_MH1VSptiT5aCBQl3meTW4GTY4Yl1Gv1Jc/edit?usp=sharing';


const ImportPlayersModal: React.FC<ImportPlayersModalProps> = ({ onClose, onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analizador de CSV robusto que maneja comas entre comillas
  const parseCSV = (csvText: string): Record<string, string>[] => {
    const lines = csvText.trim().split(/\r\n|\n/);
    if (lines.length < 2) {
      throw new Error("El archivo CSV está vacío o solo contiene la cabecera.");
    }
    const headers = lines[0].split(',').map(h => h.trim());
    
    const result: Record<string, string>[] = [];
    // Regex para manejar campos entre comillas, incluyendo comas y comillas dobles escapadas dentro de ellos.
    const regex = /("((?:[^"]|"")*)"|([^,]*))(?:,|$)/g;

    for (let i = 1; i < lines.length; i++) {
        const row: Record<string, string> = {};
        let match;
        let headerIndex = 0;
        let line = lines[i];

        if (!line.trim()) continue; // Omitir líneas vacías

        regex.lastIndex = 0;
        
        while ((match = regex.exec(line)) !== null && headerIndex < headers.length) {
            // match[2] es el contenido de un campo entrecomillado (eliminamos las comillas dobles escapadas)
            // match[3] es el contenido de un campo no entrecomillado
            let value = match[2] !== undefined ? match[2].replace(/""/g, '"') : (match[3] || '');
            row[headers[headerIndex]] = value.trim();
            headerIndex++;

            if (regex.lastIndex >= line.length) break;
        }
        
        if(Object.values(row).some(val => val !== '')) {
            result.push(row);
        }
    }
    return result;
  }

  const handleImportClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sheetIdMatch = SPREADSHEET_URL.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        throw new Error("La URL de la hoja de cálculo configurada no es válida.");
      }
      const sheetId = sheetIdMatch[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error("No se pudo acceder a la hoja de cálculo. Asegúrate de que está publicada en la web.");
      }
      const csvText = await response.text();
      const parsedData = parseCSV(csvText);

      if (parsedData.length > 0) {
        const headers = Object.keys(parsedData[0]);
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          throw new Error(`Faltan las siguientes columnas obligatorias: ${missingHeaders.join(', ')}`);
        }
      }

      const players: Partial<Player>[] = parsedData.map(playerObject => ({
        name: playerObject.name,
        lastName: playerObject.lastName,
        nickname: playerObject.nickname,
        idNumber: playerObject.idNumber,
        jerseyNumber: parseInt(playerObject.jerseyNumber, 10) || 0,
        position: playerObject.position,
        previousClub: playerObject.previousClub,
        observations: playerObject.observations,
        personalInfo: {
          age: parseInt(playerObject.age, 10) || 0,
          height: playerObject.height,
          weight: playerObject.weight,
        },
        medicalInfo: {
            status: 'Activo',
            notes: '',
            treatments: playerObject.treatments
        },
        contactInfo: {
          email: playerObject.email,
          phone: playerObject.phone,
        },
        parentInfo: {
          fatherNamePhone: playerObject.fatherNamePhone,
          motherNamePhone: playerObject.motherNamePhone,
          parentEmail: playerObject.parentEmail,
        },
      }));
      
      if (players.length > 0) {
        await onImport(players);
        onClose();
      } else {
        throw new Error("No se encontraron jugadores en el archivo.");
      }

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Confirmar Importación de Jugadores</h3>
          <p className="text-sm text-gray-300">
            Esto importará los datos de la hoja de cálculo de Google configurada. Los jugadores existentes no se modificarán. Los nuevos jugadores se añadirán al equipo.
          </p>
           <p className="text-xs text-gray-400">
            Fuente: <a href={SPREADSHEET_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all">{SPREADSHEET_URL}</a>
          </p>
          
          {error && <p className="text-sm text-red-400 text-center py-2 bg-red-500/10 rounded">{error}</p>}

          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50">Cancelar</button>
            <button onClick={handleImportClick} disabled={isLoading} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
              {isLoading ? 'Importando...' : 'Confirmar e Importar'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportPlayersModal;
