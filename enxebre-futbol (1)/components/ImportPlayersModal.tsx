import React, { useState } from 'react';
import Card from './Card';
import type { Player } from '../types';

interface ImportPlayersModalProps {
  onClose: () => void;
  onImport: (newPlayersData: Partial<Player>[]) => Promise<void>;
}

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1L1wc40T70_MH1VSptiT5aCBQl3meTW4GTY4Yl1Gv1Jc/edit?usp=sharing';

// Robust parser for CSV, TSV, or semicolon-separated values
const parseDelimitedText = (text: string): Record<string, string>[] => {
    const lines = text.trim().replace(/\r/g, "").split('\n');
    if (lines.length < 2) {
      throw new Error("El archivo está vacío o solo contiene la cabecera.");
    }

    // Detect separator by counting occurrences in the header
    const headerLine = lines[0];
    let separator = ',';
    if (headerLine.split('\t').length > headerLine.split(',').length) separator = '\t';
    else if (headerLine.split(';').length > headerLine.split(',').length) separator = ';';

    const buildRegex = (sep: string) => {
      // This regex handles quoted fields, including escaped quotes ("").
      return new RegExp(`("((?:[^"]|"")*)"|([^${sep}]*))(?:${sep}|$)`, 'g');
    };
    
    const regex = buildRegex(separator);

    const parseLine = (line: string): string[] => {
      const fields: string[] = [];
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(line))) {
        let value = match[2] !== undefined ? match[2].replace(/""/g, '"') : (match[3] || '');
        fields.push(value.trim());
        if (regex.lastIndex >= line.length) break;
      }
      return fields;
    };

    const headers = parseLine(lines[0]);
    if (headers[headers.length-1] === '' && lines[0].endsWith(separator)) {
        headers.pop();
    }

    const result: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = parseLine(line);
        if (headers.length > values.length) {
            while(headers.length > values.length) values.push('');
        }

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (header) {
            row[header] = values[index] || '';
          }
        });

        if (Object.values(row).some(val => val !== '')) {
            result.push(row);
        }
    }
    return result;
}


const ImportPlayersModal: React.FC<ImportPlayersModalProps> = ({ onClose, onImport }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImportClick = async () => {
    setIsLoading(true);
    setError(null);

    // Header names from the Google Sheet
    const columnMapping = {
        fullName: 'Nombre y apellidos del jugador',
        birthDate: 'Fecha de nacimiento',
        phone: 'N.º de  teléfono del jugador',
        idNumber: 'N.º D.N.I. del Jugador',
        previousClub: 'Club en el que milito la temporada pasada',
        position: 'POSICION EN LA QUE JUGO LA TEMPORADA PASADA',
        jerseyNumber: 'N.º DE DORSAL QUE LE GUSTARIA LLEVAR EN LA CAMISETA',
        nickname: 'NOMBRE O NICK PARA LA CAMISETA',
        email: 'CORREO ELECTRONICO DEL JUGADOR',
        motherNamePhone: 'NOMBRE DE LA MADRE Y N.º DE TELEFONO',
        fatherNamePhone: 'NOMBRE DEL PADRE Y N.º DE TELEFONO',
        parentEmail: 'CORREO ELECTRONICO DE UNO DE LOS TUTORES/PADRES PARA LA FIRMA DE LA FICHA SI FUERA NECESARIO',
        treatments: 'ENFERMEDADES, ALERGIAS O TRATAMIENTOS DEL JUGADOR',
        observations: 'Observaciones: cualquier información que nos queráis hacer llegar los padres a los entrenadores: ej. un día llega mas tarde al entrenamiento por que tiene clases...',
    };
    
    const requiredHeadersFromSheet = [
        columnMapping.fullName,
        columnMapping.email,
    ];

    const calculateAge = (birthDateString: string | undefined): number => {
        if (!birthDateString) return 0;
        // Example format from sheet: 13/05/2011
        const parts = birthDateString.split('/');
        if (parts.length !== 3) return 0;

        let year = parseInt(parts[2], 10);
        if (year < 100) {
            year += 2000;
        }
        
        const birthDate = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (isNaN(birthDate.getTime())) return 0;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? age : 0;
    };


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
      const parsedData = parseDelimitedText(csvText);

      if (parsedData.length > 0) {
        const headers = Object.keys(parsedData[0]);
        const missingHeaders = requiredHeadersFromSheet.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          throw new Error(`Faltan las siguientes columnas obligatorias en la hoja de cálculo: ${missingHeaders.join(', ')}`);
        }
      } else {
         throw new Error("No se encontraron datos de jugadores en la hoja de cálculo.");
      }

      const players: Partial<Player>[] = parsedData.map(row => {
        const fullName = row[columnMapping.fullName] || '';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ');

        return {
            name: firstName,
            lastName: lastName,
            nickname: row[columnMapping.nickname],
            idNumber: row[columnMapping.idNumber],
            jerseyNumber: parseInt(row[columnMapping.jerseyNumber], 10) || 0,
            position: row[columnMapping.position],
            previousClub: row[columnMapping.previousClub],
            observations: row[columnMapping.observations],
            personalInfo: {
              age: calculateAge(row[columnMapping.birthDate]),
              height: '', // Not in sheet
              weight: '', // Not in sheet
            },
            medicalInfo: {
                status: 'Activo' as const,
                notes: '',
                treatments: row[columnMapping.treatments]
            },
            contactInfo: {
              email: row[columnMapping.email],
              phone: row[columnMapping.phone],
            },
            parentInfo: {
              fatherNamePhone: row[columnMapping.fatherNamePhone],
              motherNamePhone: row[columnMapping.motherNamePhone],
              parentEmail: row[columnMapping.parentEmail],
            },
        };
      }).filter(p => p.name && p.contactInfo?.email); // Filter out empty or invalid rows
      
      if (players.length > 0) {
        await onImport(players);
        onClose();
      } else {
        throw new Error("No se encontraron jugadores válidos en el archivo. Verifica que las filas tengan nombre y email.");
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