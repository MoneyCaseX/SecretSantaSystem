import React, { useState } from 'react';
import Header from '../components/Header';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, runTransaction, doc } from 'firebase/firestore';
import { Search, Gift, AlertCircle, Building2 } from 'lucide-react';

// Hardcoded departments list for dropdown
const DEPARTMENTS = [
    "Development", "Sales", "Marketing", "HR", "Accounting", "Management", "Operations", "General"
];

const UserPortal = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');

    // Status: idle, checking, selecting, success, error, not_found, already_done
    const [status, setStatus] = useState('idle');
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    const handleDraw = async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim() || !department) return;

        setStatus('checking');
        setErrorMsg('');

        try {
            // 1. Authenticate / Identify User
            const participantsRef = collection(db, "participants");
            // Normalize name search? For now strict
            const q = query(participantsRef, where("name", "==", name.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setStatus('not_found');
                return;
            }

            // Assume first match is correct (add phone check strictly)
            const userDoc = querySnapshot.docs.find(d => d.data().phone === phone.trim());

            if (!userDoc) {
                setStatus('error');
                setErrorMsg("Name found but phone number doesn't match.");
                return;
            }

            const userData = userDoc.data();

            // 2. Check if already has a Santa
            if (userData.mySantaOf) {
                // Already picked! Show them who.
                setResult({
                    name: userData.mySantaOfName,
                    department: "Unknown" // We saved the name flatly, could fetch more if needed
                });
                setStatus('already_done');
                return;
            }

            // 3. START LIVE DRAW TRANSACTION
            // We need to find someone who:
            // - is NOT me
            // - isChosen == false
            // - (Optional) department != my department (if possible)

            setStatus('selecting'); // Show spinner "Drawing..."

            await runTransaction(db, async (transaction) => {
                // Re-read user inside transaction to be safe
                const userRef = doc(db, "participants", userDoc.id);
                const freshUser = await transaction.get(userRef);
                if (!freshUser.exists()) throw "User vanished!";

                if (freshUser.data().mySantaOf) {
                    throw "ALREADY_PICKED"; // Handled in catch
                }

                // Query for available candidates
                // Note: Firestore inequalitiy queries are tricky. 
                // We'll query isChosen==false, then filter in memory for ID != myID
                const qAvailable = query(participantsRef, where("isChosen", "==", false));
                const candidatesSnap = await getDocs(qAvailable);

                let candidates = candidatesSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(c => c.id !== userDoc.id); // Valid candidates excluding myself

                if (candidates.length === 0) {
                    // EDGE CASE: Last person? Or everyone taken?
                    // If I am the last person and everyone else is taken...
                    // In a perfect loop math, this shouldn't happen if N > 1 and we start together.
                    // But with random live draws, the last person might only have themselves left if logic isn't perfect loop.
                    // Pure random santa allows sub-loops. It's fine for this scale. 
                    // BUT if 'candidates' is empty, we are stuck.
                    // Let's retry or throw manual intervention needed.
                    throw "NO_CANDIDATES_LEFT";
                }

                // Optional: Filter out own department to encourage mixing
                const crossDeptCandidates = candidates.filter(c => c.department !== department);

                // If we have cross-dept options, prefer them. Else fallback to anyone.
                const pool = crossDeptCandidates.length > 0 ? crossDeptCandidates : candidates;

                // Pick Random
                const randomIndex = Math.floor(Math.random() * pool.length);
                const luckyPerson = pool[randomIndex];

                // 4. COMMIT UPDATES
                // Mark user as having 'mySantaOf' = luckyPerson
                // Mark luckyPerson as 'isChosen' = true
                const luckyRef = doc(db, "participants", luckyPerson.id);

                transaction.update(userRef, {
                    mySantaOf: luckyPerson.id,
                    mySantaOfName: luckyPerson.name
                });

                transaction.update(luckyRef, {
                    isChosen: true
                });

                // Pass data out to UI
                return luckyPerson;
            }).then((chosenOne) => {
                setResult({
                    name: chosenOne.name,
                    department: chosenOne.department
                });
                setStatus('success');
            }).catch((err) => {
                if (err === "ALREADY_PICKED") {
                    // Just reload to show result
                    setStatus('idle');
                    handleDraw(e); // refire to hit step 2
                } else if (err === "NO_CANDIDATES_LEFT") {
                    setErrorMsg("System Logic Error: No valid matches left (You might be the last one and only you are left). Contact Admin.");
                    setStatus('error');
                } else {
                    console.error("Transaction failed: ", err);
                    setErrorMsg("Draw failed due to high traffic. Please try again in seconds.");
                    setStatus('error');
                }
            });

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

                    {/* Header */}
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
                                    {status === 'checking' ? "Verifying..." : "Picking your Secret Santa..."}
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
