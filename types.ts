
export interface Player {
  id: string;
  authUid?: string; // UID from Firebase Auth
  password?: string;
  name: string;
  lastName: string;
  nickname: string;
  idNumber: string;
  jerseyNumber: number;
  position: string;
  photoUrl: string;
  previousClub: string;
  observations: string;
  documents?: {
    dniFrontUrl?: string;
    dniBackUrl?: string;
    idPhotoUrl?: string;
  };
  personalInfo: {
    age: number;
    height: string;
    weight: string;
  };
  medicalInfo: {
    status: 'Activo' | 'Lesionado' | 'En Reposo';
    notes: string;
    treatments?: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
  parentInfo: {
    fatherNamePhone: string;
    motherNamePhone: string;
    parentEmail: string;
};
  // documents would be handled differently in a real app (e.g., storing URLs)
  // For this demo, we'll omit them from the type after form submission.
}

export interface EvaluationMetric {
  agility: number;  // e.g., Illinois Agility Test in seconds
  speed: number;    // e.g., 40-yard dash in seconds
  endurance: number;// e.g., VO2 max
  flexibility: number; // e.g., sit and reach test in cm
}

export interface PlayerEvaluation {
  id: string;
  playerId: string;
  date: string; // ISO 8601 format: "YYYY-MM-DD"
  metrics: EvaluationMetric;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  sets?: number;
  reps?: string;
  duration?: string;
}

export interface TrainingSession {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  warmup: Exercise[];
  mainExercises: Exercise[];
  cooldown: Exercise[];
}

export interface Match {
    id: string;
    date: string; // "YYYY-MM-DD"
    time: string; // "HH:MM" -> Match time
    opponent: string;
    venue: string;
    meetingPoint: string; // Meeting location
    meetingTime: string; // "HH:MM" -> Meeting time
    squad: {
        calledUp: string[]; // array of player IDs
        notCalledUp: string[]; // array of player IDs
    };
}

export type CalendarEventType = 'training' | 'match' | 'injury' | 'personal' | 'matchResult';

export interface CalendarEvent {
  id:string;
  date: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD" for multi-day events like injuries
  type: CalendarEventType;
  title: string; // General title for the event, e.g., "Entrenamiento de Resistencia", "Partido vs CF Ciudad", "Lesión: Álex López"
  time?: string;
  locationType?: 'home' | 'away';

  // Fields for 'match'
  opponent?: string;
  venue?: string;
  meetingPoint?: string;
  meetingTime?: string;
  squad?: {
    calledUp: string[];
    notCalledUp: string[];
  };

  // Fields for 'injury'
  playerId?: string; // For single-player events like an injury
  
  // Fields for 'personal'
  playerIds?: string[]; // For multi-player events like a personal absence

  // General fields
  reason?: string;

  // Fields for 'training'
  trainingSessionId?: string; // Optional: can link back to a full TrainingSession
  warmup?: Exercise[];
  mainExercises?: Exercise[];
  cooldown?: Exercise[];

  // Fields for 'matchResult'
  result?: string;
  scorers?: string[]; // Array of player IDs, allows for multiple goals
  assists?: string[]; // Array of player IDs
}
