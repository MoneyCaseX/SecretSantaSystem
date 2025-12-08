import React, { useState } from 'react';
import Header from '../components/Header';
import { Search, Gift, AlertCircle, Building2 } from 'lucide-react';

const DEPARTMENTS = [
    "Development", "Sales", "Marketing", "HR", "Accounting", "Management", "Operations", "General"
];

const UserPortal = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');

    const [status, setStatus] = useState('idle');
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleDraw = async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim() || !department) return;

        setStatus('checking');
        setErrorMsg('');

        try {
            const res = await fetch('/.netlify/functions/draw-santa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phone.trim(),
                    department: department
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.status === 'SUCCESS' || data.status === 'ALREADY_DONE') {
                    setResult(data.result);
                    setStatus(data.status === 'ALREADY_DONE' ? 'already_done' : 'success');
                } else {
                    setStatus('error');
                    setErrorMsg("Unknown API response status");
                }
            } else {
                if (res.status === 404) {
                    setStatus('not_found');
                } else if (res.status === 409 && data.error === 'CONCURRENCY_RETRY') {
                    // Auto retry once? For now just tell user.
                    setStatus('error');
                    setErrorMsg("High traffic! Please try clicking again immediately.");
                } else {
                    setStatus('error');
                    setErrorMsg(data.error || "Server Error");
                }
            }

        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMsg("Connection Error. Try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-christmas-gold/20">

                    <div className="bg-christmas-red p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/snow.png')] opacity-20"></div>
                        <h1 className="text-3xl font-black text-white mb-2 font-serif tracking-wider drop-shadow-md">
                            SECRET SANTA
                        </h1>
                        <p className="text-red-100 font-medium tracking-widest uppercase text-xs">
                            Egypt Express Travel Edition
                        </p>
                    </div>

                    <div className="p-8">
                        {/* INPUT FORM */}
                        {(status === 'idle' || status === 'error' || status === 'not_found') && (
                            <form onSubmit={handleDraw} className="space-y-5">
                                <p className="text-gray-600 text-center mb-6">
                                    Identifiy yourself to draw your match!
                                </p>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 ml-1">Your Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full Name as registered"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-christmas-red focus:ring-4 focus:ring-red-50 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 ml-1">Your Phone</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Mobile Number"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-christmas-red focus:ring-4 focus:ring-red-50 outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 ml-1">Your Department</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-christmas-red focus:ring-4 focus:ring-red-50 outline-none appearance-none bg-white"
                                            required
                                        >
                                            <option value="">Select Department...</option>
                                            {DEPARTMENTS.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {status === 'not_found' && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex gap-3 items-start border border-red-100">
                                        <AlertCircle className="shrink-0 mt-0.5" />
                                        <div>
                                            Sorry, we couldn't find you. Please contact HR add you to the list first.
                                        </div>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-christmas-green text-white font-bold text-lg rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                >
                                    Login & Draw 🎁
                                </button>
                            </form>
                        )}

                        {/* LOADING STATE */}
                        {(status === 'checking' || status === 'selecting') && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 border-4 border-gray-200 border-t-christmas-red rounded-full animate-spin mx-auto mb-4"></div>
                                <h3 className="text-xl font-bold text-gray-700 animate-pulse">
                                    Checking the list...
                                </h3>
                            </div>
                        )}

                        {/* SUCCESS / RESULT STATE */}
                        {(status === 'success' || status === 'already_done') && result && (
                            <div className="text-center animate-scale-in pb-4">
                                {status === 'already_done' && (
                                    <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm border border-yellow-200">
                                        ℹ️ You have already drawn your match previously.
                                    </div>
                                )}

                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Gift className="w-12 h-12 text-christmas-green animate-bounce" />
                                </div>

                                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">You are the Secret Santa for</h3>

                                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-2xl shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300 relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                                    <h2 className="text-4xl font-black mb-2 drop-shadow-md">{result.name}</h2>
                                    <div className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                                        {result.department} Dept policy
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-blue-800 text-sm font-bold">
                                        📸 PLEASE TAKE A SCREENSHOT NOW!
                                    </p>
                                    <p className="text-blue-600 text-xs mt-1">
                                        Keep this secret. Don't tell anyone!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserPortal;
