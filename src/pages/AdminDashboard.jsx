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
                <h2 className="text-3xl font-bold text-center text-white drop-shadow-md mb-6">Admin Control Center</h2>

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
                        {/* Staging Area (Same as before) */}
                        <div className="bg-white p-6 rounded-xl shadow-lg mb-12 border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                                <Upload size={20} /> Quick Add / Import
                            </h3>
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
                            <h3 className="font-bold text-xl text-gray-700">Current Participants</h3>
                            <div className="flex gap-2">
                                <button onClick={fetchData} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /></button>
                                <button onClick={clearDatabase} className="px-4 py-2 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200">Reset All</button>
                            </div>
                        </div>
                        <div className="bg-white shadow rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 text-sm">
                                    <tr><th className="p-4">Name</th><th className="p-4">Phone</th><th className="p-4">Dept</th><th className="p-4">Status</th></tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {dbPlayers.map(p => (
                                        <tr key={p.id}>
                                            <td className="p-4 font-medium">{p.name}</td>
                                            <td className="p-4 text-gray-500">{p.phone}</td>
                                            <td className="p-4 text-gray-500">{p.department}</td>
                                            <td className="p-4">{p.is_chosen ? '✅ Match Found' : '⏳ Waiting'}</td>
                                        </tr>
                                    ))}
                                    {dbPlayers.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-400">Pool is empty</td></tr>}
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
                                                            {["General", "Sales", "Development", "HR", "Marketing", "Operations"].map(d => <option key={d} value={d}>{d}</option>)}
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
            </div>
        </div>
    );
};

export default AdminDashboard;
