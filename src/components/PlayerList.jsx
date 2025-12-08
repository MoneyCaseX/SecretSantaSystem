import React from 'react';
import { Trash2 } from 'lucide-react';

const PlayerList = ({ players, onRemovePlayer }) => {
    return (
        <div className="w-full max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 px-2">
                Staging List ({players.length})
            </h3>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="px-6 py-3 font-medium">Name</th>
                            <th className="px-6 py-3 font-medium">vPhone</th>
                            <th className="px-6 py-3 font-medium">Department</th>
                            <th className="px-6 py-3 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {players.map((player, index) => (
                            <tr key={index} className="hover:bg-blue-50 transition-colors group">
                                <td className="px-6 py-3 font-medium text-gray-900">{player.name}</td>
                                <td className="px-6 py-3 text-gray-500">{player.phone}</td>
                                <td className="px-6 py-3 text-gray-500">
                                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                        {player.department || 'General'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button
                                        onClick={() => onRemovePlayer(index)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Remove"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {players.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm italic">
                        No players added to staging yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerList;
