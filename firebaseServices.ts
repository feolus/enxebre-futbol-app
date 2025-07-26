import { db, storage } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { Player, PlayerEvaluation, CalendarEvent } from './types';

// Helper to convert file to base64
const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Helper to upload a base64 string to Firebase Storage and get URL
const uploadBase64 = async (base64: string, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, base64, 'data_url');
    return await getDownloadURL(snapshot.ref);
};

// --- Player Services ---

export const getPlayers = async (): Promise<Player[]> => {
    const playersCol = collection(db, "players");
    const playerSnapshot = await getDocs(playersCol);
    return playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
};

export const addPlayer = async (playerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<Player | null> => {
    try {
        let photoUrl = `https://picsum.photos/seed/p${Date.now()}/200/200`;
        const documents: { dniFrontUrl?: string; dniBackUrl?: string; idPhotoUrl?: string; } = {};

        const newPlayerId = `p${Date.now()}`;

        if (idPhotoFile) {
            const base64 = await convertFileToBase64(idPhotoFile);
            photoUrl = await uploadBase64(base64, `players/${newPlayerId}/idPhoto.jpg`);
            documents.idPhotoUrl = photoUrl;
        }
        if (dniFrontFile) {
            const base64 = await convertFileToBase64(dniFrontFile);
            documents.dniFrontUrl = await uploadBase64(base64, `players/${newPlayerId}/dniFront.jpg`);
        }
        if (dniBackFile) {
            const base64 = await convertFileToBase64(dniBackFile);
            documents.dniBackUrl = await uploadBase64(base64, `players/${newPlayerId}/dniBack.jpg`);
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

        const docRef = await addDoc(collection(db, "players"), playerToAdd);
        return { id: docRef.id, ...playerToAdd };
    } catch (e) {
        console.error("Error adding player: ", e);
        return null;
    }
};

export const updatePlayer = async (player: Player, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<Player | null> => {
    try {
        const playerRef = doc(db, "players", player.id);
        
        let photoUrl = player.photoUrl;
        const documents = { ...(player.documents || {}) };

        if (idPhotoFile) {
            const base64 = await convertFileToBase64(idPhotoFile);
            photoUrl = await uploadBase64(base64, `players/${player.id}/idPhoto.jpg`);
            documents.idPhotoUrl = photoUrl;
        }
        if (dniFrontFile) {
            const base64 = await convertFileToBase64(dniFrontFile);
            documents.dniFrontUrl = await uploadBase64(base64, `players/${player.id}/dniFront.jpg`);
        }
        if (dniBackFile) {
            const base64 = await convertFileToBase64(dniBackFile);
            documents.dniBackUrl = await uploadBase64(base64, `players/${player.id}/dniBack.jpg`);
        }
        
        const updatedData = { ...player, photoUrl, documents };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToSave } = updatedData;
        
        await updateDoc(playerRef, dataToSave);
        return updatedData;
    } catch (e) {
        console.error("Error updating player: ", e);
        return null;
    }
};

export const updatePlayerPassword = async (playerId: string, newPassword: string):Promise<boolean> => {
    try {
        const playerRef = doc(db, "players", playerId);
        await updateDoc(playerRef, { password: newPassword });
        return true;
    } catch (e) {
        console.error("Error updating password: ", e);
        return false;
    }
}

export const deletePlayer = async (playerId: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, "players", playerId));
        
        // Bonus: Delete associated evaluations
        const evalsQuery = query(collection(db, "evaluations"), where("playerId", "==", playerId));
        const evalSnapshot = await getDocs(evalsQuery);
        const batch = writeBatch(db);
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
    const evalsCol = collection(db, "evaluations");
    const evalSnapshot = await getDocs(evalsCol);
    return evalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlayerEvaluation));
};

export const addEvaluation = async (evaluation: Omit<PlayerEvaluation, 'id'>): Promise<PlayerEvaluation | null> => {
    try {
        const docRef = await addDoc(collection(db, "evaluations"), evaluation);
        return { id: docRef.id, ...evaluation };
    } catch (e) {
        console.error("Error adding evaluation: ", e);
        return null;
    }
};

// --- Calendar Event Services ---

export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
    const eventsCol = collection(db, "calendarEvents");
    const eventSnapshot = await getDocs(eventsCol);
    return eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
};

export const addCalendarEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> => {
    try {
        const docRef = await addDoc(collection(db, "calendarEvents"), event);
        return { id: docRef.id, ...event };
    } catch (e) {
        console.error("Error adding calendar event: ", e);
        return null;
    }
};

export const updateCalendarEvent = async (event: CalendarEvent): Promise<boolean> => {
    try {
        const eventRef = doc(db, "calendarEvents", event.id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataToSave } = event;
        await updateDoc(eventRef, dataToSave);
        return true;
    } catch (e) {
        console.error("Error updating calendar event: ", e);
        return false;
    }
};

export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, "calendarEvents", eventId));
        return true;
    } catch (e) {
        console.error("Error deleting calendar event: ", e);
        return false;
    }
};
