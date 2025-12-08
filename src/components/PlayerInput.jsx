import React, { useState, useRef } from 'react';
import { Plus, Upload, Building2 } from 'lucide-react';
import Papa from 'papaparse';
import clsx from 'clsx';

const DEPARTMENTS = [
    "Development", "Sales", "Marketing", "HR", "Accounting", "Management", "Operations", "General"
];

const PlayerInput = ({ onAddPlayer, onImportCSV }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('General');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleAdd = (e) => {
        e.preventDefault();
        if (name.trim() && phone.trim()) {
            onAddPlayer({
                name: name.trim(),
                phone: phone.trim(),
                department: department
            });
            setName('');
            setPhone('');
            setDepartment(DEPARTMENTS[0]);
        } else {
            alert("Name and Phone are required.");
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
                // Determine headers to find phone and dept columns if possible
                let players = [];
                if (results.meta.fields && results.meta.fields.length > 0) {
                    // Try smart matching
                    const headers = results.meta.fields.map(h => h.toLowerCase());
                    const nameIdx = headers.findIndex(h => h.includes('name'));
                    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
                    const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('department'));

                    players = results.data.map(row => {
                        const vals = Object.values(row);
                        return {
                            name: nameIdx > -1 ? vals[nameIdx] : vals[0],
                            phone: phoneIdx > -1 ? vals[phoneIdx] : (vals[1] || ""),
                            department: deptIdx > -1 ? vals[deptIdx] : "General"
                        };
                    });
                } else {
                    // Fallback no header: Name, Phone, Dept
                    players = results.data.map(row => {
                        const vals = Object.values(row);
                        return {
                            name: vals[0],
                            phone: vals[1] || "",
                            department: vals[2] || "General"
                        };
                    });
                }

                // Filter empty names
                players = players.filter(p => p.name && p.name.trim() !== "");
                onImportCSV(players);
            },
            error: (err) => {
                console.error('CSV Parse Error:', err);
                alert('Error parsing CSV file');
            }
        });
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-white/95 backdrop-blur rounded-xl shadow-xl p-6 mb-8 border-2 border-christmas-gold/30">
            <h2 className="text-2xl font-bold text-christmas-red mb-4 flex items-center gap-2">
                <Plus className="text-christmas-green" /> Add Participants (Manual or CSV)
            </h2>

            {/* Manual Input */}
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 mb-6 items-start">
                <div className="flex-1 w-full">
                    <input
                        type="text"
                        placeholder="Full Name *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-green focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex-1 w-full">
                    <input
                        type="tel"
                        placeholder="Phone *"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-green focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex-1 w-full relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-green focus:border-transparent outline-none bg-white appearance-none"
                    >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-christmas-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors flex items-center justify-center gap-2 w-full md:w-auto mt-1 md:mt-0"
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
                        Format: Name, Phone, Department (Optional)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlayerInput;
