import React, { useState } from 'react';
import Header from '../components/Header';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Search, Gift, AlertCircle } from 'lucide-react';

const UserPortal = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error, not_found, already_seen
    const [assignment, setAssignment] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setStatus('loading');
        setErrorMsg('');

        try {
            // Flexible search: Try to match exact name initially. 
            // In a real production app, you might want normalize strings (lowercase, trim) when saving and querying.
            const assignmentsRef = collection(db, "assignments");

            // Simple query mainly by Name (assuming names are unique enough or user knows exact spelling)
            // You can add 'phone' query if you enforce phone numbers.
            const q = query(assignmentsRef, where("name", "==", name.trim()));

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setStatus('not_found');
                return;
            }

            // Assume the first match is the user
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Check if phone matches (if enabled as a requirement)
            if (phone && userData.phone && userData.phone !== phone) {
                setStatus('error');
                setErrorMsg("Phone number does not match our records for this name.");
                return;
            }

            if (userData.seen) {
                // Determine if we should show it again or block.
                // The requirement said: "رفض" if they try again. 
                // But usually, it's better to show "You have already retrieved your Santa".
                // Let's strictly follow "refuse" logic or show a specific message.
                setStatus('already_seen');
                return;
            }

            // Determine their Santa
            setAssignment({
                receiverName: userData.receiverName,
                receiverDepartment: userData.receiverDepartment
            });

            // Update seen status
            await updateDoc(userDoc.ref, {
                seen: true,
                seenAt: new Date()
            });

            setStatus('success');

        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMsg("Connection error. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                    <div className="bg-christmas-green p-6 text-center">
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome to Secret Santa! 🎅</h1>
                        <p className="text-green-100 text-sm">Find out who you are gifting this year</p>
                    </div>

                    <div className="p-8">
                        {status === 'idle' || status === 'loading' || status === 'error' || status === 'not_found' ? (
                            <form onSubmit={handleSearch} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your registered full name"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-christmas-green focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter your phone number"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-christmas-green focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                {status === 'not_found' && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle size={18} />
                                        Sorry, we couldn't find your name in the list.
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle size={18} />
                                        {errorMsg || "An error occurred."}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full bg-christmas-gold text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    {status === 'loading' ? (
                                        <span>Checking...</span>
                                    ) : (
                                        <>
                                            <Search size={20} /> Reveal My Santa
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : null}

                        {status === 'success' && assignment && (
                            <div className="text-center animate-scale-in">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Gift className="w-10 h-10 text-christmas-green animate-bounce" />
                                </div>
                                <h3 className="text-gray-500 font-medium mb-2">You are the Secret Santa for:</h3>
                                <div className="bg-christmas-green/10 rounded-xl p-6 border-2 border-christmas-green border-dashed mb-6">
                                    <h2 className="text-3xl font-bold text-christmas-green mb-1">{assignment.receiverName}</h2>
                                    {assignment.receiverDepartment && (
                                        <span className="inline-block bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                                            {assignment.receiverDepartment}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400">
                                    Shh! Keep it a secret! This result has been saved and can only be viewed once.
                                </p>
                            </div>
                        )}

                        {status === 'already_seen' && (
                            <div className="text-center animate-fade-in text-red-600">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-10 h-10 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                                <p className="text-gray-600">
                                    You have already viewed your Secret Santa assignment. For security reasons, you cannot view it again.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserPortal;
