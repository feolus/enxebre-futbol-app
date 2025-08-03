

import { db, storage, auth, secondaryAuth } from './firebaseConfig';
import type { Player, PlayerEvaluation, CalendarEvent } from './types';

// Helper to upload a file to Firebase Storage and get URL
const uploadFile = async (file: File, path: string): Promise<string> => {
    // Operations are done by the primary user (coach) who is logged in.
    const storageRef = storage.ref(path);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
};

// --- Role Service ---
export const getUserRole = async (uid: string): Promise<{role: string, playerId?: string} | null> => {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
        return userDoc.data() as {role:string, playerId?: string};
    }
    return null;
}

// --- Seeding Service ---
export const seedDatabase = async () => {
    // Seed Auth users (coach and club) only once
    const flagRef = db.collection('internal').doc('seedingFlags');
    const flagDoc = await flagRef.get();

    if (!flagDoc.exists || !flagDoc.data()?.authSeeded) {
        console.log("Seeding auth users...");
        try {
            // Use secondaryAuth to prevent logging out any active user.
            
            // Create Coach User
            try {
                const coachCred = await secondaryAuth.createUserWithEmailAndPassword('coach@enxebre.com', 'coach123');
                if (coachCred.user) {
                    await db.collection('users').doc(coachCred.user.uid).set({ role: 'coach' });
                }
            } catch (error: unknown) {
                const code = (error as {code?: string}).code;
                if (code !== 'auth/email-already-in-use') console.error("Error creating coach:", error);
            }

            // Create Club User
            try {
                const clubCred = await secondaryAuth.createUserWithEmailAndPassword('club@enxebre.com', 'club1234');
                if (clubCred.user) {
                    await db.collection('users').doc(clubCred.user.uid).set({ role: 'club' });
                }
            } catch (error: unknown) {
                const code = (error as {code?: string}).code;
                if (code !== 'auth/email-already-in-use') console.error("Error creating club:", error);
            }
            
            await flagRef.set({ authSeeded: true }, { merge: true });
            console.log("Auth users seeded.");
            
            // Sign out any user from the secondary instance.
            if (secondaryAuth.currentUser) {
                await secondaryAuth.signOut();
            }

        } catch(error: unknown) {
            console.error("Error during auth seeding:", error);
             // Ensure we are signed out on error
            if (secondaryAuth.currentUser) await secondaryAuth.signOut();
        }
    }

    // Data seeding from mockData has been removed to start with a clean state.
};


// --- Player Services ---

export const getPlayers = async (): Promise<Player[]> => {
    const playersCol = db.collection("players");
    const playerSnapshot = await playersCol.get();
    return playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
};

