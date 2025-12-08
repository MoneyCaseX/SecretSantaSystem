import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const FirebaseTest = () => {
    const [status, setStatus] = useState('checking');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const testConnection = async () => {
            try {
                console.log("🔥 Testing Firebase Connection...");
                // Provide a timeout mechanism if it hangs? Firestore normally handles offline gracefully, but let's try a real fetch.
                const q = query(collection(db, "participants"), limit(1));
                await getDocs(q);
                console.log("✅ Firebase Connection Successful!");
                setStatus('success');
                setMessage('Connected to Firebase!');
            } catch (error) {
                console.error("❌ Firebase Connection Failed:", error);
                setStatus('error');
                setMessage(`Connection Failed: ${error.message}`);
            }
        };

        testConnection();
    }, []);

    if (process.env.NODE_ENV !== 'development') return null; // Only show in dev

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            padding: '10px',
            textAlign: 'center',
            backgroundColor: status === 'success' ? '#d4edda' : status === 'error' ? '#f8d7da' : '#fff3cd',
            color: status === 'success' ? '#155724' : status === 'error' ? '#721c24' : '#856404',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}>
            <b>Firebase Status:</b> {status === 'checking' ? 'Connecting...' : message}
            {status === 'error' && <p style={{ fontSize: '0.8em', margin: 0 }}>Check console for details (F12)</p>}
        </div>
    );
};

export default FirebaseTest;
