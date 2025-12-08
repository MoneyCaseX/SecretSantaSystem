import React, { useState } from 'react';
import Header from '../components/Header';
import PlayerInput from '../components/PlayerInput';
import PlayerList from '../components/PlayerList';
import { Upload, Users, RefreshCw, Trash2, Database } from 'lucide-react';

const AdminDashboard = () => {
    const [players, setPlayers] = useState([]); // Local staging
    const [dbPlayers, setDbPlayers] = useState([]); // From DB
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDb, setIsLoadingDb] = useState(false);

    // Call Endpoints
    const fetchDbData = async () => {
        setIsLoadingDb(true);
        try {
            const res = await fetch('/.netlify/functions/get-participants');
            const data = await res.json();
            if (res.ok) {
                setDbPlayers(Array.isArray(data) ? data : []);
            } else {
                console.error("Fetch API error:", data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoadingDb(false);
        }
    };

    const initDatabase = async () => {
        if (!confirm("Initialize Table? This is usually done once.")) return;
        setIsSaving(true);
        try {
            const res = await fetch('/.netlify/functions/init-db');
            const d = await res.json();
            alert(d.message || d.error);
            fetchDbData();
        } catch (e) { alert(e); }
        setIsSaving(false);
    }

    React.useEffect(() => {
        fetchDbData();
    }, []);

    const clearDatabase = async () => {
        if (!window.confirm("⚠️ DANGER: This will DELETE ALL PLAYERS from Postgres and reset the game completely.")) return;

        setIsSaving(true);
        try {
            const res = await fetch('/.netlify/functions/reset-pool', { method: 'POST' });
            if (res.ok) {
                setDbPlayers([]);
                alert("Database cleared.");
            } else {
                alert("Error clearing");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddStaging = (player) => {
        // Validation logic similar to previous (local check only for immediate feedback)
        const pName = player.name.trim();
        const pPhone = player.phone ? player.phone.trim() : "";

        // Check Local Staging
        const nameExists = players.some(p => p.name.toLowerCase() === pName.toLowerCase());
        if (nameExists) { alert(`❌ Name "${pName}" already in staging.`); return; }

        setPlayers([...players, player]);
    };

    const handleImportCSV = (newPlayers) => {
        // Simple de-dupe
        setPlayers([...players, ...newPlayers]);
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
            const res = await fetch('/.netlify/functions/add-participants', {
                method: 'POST',
                body: JSON.stringify({ players: players })
            });
            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                setPlayers([]);
                fetchDbData();
            } else {
                alert("Error: " + data.error);
            }
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
                <h2 className="text-3xl font-bold text-center text-christmas-red mb-2">Participant Pool Manager (Neon DB)</h2>

                <div className="text-center mb-6">
                    <button onClick={initDatabase} className="text-xs text-gray-400 hover:text-gray-600 underline">
                        (First Run: Initialize Table)
                    </button>
                </div>

                {/* Staging Area */}
                <div className="bg-white p-6 rounded-xl shadow-lg mb-12 border border-blue-100">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <Upload size={20} /> 1. Add / Import Players
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
                                    {isSaving ? "Uploading..." : `Upload ${players.length} Players`}
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
                                    <th className="p-4 font-semibold">Is Chosen?</th>
                                    <th className="p-4 font-semibold">My Match</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {dbPlayers.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium">{p.name}</td>
                                        <td className="p-4 text-gray-500">{p.phone}</td>
                                        <td className="p-4 text-gray-500">{p.department}</td>
                                        <td className="p-4">
                                            {p.is_chosen ? <span className="text-green-600 font-bold">Taken</span> : <span className="text-gray-400">Avail</span>}
                                        </td>
                                        <td className="p-4">
                                            {p.my_santa_of_name ? <span className="text-blue-600 font-bold">➡️ {p.my_santa_of_name}</span> : <span className="text-yellow-600">-</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
