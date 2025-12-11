import React, { useState } from 'react';
import Header from '../components/Header';
import PlayerInput from '../components/PlayerInput';
import PlayerList from '../components/PlayerList';
import { Upload, Users, RefreshCw, Trash2, CheckCircle, XCircle, Edit } from 'lucide-react';
import { DEPARTMENTS } from '../constants';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('pool'); // 'pool' | 'inbox'

    // Pool State
    const [players, setPlayers] = useState([]);
    const [dbPlayers, setDbPlayers] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Inbox State
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', department: '' });

    // Pool Edit State
    const [poolEditId, setPoolEditId] = useState(null);
    const [poolEditForm, setPoolEditForm] = useState({ name: '', phone: '', department: '' });

    // --- SETTINGS STATE ---
    const [gameStatus, setGameStatus] = useState('CLOSED');
    const [scheduleTime, setScheduleTime] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Fetch settings on load
    React.useEffect(() => {
        fetch('/.netlify/functions/get-game-status')
            .then(res => res.json())
            .then(data => {
                setGameStatus(data.status);
                setScheduleTime(data.startTime || '');
            });
    }, []);

    const saveSettings = async () => {
        setIsSavingSettings(true);
        await fetch('/.netlify/functions/set-game-status', {
            method: 'POST',
            body: JSON.stringify({ status: gameStatus, startTime: scheduleTime })
        });
        setIsSavingSettings(false);
        alert("Game Settings Updated!");
    };

    // --- FETCH DATA ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Parallel fetch
            const [poolRes, pendingRes] = await Promise.all([
                fetch('/.netlify/functions/get-participants'),
                fetch('/.netlify/functions/get-pending-requests')
            ]);

            const poolData = await poolRes.json();
            const pendingData = await pendingRes.json();

            setDbPlayers(Array.isArray(poolData) ? poolData : []);
            setPendingRequests(Array.isArray(pendingData) ? pendingData : []);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
        // Optional: Poll every 10s for new requests
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // --- MANAGE POOL ---
    const clearDatabase = async () => {
        if (!window.confirm("⚠️ DANGER: RESET ALL?")) return;
        setIsSaving(true);
        await fetch('/.netlify/functions/reset-pool', { method: 'POST' });
        fetchData();
        setIsSaving(false);
    };

    const uploadToPool = async () => {
        if (players.length === 0) return;
        setIsSaving(true);
        await fetch('/.netlify/functions/add-participants', {
            method: 'POST',
            body: JSON.stringify({ players })
        });
        setPlayers([]);
        fetchData();
        setIsSaving(false);
        alert("Uploaded!");
    }

    // --- MANAGE INBOX ---
    const handleProcessRequest = async (action, id, data = null) => {
        setIsLoading(true);
        try {
            const res = await fetch('/.netlify/functions/process-pending-request', {
                method: 'POST',
                body: JSON.stringify({ action, id, data })
            });
            if (res.ok) {
                if (action === 'UPDATE') setEditingId(null);
                fetchData(); // Refresh list
            } else {
                alert("Error processing request");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = (req) => {
        setEditingId(req.id);
        setEditForm({ name: req.name, phone: req.phone, department: req.department });
    };

    // --- MANAGE ACTIVE POOL EDIT/DELETE ---
    const startPoolEdit = (player) => {
        setPoolEditId(player.id);
        setPoolEditForm({ name: player.name, phone: player.phone, department: player.department });
    };

    const handleUpdateParticipant = async (id) => {
        setIsLoading(true);
        try {
            const res = await fetch('/.netlify/functions/update-participant', {
                method: 'POST',
                body: JSON.stringify({ id, ...poolEditForm })
            });
            if (res.ok) {
                setPoolEditId(null);
                fetchData();
            } else {
                alert("Error updating participant");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteParticipant = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
        setIsLoading(true);
        try {
            const res = await fetch('/.netlify/functions/delete-participant', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Error deleting participant");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOCAL STAGING ---
    const handleAddStaging = (player) => {
        // ... (Same validation logic as before) ...
        const pName = player.name.trim();
        const existing = players.find(p => p.name.toLowerCase() === pName.toLowerCase());
        if (existing) { alert("Already in staging"); return; }
        setPlayers([...players, { ...player, department: player.department || DEPARTMENTS[0] }]);
    };

    const handleImportCSV = (newP) => setPlayers([...players, ...newP]);
    const handleRemoveStaging = (i) => {
        const n = [...players]; n.splice(i, 1); setPlayers(n);
    };

    return (
        <div className="min-h-screen pb-20 bg-gradient-to-b from-christmas-red to-red-950">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-white drop-shadow-md">Admin Dashboard</h2>
                    {/* GAME CONTROLS */}
                    <div className="bg-white rounded-lg p-4 shadow-xl flex gap-4 items-center">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setGameStatus('OPEN')}
                                className={`px-4 py-2 rounded-md font-bold text-xs transition-all ${gameStatus === 'OPEN' ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                🟢 OPEN
                            </button>
                            <button
                                onClick={() => setGameStatus('CLOSED')}
                                className={`px-4 py-2 rounded-md font-bold text-xs transition-all ${gameStatus === 'CLOSED' ? 'bg-red-600 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                🔴 CLOSED
                            </button>
                            <button
                                onClick={() => setGameStatus('SCHEDULED')}
                                className={`px-4 py-2 rounded-md font-bold text-xs transition-all ${gameStatus === 'SCHEDULED' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                🕒 TIMER
                            </button>
                        </div>

                        {gameStatus === 'SCHEDULED' && (
                            <input
                                type="datetime-local"
                                value={scheduleTime}
                                onChange={e => setScheduleTime(e.target.value)}
                                className="px-3 py-2 border rounded-lg text-sm bg-gray-50"
                            />
                        )}

                        <button
                            onClick={saveSettings}
                            disabled={isSavingSettings}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-black transition-all"
                        >
                            {isSavingSettings ? '...' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1 rounded-xl shadow border border-gray-200 inline-flex">
                        <button
                            onClick={() => setActiveTab('pool')}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'pool' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Active Pool ({dbPlayers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Pending Requests
                            {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
                        </button>
                    </div>
                </div>

                {activeTab === 'pool' && (
                    <div className="animate-fade-in-up">
                        {/* Staging Area */}
                        <div className="bg-white p-6 rounded-xl shadow-lg mb-12 border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <Upload size={20} /> Bulk Import / Staging
                            </h3>
                            <div className="text-sm text-gray-500 mb-4">Use this area to upload CSVs or queue multiple users before saving to the database.</div>
                            <PlayerInput onAddPlayer={handleAddStaging} onImportCSV={handleImportCSV} />
                            {players.length > 0 && (
                                <div className="mt-6">
                                    <PlayerList players={players} onRemovePlayer={handleRemoveStaging} />
                                    <div className="flex justify-center mt-6">
                                        <button onClick={uploadToPool} disabled={isSaving} className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-blue-700">
                                            Upload {players.length} Players
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Live List */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-white">Current Participants</h3>
                            <div className="flex gap-2">
                                <button onClick={fetchData} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /></button>
                                <button onClick={clearDatabase} className="px-4 py-2 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 font-bold border border-red-200">Reset All</button>
                            </div>
                        </div>
                        <div className="bg-white shadow rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-sm">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Phone</th>
                                        <th className="p-4">Dept</th>
                                        <th className="p-4 text-center bg-blue-50 text-blue-900 border-l border-r border-white">➡️ Picked Who?</th>
                                        <th className="p-4 text-center bg-purple-50 text-purple-900 border-r border-white">⬅️ Picked By?</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {dbPlayers.map(p => {
                                        // Calculate who picked this person
                                        const secretSanta = dbPlayers.find(giver => giver.my_santa_of_id === p.id);

                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-bold text-gray-800">{p.name}</td>
                                                <td className="p-4 text-gray-500">{p.phone}</td>
                                                <td className="p-4 text-gray-500">{p.department}</td>

                                                {/* Who they picked */}
                                                <td className="p-4 text-center border-l border-r border-gray-100 bg-blue-50/30">
                                                    {p.my_santa_of_id ? (
                                                        <span className="font-bold text-blue-700">{p.my_santa_of_name}</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">- Not yet -</span>
                                                    )}
                                                </td>

                                                {/* Who picked them */}
                                                <td className="p-4 text-center border-r border-gray-100 bg-purple-50/30">
                                                    {secretSanta ? (
                                                        <span className="font-bold text-purple-700">{secretSanta.name}</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">- Not yet -</span>
                                                    )}
                                                </td>

                                                <td className="p-4 text-center">
                                                    {(p.my_santa_of_id && p.is_chosen) ?
                                                        <span className="text-green-600 font-bold text-xs">✅ Complete</span> :
                                                        <span className="text-orange-400 font-bold text-xs">⏳ In Progress</span>
                                                    }
                                                </td>
                                                <td className="p-4 text-right">
                                                    {poolEditId === p.id ? (
                                                        <div className="flex flex-col gap-2 bg-yellow-50 p-3 rounded border border-yellow-200 absolute right-10 mt-[-20px] shadow-lg z-10 w-64">
                                                            <div className="font-bold text-xs text-gray-600 mb-1">Edit Participant</div>
                                                            <input className="border p-2 rounded text-sm w-full mb-1" value={poolEditForm.name} onChange={e => setPoolEditForm({ ...poolEditForm, name: e.target.value })} placeholder="Name" />
                                                            <input className="border p-2 rounded text-sm w-full mb-1" value={poolEditForm.phone} onChange={e => setPoolEditForm({ ...poolEditForm, phone: e.target.value })} placeholder="Phone" />
                                                            <select className="border p-2 rounded text-sm w-full mb-1" value={poolEditForm.department} onChange={e => setPoolEditForm({ ...poolEditForm, department: e.target.value })}>
                                                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                            </select>
                                                            <div className="flex justify-end gap-2 mt-2">
                                                                <button onClick={() => setPoolEditId(null)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300">Cancel</button>
                                                                <button onClick={() => handleUpdateParticipant(p.id)} className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-bold">Save</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => startPoolEdit(p)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all border border-blue-200" title="Edit">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => handleDeleteParticipant(p.id, p.name)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all border border-red-200" title="Delete">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {dbPlayers.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Pool is empty</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'inbox' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-gray-700">Registration Requests</h3>
                            <button onClick={fetchData} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /></button>
                        </div>

                        <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
                            <table className="w-full text-left">
                                <thead className="bg-blue-50 text-blue-900 text-sm">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Phone</th>
                                        <th className="p-4">Dept</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {pendingRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                            {editingId === req.id ? (
                                                // EDIT MODE
                                                <>
                                                    <td className="p-3">
                                                        <input className="border p-2 rounded w-full" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                                    </td>
                                                    <td className="p-3">
                                                        <input className="border p-2 rounded w-full" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                                    </td>
                                                    <td className="p-3">
                                                        <select className="border p-2 rounded w-full" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
                                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-3 text-right space-x-2">
                                                        <button onClick={() => handleProcessRequest('UPDATE', req.id, editForm)} className="text-green-600 font-bold hover:underline">Save</button>
                                                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">Cancel</button>
                                                    </td>
                                                </>
                                            ) : (
                                                // VIEW MODE
                                                <>
                                                    <td className="p-4 font-bold text-gray-800">{req.name}</td>
                                                    <td className="p-4 text-gray-600">{req.phone}</td>
                                                    <td className="p-4 text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{req.department}</span></td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleProcessRequest('APPROVE', req.id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-bold transition-all"
                                                            >
                                                                <CheckCircle size={14} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => startEdit(req)}
                                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => { if (confirm("Reject this request?")) handleProcessRequest('REJECT', req.id) }}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                                title="Discard"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {pendingRequests.length === 0 && (
                                        <tr><td colSpan="4" className="p-12 text-center text-gray-400 bg-gray-50">No pending requests. Check back later!</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ADD PARTICIPANT MODAL */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-fade-in-up">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Add New Participant</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        placeholder="e.g. John Doe"
                                        value={addForm.name}
                                        onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                        placeholder="e.g. 01xxxxxxxxx"
                                        value={addForm.phone}
                                        onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                                        value={addForm.department}
                                        onChange={e => setAddForm({ ...addForm, department: e.target.value })}
                                    >
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDirectAdd}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'Adding...' : 'Add Participant'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
