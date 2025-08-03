
import { db, storage, auth } from './firebaseConfig';
import type { Player, PlayerEvaluation, CalendarEvent } from './types';
import { mockPlayers, mockEvaluations, mockCalendarEvents } from './data/mockData';

// Helper to upload a file to Firebase Storage and get URL
const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = storage.ref(path);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
};

// --- Role Service ---
export const getUserRole = async (uid: string): Promise<{role: string, playerId?: string} | null> => {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
        return userDoc.data() as {role: string, playerId?: string};
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
            const originalUser = auth.currentUser; // Store original user if any
            
            // Create Coach User
            try {
                const coachUser = await auth.createUserWithEmailAndPassword('coach@enxebre.com', 'coach123');
                if (coachUser.user) {
                    await db.collection('users').doc(coachUser.user.uid).set({ role: 'coach' });
                }
            } catch (error: unknown) {
                const code = (error as {code?: string}).code;
                if (code !== 'auth/email-already-in-use') console.error("Error creating coach:", error);
            }

            // Create Club User
            try {
                const clubUser = await auth.createUserWithEmailAndPassword('club@enxebre.com', 'club1234');
                if (clubUser.user) {
                    await db.collection('users').doc(clubUser.user.uid).set({ role: 'club' });
                }
            } catch (error: unknown) {
                const code = (error as {code?: string}).code;
                if (code !== 'auth/email-already-in-use') console.error("Error creating club:", error);
            }
            
            await flagRef.set({ authSeeded: true });
            console.log("Auth users seeded.");
            
            // Sign out the last created user and restore the original session if there was one.
            if (originalUser) {
                await auth.signInWithCustomToken(await originalUser.getIdToken());
            } else if(auth.currentUser) {
                await auth.signOut();
            }

        } catch(error: unknown) {
            console.error("Error during auth seeding:", error);
        }
    }

    // Seed Firestore data
    const playersCol = db.collection("players");
    const playerSnapshot = await playersCol.limit(1).get();
    if (playerSnapshot.empty) {
        console.log("Database is empty. Seeding Firestore data...");
        const batch = db.batch();

        const playerMappings: Record<string, string> = {};

        // Seed players without auth accounts
        mockPlayers.forEach(player => {
            const docRef = db.collection("players").doc();
            playerMappings[player.id] = docRef.id;
            const { id, ...playerData } = player;
            batch.set(docRef, playerData);
        });

        // Seed evaluations and events with mappings
        mockEvaluations.forEach(evaluation => {
            const newPlayerId = playerMappings[evaluation.playerId];
            if (newPlayerId) {
                const docRef = db.collection("evaluations").doc();
                batch.set(docRef, { ...evaluation, id: docRef.id, playerId: newPlayerId });
            }
        });

        mockCalendarEvents.forEach(event => {
            const docRef = db.collection("calendarEvents").doc();
            const eventData = JSON.parse(JSON.stringify(event));
            
            if (eventData.playerId && playerMappings[eventData.playerId]) {
                eventData.playerId = playerMappings[eventData.playerId];
            }
            if (eventData.playerIds) {
                eventData.playerIds = eventData.playerIds.map((pid: string) => playerMappings[pid] || pid);
            }
            if (eventData.squad) {
                if (eventData.squad.calledUp) {
                    eventData.squad.calledUp = eventData.squad.calledUp.map((pid: string) => playerMappings[pid] || pid);
                }
                if (eventData.squad.notCalledUp) {
                    eventData.squad.notCalledUp = eventData.squad.notCalledUp.map((pid: string) => playerMappings[pid] || pid);
                }
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
        console.log("Firestore Database seeded successfully!");
    }
};


// --- Player Services ---

export const getPlayers = async (): Promise<Player[]> => {
    const playersCol = db.collection("players");
    const playerSnapshot = await playersCol.get();
    return playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
};

export const addPlayer = async (playerData: any, idPhotoFile: File | null, dniFrontFile: File | null, dniBackFile: File | null): Promise<Player | null> => {
    const originalUser = auth.currentUser; // Store the currently logged-in admin/coach
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(playerData.email, playerData.password);
        const uid = userCredential.user?.uid;
        
        if (!uid) throw new Error("Firebase Auth user creation failed.");
        
        const playerDocRef = db.collection("players").doc();
        const newPlayerId = playerDocRef.id;

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

        await playerDocRef.set(playerToAdd);
        await db.collection('users').doc(uid).set({ role: 'player', playerId: newPlayerId });

        // Log out the newly created user and restore the admin's session
        if (originalUser) {
             // This part is tricky without a backend. For now, we sign out and let admin re-login.
             // A better UX would be to use custom tokens, but that requires Firebase Functions.
             await auth.signOut();
             alert("Jugador creado. Por favor, vuelve a iniciar sesión para continuar.");
        } else {
            await auth.signOut();
        }

        return { id: newPlayerId, ...playerToAdd };
    } catch (e: unknown) {
        console.error("Error adding player: ", e);
         // If player creation fails, ensure we are logged back in as the original user if they existed
        if(originalUser && auth.currentUser?.uid !== originalUser.uid) {
            await auth.signOut(); // Sign out failed attempt
            // Re-login logic would be needed here. Best to alert user.
        }
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
        const { id, ...dataToSave } = updatedData;
        
        await playerRef.update(dataToSave);
        return updatedData;
    } catch (e: unknown) {
        console.error("Error updating player: ", e);
        return null;
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