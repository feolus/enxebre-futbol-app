import { db, storage } from './firebaseConfig';
import type { Player, PlayerEvaluation, CalendarEvent } from './types';
import { mockPlayers, mockEvaluations, mockCalendarEvents } from './data/mockData';

// Helper to upload a file to Firebase Storage and get URL
const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = storage.ref(path);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
};

// --- Seeding Service ---
export const seedDatabase = async () => {
    console.log("Checking if seeding is needed...");
    const playersCol = db.collection("players");
    const playerSnapshot = await playersCol.limit(1).get();
    if (playerSnapshot.empty) {
        console.log("Database is empty. Seeding...");
        const batch = db.batch();

        const playerMappings: Record<string, string> = {};

        mockPlayers.forEach(player => {
            const docRef = db.collection("players").doc();
            playerMappings[player.id] = docRef.id;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...playerData } = player;
            batch.set(docRef, playerData);
        });

        mockEvaluations.forEach(evaluation => {
            const newPlayerId = playerMappings[evaluation.playerId];
            if (newPlayerId) {
                const docRef = db.collection("evaluations").doc();
                 // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, ...evalData } = evaluation;
                batch.set(docRef, { ...evalData, playerId: newPlayerId });
            }
        });

        mockCalendarEvents.forEach(event => {
            const docRef = db.collection("calendarEvents").doc();
            let updatedEvent = JSON.parse(JSON.stringify(event));
             // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...eventData } = updatedEvent;


            if (eventData.playerId && playerMappings[eventData.playerId]) {
                eventData.playerId = playerMappings[eventData.playerId];
            }
            if (eventData.playerIds) {
                eventData.playerIds = eventData.playerIds.map((pid: string) => playerMappings[pid] || pid);
            }
            if (eventData.squad) {
                eventData.squad.calledUp = eventData.squad.calledUp.map((pid: string) => playerMappings[pid] || pid);
                eventData.squad.notCalledUp = eventData.squad.notCalledUp.map((pid: string) => playerMappings[pid] || pid);
            }
             if (eventData.scorers) {
                eventData.scorers = eventData.scorers.map((pid: string) => playerMappings[pid] || pid);
            }
            if (eventData.assists) {
                eventData.assists = eventData.assists.map((pid: string) => playerMappings[pid] || pid);
            }

            batch.set(docRef, eventData);
        });

        await batch.commit();
        console.log("Database seeded successfully!");
    } else {
        console.log("Database already contains data. No seeding needed.");
    }
};


// --- Player Services ---

export const getPlayers = async (): Promise<Player[]> => {
    const playersCol = db.collection("players");
    const playerSnapshot = await playersCol.get();
    return playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
};

