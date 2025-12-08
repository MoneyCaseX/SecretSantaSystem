import React, { useState } from 'react';
import Header from '../components/Header';
import { UserPlus, CheckCircle, Building2 } from 'lucide-react';
import { DEPARTMENTS } from '../constants';

const RegisterAndJoin = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState(DEPARTMENTS[0]);
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;

        setStatus('submitting');
        try {
            const res = await fetch('/.netlify/functions/request-join', {
                method: 'POST',
                body: JSON.stringify({ name, phone, department })
            });

            if (res.ok) {
                setStatus('success');
                setName('');
                setPhone('');
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-christmas-red to-red-950 flex flex-col">
            <Header />
            <div className="flex-grow flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-blue-600 p-6 text-white text-center">
                        <UserPlus className="mx-auto w-12 h-12 mb-3 opacity-90" />
                        <h2 className="text-2xl font-bold">Join the Party!</h2>
                        <p className="text-blue-100 text-sm">Sign up for Agent Secret Santa</p>
                    </div>

                    <div className="p-8">
                        {status === 'success' ? (
                            <div className="text-center py-8 animate-fade-in-up">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Request Sent!</h3>
                                <p className="text-gray-600 mb-6">
                                    Your request has been sent to the admin for approval. You will be able to draw your Secret Santa once approved.
                                </p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="text-blue-600 font-semibold hover:underline"
                                >
                                    Register another person
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="01xxxxxxxxx"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                        Something went wrong. Please try again.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-70"
                                >
                                    {status === 'submitting' ? 'Sending...' : 'Send Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterAndJoin;
