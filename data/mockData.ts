import type { Player, PlayerEvaluation, TrainingSession, CalendarEvent } from '../types';

// The mock data has been cleared to provide a clean slate for the application.
// The app will now start with no pre-populated examples.

export const mockPlayers: Player[] = [];

export const mockEvaluations: PlayerEvaluation[] = [];

export const mockTrainingSessions: TrainingSession[] = [];

export const mockCalendarEvents: Omit<CalendarEvent, 'id'>[] = [];