export const addPlayer = async (playerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<Player> => {
    let userCredential;
    try {
        // 1. Create user in the secondary auth instance to avoid logging out the admin.
        userCredential = await secondaryAuth.createUserWithEmailAndPassword(playerData.email, playerData.password);
        const uid = userCredential.user?.uid;
        if (!uid) {
            throw new Error("Firebase Auth user creation failed, no UID returned.");
        }
        
        // 2. Prepare player document and upload files in parallel.
        const playerDocRef = db.collection("players").doc();
        const newPlayerId = playerDocRef.id;

        let photoUrl = `https://picsum.photos/seed/${newPlayerId}/200/200`;
        const documents: { dniFrontUrl?: string; dniBackUrl?: string; idPhotoUrl?: string; } = {};
        
        const uploadPromises = [];
        if (idPhotoFile) {
            uploadPromises.push(uploadFile(idPhotoFile, `players/${newPlayerId}/idPhoto.jpg`).then(url => ({ type: 'idPhoto', url })));
        }
        if (dniFrontFile) {
            uploadPromises.push(uploadFile(dniFrontFile, `players/${newPlayerId}/dniFront.jpg`).then(url => ({ type: 'dniFront', url })));
        }
        if (dniBackFile) {
            uploadPromises.push(uploadFile(dniBackFile, `players/${newPlayerId}/dniBack.jpg`).then(url => ({ type: 'dniBack', url })));
        }
        
        const uploadResults = await Promise.all(uploadPromises);
        
        uploadResults.forEach(result => {
            if (result.type === 'idPhoto') {
                photoUrl = result.url;
                documents.idPhotoUrl = result.url;
            } else if (result.type === 'dniFront') {
                documents.dniFrontUrl = result.url;
            } else if (result.type === 'dniBack') {
                documents.dniBackUrl = result.url;
            }
        });

        const playerToAdd: Omit<Player, 'id'> = {
            authUid: uid,
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

        // 3. Save player and user role data to Firestore using the coach's permissions.
        const userDocRef = db.collection('users').doc(uid);
        const batch = db.batch();
        batch.set(playerDocRef, playerToAdd);
        batch.set(userDocRef, { role: 'player', playerId: newPlayerId });
        await batch.commit();

        // 4. Clean up: sign out the new user from the secondary auth instance.
        if (secondaryAuth.currentUser) {
            await secondaryAuth.signOut();
        }

        // 5. Return the complete new player object.
        return { id: newPlayerId, ...playerToAdd };
    } catch (error: any) {
        // If user was created in Auth but something else failed, delete the auth user.
        if (userCredential && userCredential.user) {
            try {
                // To delete, we need to be signed in as that user in the secondary instance.
                // The user is already signed in after creation.
                await userCredential.user.delete();
                console.log("Successfully deleted partially created auth user.");
            } catch (deleteError) {
                console.error("Critical: Failed to delete partially created auth user. Manual cleanup may be required.", deleteError);
            }
        }
        // Always sign out from secondary auth on failure.
        if (secondaryAuth.currentUser) {
            await secondaryAuth.signOut();
        }
        console.error("Error during player addition transaction:", error);
        // Re-throw the original error so the UI can display a specific message
        throw error;
    }
};


export const updatePlayer = async (player: Player, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<Player> => {
    try {
        const playerRef = db.collection("players").doc(player.id);
        
        let photoUrl = player.photoUrl;
        const documents = { ...(player.documents || {}) };

        const uploadPromises = [];
        if (idPhotoFile) {
            uploadPromises.push(uploadFile(idPhotoFile, `players/${player.id}/idPhoto.jpg`).then(url => ({ type: 'idPhoto', url })));
        }
        if (dniFrontFile) {
            uploadPromises.push(uploadFile(dniFrontFile, `players/${player.id}/dniFront.jpg`).then(url => ({ type: 'dniFront', url })));
        }
        if (dniBackFile) {
            uploadPromises.push(uploadFile(dniBackFile, `players/${player.id}/dniBack.jpg`).then(url => ({ type: 'dniBack', url })));
        }

        const uploadResults = await Promise.all(uploadPromises);
        
        uploadResults.forEach(result => {
            if (result.type === 'idPhoto') {
                photoUrl = result.url;
                documents.idPhotoUrl = result.url;
            } else if (result.type === 'dniFront') {
                documents.dniFrontUrl = result.url;
            } else if (result.type === 'dniBack') {
                documents.dniBackUrl = result.url;
            }
        });
        
        const updatedData = { ...player, photoUrl, documents };
        const { id, ...dataToSave } = updatedData;
        
        await playerRef.update(dataToSave);
        return updatedData;
    } catch (e: unknown) {
        console.error("Error updating player: ", e);
        throw e; // Re-throw the error for the caller to handle
    }
};

// Password management is now handled by Firebase Auth.
// A coach/admin cannot change a user's password directly from the client SDK.
// This would require an admin backend (e.g., Firebase Functions).

export const deletePlayer = async (playerId: string): Promise<boolean> => {
    try {
        // Note: This does NOT delete the Firebase Auth user.
        // Deleting users requires admin privileges and should be done via a backend service
        // like Firebase Cloud Functions for security reasons.
        
        await db.collection("players").doc(playerId).delete();
        
        const evalsQuery = db.collection("evaluations").where("playerId", "==", playerId);
        const evalSnapshot = await evalsQuery.get();
        const batch = db.batch();
        evalSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return true;
    } catch (e: unknown) {
        console.error("Error deleting player's Firestore data: ", e);
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
    } catch (e: unknown) {
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
    } catch (e: unknown) {
        console.error("Error adding calendar event: ", e);
        return null;
    }
};

export const updateCalendarEvent = async (event: CalendarEvent): Promise<boolean> => {
    try {
        const eventRef = db.collection("calendarEvents").doc(event.id);
        const { id, ...dataToSave } = event;
        await eventRef.update(dataToSave);
        return true;
    } catch (e: unknown) {
        console.error("Error updating calendar event: ", e);
        return false;
    }
};

export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
    try {
        await db.collection("calendarEvents").doc(eventId).delete();
        return true;
    } catch (e: unknown) {
        console.error("Error deleting calendar event: ", e);
        return false;
    }
};
