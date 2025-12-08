import React, { useState, useRef } from 'react';
import { Plus, Upload, FileText } from 'lucide-react';
import Papa from 'papaparse';
import clsx from 'clsx';

const PlayerInput = ({ onAddPlayer, onImportCSV }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleAdd = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onAddPlayer({ name: name.trim(), email: email.trim() });
            setName('');
            setEmail('');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const processFile = (file) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please upload a valid CSV file.');
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Check if header exists, otherwise try to parse as array of arrays or assume first column is name
                let players = [];

                if (results.meta.fields && results.meta.fields.length > 0) {
                    // Has headers
                    players = results.data.map(row => ({
                        name: row.name || row.Name || Object.values(row)[0],
                        email: row.email || row.Email || (Object.values(row)[1] && Object.values(row)[1].includes('@') ? Object.values(row)[1] : '')
                    })).filter(p => p.name);
                } else {
                    // No headers, maybe simple list
                    players = results.data.map(row => {
                        const vals = Object.values(row);
                        return {
                            name: vals[0],
                            email: vals[1] || ''
                        };
                    }).filter(p => p.name);
                }

                onImportCSV(players);
            },
            error: (err) => {
                console.error('CSV Parse Error:', err);
                alert('Error parsing CSV file');
            }
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur rounded-xl shadow-xl p-6 mb-8 border-2 border-christmas-gold/30">
            <h2 className="text-2xl font-bold text-christmas-red mb-4 flex items-center gap-2">
                <Plus className="text-christmas-green" /> Add Participants
            </h2>

            {/* Manual Input */}
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-green focus:border-transparent outline-none"
                />
                <input
                    type="email"
                    placeholder="Email (Optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-green focus:border-transparent outline-none"
                />
                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="bg-christmas-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Add
                </button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
            </div>

            {/* CSV Import */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                    "mt-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group",
                    isDragging
                        ? "border-christmas-green bg-green-50"
                        : "border-gray-300 hover:border-christmas-gold hover:bg-yellow-50"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-christmas-green">
                    <div className="p-3 bg-gray-100 rounded-full group-hover:bg-white transition-colors">
                        <Upload size={32} />
                    </div>
                    <p className="font-medium">
                        Click to upload or drag & drop CSV
                    </p>
                    <p className="text-xs text-gray-400">
                        Format: name, email (optional)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlayerInput;
