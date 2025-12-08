import React from 'react';
import { Trash2, User } from 'lucide-react';

const PlayerList = ({ players, onRemovePlayer }) => {
    if (players.length === 0) return null;

    return (
        <div className="w-full max-w-2xl mx-auto bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                Participants <span className="bg-christmas-red text-white text-xs px-2 py-1 rounded-full">{players.length}</span>
            </h3>

            <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {players.map((player, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-red-50 transition-colors group border border-gray-100"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-christmas-green/10 rounded-full flex items-center justify-center text-christmas-green">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{player.name}</p>
                                {player.email && (
                                    <p className="text-xs text-gray-500">{player.email}</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => onRemovePlayer(index)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                            title="Remove"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerList;
