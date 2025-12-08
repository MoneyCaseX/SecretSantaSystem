import React, { useState } from 'react';
import Header from '../components/Header';
import PlayerInput from '../components/PlayerInput';
import PlayerList from '../components/PlayerList';
import Results from '../components/Results';
import { Wand2, Save } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';

const AdminDashboard = () => {
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [isGenerated, setIsGenerated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddPlayer = (player) => {
        setPlayers([...players, player]); // Expected player object: { name, phone, department, email }
    };

    const handleImportCSV = (newPlayers) => {
        const existingNames = new Set(players.map(p => p.name.toLowerCase()));
        const uniqueNewPlayers = newPlayers.filter(p => !existingNames.has(p.name.toLowerCase()));

        if (uniqueNewPlayers.length < newPlayers.length) {
            alert(`Imported ${uniqueNewPlayers.length} new players. Skipped duplicates.`);
        }
        setPlayers([...players, ...uniqueNewPlayers]);
    };

    const handleRemovePlayer = (index) => {
        const newPlayers = [...players];
        newPlayers.splice(index, 1);
        setPlayers(newPlayers);
    };

    const generateSecretSanta = () => {
        if (players.length < 2) {
            alert('You need at least 2 players to generate Secret Santa!');
            return;
        }

        const shuffled = [...players];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const newMatches = shuffled.map((player, i) => ({
            giver: player,
            receiver: shuffled[(i + 1) % shuffled.length],
            seen: false // Track if the giver has seen their result
        }));

        setMatches(newMatches);
        setIsGenerated(true);
    };

    const saveToFirebase = async () => {
        if (matches.length === 0) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);

            // We will store matches in a collection. 
            // To make it queryable by name/phone, we'll store each document with the giver's info.
            const matchesRef = collection(db, "assignments");

            matches.forEach((match) => {
                const docRef = doc(matchesRef); // Create a new doc ref
                batch.set(docRef, {
                    name: match.giver.name,
                    phone: match.giver.phone || "", // Ensure phone is stored
                    department: match.giver.department || "",
                    receiverName: match.receiver.name,
                    receiverDepartment: match.receiver.department || "",
                    seen: false,
                    timestamp: new Date()
                });
            });

            await batch.commit();
            alert("Success! Data saved to Firebase. Users can now log in.");
        } catch (error) {
            console.error("Error saving to Firebase: ", error);
            alert("Error saving data: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setIsGenerated(false);
        setMatches([]);
    };

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-center text-christmas-red mb-8">Admin Dashboard - Force Setup</h2>

                {!isGenerated ? (
                    <div className="flex flex-col items-center animate-fade-in-up">
                        <PlayerInput
                            onAddPlayer={handleAddPlayer}
                            onImportCSV={handleImportCSV}
                            isAdmin={true} // Hint to show extra fields if needed
                        />

                        <PlayerList
                            players={players}
                            onRemovePlayer={handleRemovePlayer}
                        />

                        {players.length > 0 && (
                            <button
                                onClick={generateSecretSanta}
                                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-christmas-green font-lg rounded-full hover:bg-green-700 hover:shadow-lg hover:-translate-y-1 focus:outline-none ring-offset-2 focus:ring-2 ring-christmas-gold"
                            >
                                <span className="mr-2 text-xl">Generate Secret Santa</span>
                                <Wand2 className="w-6 h-6 animate-pulse" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Results matches={matches} onReset={handleReset} />

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={saveToFirebase}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {isSaving ? "Saving..." : "Save to Database (Live)"}
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-8 py-3 bg-gray-500 text-white rounded-full font-bold shadow-lg hover:bg-gray-600 transition-all"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
