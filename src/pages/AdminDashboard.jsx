import React, { useState } from 'react';
import Header from '../components/Header';
import PlayerInput from '../components/PlayerInput';
import PlayerList from '../components/PlayerList';
import { Upload, Users, RefreshCw, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, writeBatch, doc, getDocs, deleteDoc, query, where, runTransaction } from 'firebase/firestore';

const AdminDashboard = () => {
    const [players, setPlayers] = useState([]); // Local staging
    const [dbPlayers, setDbPlayers] = useState([]); // From Firebase
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDb, setIsLoadingDb] = useState(false);

    // Fetch pool of participants
    const fetchDbData = async () => {
        setIsLoadingDb(true);
        try {
            const querySnapshot = await getDocs(collection(db, "participants"));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDbPlayers(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoadingDb(false);
        }
    };

    React.useEffect(() => {
        fetchDbData();
    }, []);

    const clearDatabase = async () => {
        if (!window.confirm("⚠️ DANGER: This will DELETE ALL PLAYERS and reset the game completely.")) return;

        setIsSaving(true);
        try {
            const querySnapshot = await getDocs(collection(db, "participants"));
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            setDbPlayers([]);
            alert("Database cleared. Ready for new season.");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddStaging = (player) => {
        // 1. Normalize inputs
        const pName = player.name.trim();
        const pPhone = player.phone ? player.phone.trim() : "";

        // 2. Check Name Duplication (Local & DB)
        const nameExists = players.some(p => p.name.toLowerCase() === pName.toLowerCase()) ||
            dbPlayers.some(p => p.name.toLowerCase() === pName.toLowerCase());

        if (nameExists) {
            alert(`❌ Duplicate Error:\nThe name "${pName}" is already registered in the system.`);
            return;
        }

        // 3. Check Phone Duplication (Local & DB)
        const phoneExists = players.some(p => p.phone === pPhone) ||
            dbPlayers.some(p => p.phone === pPhone);

        if (phoneExists && pPhone !== "") {
            alert(`❌ Duplicate Error:\nThe phone number "${pPhone}" is already assigned to another player.`);
            return;
        }

        setPlayers([...players, player]);
    };

    const handleImportCSV = (newPlayers) => {
        const errors = [];
        const validNewPlayers = [];
        const tempMergedList = [...dbPlayers, ...players, ...validNewPlayers]; // Helper to check against all

        newPlayers.forEach(p => {
            const pName = p.name ? p.name.trim() : "";
            const pPhone = p.phone ? p.phone.trim() : ""; // Ensure CSV maps phone/email correctly in PlayerInput

            if (!pName) return;

            // Check Name
            const nameExists = tempMergedList.some(existing => existing.name.toLowerCase() === pName.toLowerCase());
            if (nameExists) {
                errors.push(`Skipped "${pName}": Name duplicate.`);
                return;
            }

            // Check Phone
            if (pPhone) {
                const phoneExists = tempMergedList.some(existing => existing.phone === pPhone);
                if (phoneExists) {
                    errors.push(`Skipped "${pName}": Phone ${pPhone} duplicate.`);
                    return;
                }
            }

            validNewPlayers.push(p);
            tempMergedList.push(p); // Add to temp list for next iteration checks
        });

        if (errors.length > 0) {
            alert(`⚠️ Import Report:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...and more.' : ''}\n\n✅ Successfully added ${validNewPlayers.length} players.`);
        } else if (validNewPlayers.length > 0) {
            alert(`✅ Successfully imported ${validNewPlayers.length} unique players.`);
        }

        setPlayers([...players, ...validNewPlayers]);
    };

    const handleRemoveStaging = (index) => {
        const newP = [...players];
        newP.splice(index, 1);
        setPlayers(newP);
    };

    const uploadToPool = async () => {
        if (players.length === 0) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const participantsRef = collection(db, "participants");

            players.forEach(p => {
                const docRef = doc(participantsRef);
                // Schema for Live Draw
                batch.set(docRef, {
                    name: p.name.trim(),
                    phone: p.phone ? p.phone.trim() : "",
                    department: p.department || "General",
                    email: p.email || "",
                    isChosen: false, // Has anyone picked this person yet?
                    mySantaOf: null, // Who did THIS person pick? (Starts null)
                    mySantaOfName: null, // Redundant for easy reading
                    timestamp: new Date()
                });
            });

            await batch.commit();
            alert(`Successfully added ${players.length} participants to the pool!`);
            setPlayers([]); // Clear staging
            fetchDbData(); // Refresh table
        } catch (error) {
            console.error(error);
            alert("Error uploading: " + error.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold text-center text-christmas-red mb-2">Participant Pool Manager</h2>
                <p className="text-center text-gray-500 mb-8">Upload names here. Employees will draw their own Santas live.</p>

                {/* Staging Area */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-12 border border-blue-100">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <Upload size={20} /> 1. Add / Import Players (Staging)
                    </h3>

                    <PlayerInput
                        onAddPlayer={handleAddStaging}
                        onImportCSV={handleImportCSV}
                    />

                    {players.length > 0 && (
                        <div className="mt-6">
                            <PlayerList players={players} onRemovePlayer={handleRemoveStaging} />
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={uploadToPool}
                                    disabled={isSaving}
                                    className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-700 shadow-xl transition-transform hover:-translate-y-1"
                                >
                                    {isSaving ? "Uploading..." : `Upload ${players.length} Players to Pool`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Live Database View */}
                <div className="border-t pt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                            <Users /> Live Pool Status ({dbPlayers.length})
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={fetchDbData} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                                <RefreshCw size={16} className={isLoadingDb ? "animate-spin" : ""} /> Refresh
                            </button>
                            {dbPlayers.length > 0 && (
                                <button onClick={clearDatabase} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                    <Trash2 size={16} /> RESET POOL
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Phone</th>
                                    <th className="p-4 font-semibold">Dept</th>
                                    <th className="p-4 font-semibold">Is Chosen? (Passive)</th>
                                    <th className="p-4 font-semibold">Has Picked? (Active)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {dbPlayers.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium">{p.name}</td>
                                        <td className="p-4 text-gray-500">{p.phone}</td>
                                        <td className="p-4 text-gray-500">{p.department}</td>
                                        <td className="p-4">
                                            {p.isChosen ? <span className="text-green-600 font-bold">Yes (Taken)</span> : <span className="text-gray-400">Available</span>}
                                        </td>
                                        <td className="p-4">
                                            {p.mySantaOfName ? <span className="text-blue-600 font-bold">➡️ {p.mySantaOfName}</span> : <span className="text-yellow-600">Not yet</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {dbPlayers.length === 0 && <div className="p-8 text-center text-gray-400">No participants in the pool yet.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