export const addPlayer = async (playerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<Player | null> => {
    try {
        const docRef = db.collection("players").doc();
        const newPlayerId = docRef.id;

        let photoUrl = `https://picsum.photos/seed/${newPlayerId}/200/200`;
        const documents: { dniFrontUrl?: string; dniBackUrl?: string; idPhotoUrl?: string; } = {};
        
        if (idPhotoFile) {
            photoUrl = await uploadFile(idPhotoFile, `players/${newPlayerId}/idPhoto.jpg`);
            documents.idPhotoUrl = photoUrl;
        }
        if (dniFrontFile) {
            documents.dniFrontUrl = await uploadFile(dniFrontFile, `players/${newPlayerId}/dniFront.jpg`);
        }
        if (dniBackFile) {
            documents.dniBackUrl = await uploadFile(dniBackFile, `players/${newPlayerId}/dniBack.jpg`);
        }

        const playerToAdd: Omit<Player, 'id'> = {
            photoUrl: photoUrl,
            documents: documents,
            name: `${playerData.name} ${playerData.lastName}`,
            lastName: playerData.lastName,
            nickname: playerData.nickname,
            idNumber: playerData.idNumber,
            jerseyNumber: parseInt(playerData.jerseyNumber, 10) || 0,
            position: playerData.position,
            previousClub: playerData.previousClub,
            observations: playerData.observations,
            password: playerData.password,
            personalInfo: {
                age: parseInt(playerData.age, 10) || 0,
                height: playerData.height,
                weight: playerData.weight,
            },
            medicalInfo: {
                status: 'Activo',
                notes: '',
                treatments: playerData.treatments,
            },
            contactInfo: {
                email: playerData.email,
                phone: playerData.phone,
            },
            parentInfo: {
                fatherNamePhone: playerData.fatherNamePhone,
                motherNamePhone: playerData.motherNamePhone,
                parentEmail: playerData.parentEmail,
            },
        };

        await docRef.set(playerToAdd);
        return { id: newPlayerId, ...playerToAdd };
    } catch (e) {
        console.error("Error adding player: ", e);
        return null;
    }
};

export const updatePlayer = async (player: Player, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<Player | null> => {
    try {
        const playerRef = db.collection("players").doc(player.id);
        
        let photoUrl = player.photoUrl;
        const documents = { ...(player.documents || {}) };

        if (idPhotoFile) {
            photoUrl = await uploadFile(idPhotoFile, `players/${player.id}/idPhoto.jpg`);
            documents.idPhotoUrl = photoUrl;
        }
        if (dniFrontFile) {
            documents.dniFrontUrl = await uploadFile(dniFrontFile, `players/${player.id}/dniFront.jpg`);
        }
        if (dniBackFile) {
            documents.dniBackUrl = await uploadFile(dniBackFile, `players/${player.id}/dniBack.jpg`);
        }
        
        const updatedData = { ...player, photoUrl, documents };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToSave } = updatedData;
        
        await playerRef.update(dataToSave);
        return updatedData;
    } catch (e) {
        console.error("Error updating player: ", e);
        return null;
    }
};

export const updatePlayerPassword = async (playerId: string, newPassword: string):Promise<boolean> => {
    try {
        const playerRef = db.collection("players").doc(playerId);
        await playerRef.update({ password: newPassword });
        return true;
    } catch (e) {
        console.error("Error updating password: ", e);
        return false;
    }
}

export const deletePlayer = async (playerId: string): Promise<boolean> => {
    try {
        await db.collection("players").doc(playerId).delete();
        
        const evalsQuery = db.collection("evaluations").where("playerId", "==", playerId);
        const evalSnapshot = await evalsQuery.get();
        const batch = db.batch();
        evalSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return true;
    } catch (e) {
        console.error("Error deleting player: ", e);
        return false;
    }
};

// --- Evaluation Services ---

export const getEvaluations = async (): Promise<PlayerEvaluation[]> => {
    const evalsCol = db.collection("evaluations");
    const evalSnapshot = await evalsCol.get();
    return evalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlayerEvaluation));
};

export const addEvaluation = async (evaluation: Omit<PlayerEvaluation, 'id'>): Promise<PlayerEvaluation | null> => {
    try {
        const docRef = await db.collection("evaluations").add(evaluation);
        return { id: docRef.id, ...evaluation };
    } catch (e) {
        console.error("Error adding evaluation: ", e);
        return null;
    }
};

// --- Calendar Event Services ---

export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
    const eventsCol = db.collection("calendarEvents");
    const eventSnapshot = await eventsCol.get();
    return eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
};

export const addCalendarEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> => {
    try {
        const docRef = await db.collection("calendarEvents").add(event);
        return { id: docRef.id, ...event };
    } catch (e) {
        console.error("Error adding calendar event: ", e);
        return null;
    }
};

export const updateCalendarEvent = async (event: CalendarEvent): Promise<boolean> => {
    try {
        const eventRef = db.collection("calendarEvents").doc(event.id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToSave } = event;
        await eventRef.update(dataToSave);
        return true;
    } catch (e) {
        console.error("Error updating calendar event: ", e);
        return false;
    }
};

export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
    try {
        await db.collection("calendarEvents").doc(eventId).delete();
        return true;
    } catch (e) {
        console.error("Error deleting calendar event: ", e);
        return false;
    }
};
