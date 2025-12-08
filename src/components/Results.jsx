import React, { useState, useRef } from 'react';
import { Download, Copy, Check, RefreshCw, LayoutList, Circle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CircularDiagram from './CircularDiagram';
import clsx from 'clsx';

const Results = ({ matches, onReset }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'circle'
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = matches.map(m => `${m.giver.name} -> ${m.receiver.name}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resultsRef = useRef(null);

    const handleDownloadPDF = async () => {
        if (!resultsRef.current) return;

        try {
            const canvas = await html2canvas(resultsRef.current, {
                scale: 2, // Higher quality
                backgroundColor: '#ffffff',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save('secret-santa-results.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div ref={resultsRef} className="bg-white/95 backdrop-blur rounded-xl shadow-2xl overflow-hidden border-t-4 border-christmas-gold">

                {/* Toolbar */}
                <div data-html2canvas-ignore="true" className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-md transition-all",
                                viewMode === 'list' ? "bg-white shadow text-christmas-red font-medium" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <LayoutList size={18} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('circle')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-md transition-all",
                                viewMode === 'circle' ? "bg-white shadow text-christmas-red font-medium" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Circle size={18} /> Diagram
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                        >
                            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-christmas-red text-white rounded-lg hover:bg-red-800 transition-colors shadow-md hover:shadow-lg"
                        >
                            <Download size={18} /> PDF
                        </button>
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <RefreshCw size={18} /> Reset
                        </button>
                    </div>
                </div>

                {/* Header */}
                <div className="p-6 text-center border-b border-gray-100 bg-white">
                    <h2 className="text-3xl font-bold text-christmas-red">Secret Santa Results</h2>
                    <p className="text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[400px]">
                    {viewMode === 'list' ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {matches.map((match, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-christmas-gold/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 flex items-center justify-center bg-christmas-red text-white rounded-full font-bold text-sm">
                                            {i + 1}
                                        </span>
                                        <span className="font-semibold text-gray-800">{match.giver.name}</span>
                                    </div>
                                    <div className="text-christmas-green font-bold text-xl">→</div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-gray-800">{match.receiver.name}</span>
                                        <GiftIcon />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center py-8">
                            <CircularDiagram matches={matches} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const GiftIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"></polyline>
        <rect x="2" y="7" width="20" height="5"></rect>
        <line x1="12" y1="22" x2="12" y2="7"></line>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
);

export default Results;
