import React, { useState } from 'react';
import Header from './components/Header';
import PlayerInput from './components/PlayerInput';
import PlayerList from './components/PlayerList';
import Results from './components/Results';
import { Wand2 } from 'lucide-react';

function App() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleAddPlayer = (player) => {
    setPlayers([...players, player]);
  };

  const handleImportCSV = (newPlayers) => {
    // Filter duplicates based on name
    const existingNames = new Set(players.map(p => p.name.toLowerCase()));
    const uniqueNewPlayers = newPlayers.filter(p => !existingNames.has(p.name.toLowerCase()));

    if (uniqueNewPlayers.length < newPlayers.length) {
      alert(`Imported ${uniqueNewPlayers.length} new players. Skipped duplicates.`);
    }

    setPlayers([...players, ...uniqueNewPlayers]);
  };

  const handleRemovePlayer = (index) => {
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  const generateSecretSanta = () => {
    if (players.length < 2) {
      alert('You need at least 2 players to generate Secret Santa!');
      return;
    }

    // Fisher-Yates Shuffle
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Create closed loop
    const newMatches = shuffled.map((player, i) => ({
      giver: player,
      receiver: shuffled[(i + 1) % shuffled.length]
    }));

    setMatches(newMatches);
    setIsGenerated(true);
  };

  const handleReset = () => {
    setIsGenerated(false);
    setMatches([]);
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="container mx-auto px-4">
        {!isGenerated ? (
          <div className="flex flex-col items-center animate-fade-in-up">
            <PlayerInput
              onAddPlayer={handleAddPlayer}
              onImportCSV={handleImportCSV}
            />

            <PlayerList
              players={players}
              onRemovePlayer={handleRemovePlayer}
            />

            {players.length > 0 && (
              <button
                onClick={generateSecretSanta}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-christmas-green font-lg rounded-full hover:bg-green-700 hover:shadow-lg hover:-translate-y-1 focus:outline-none ring-offset-2 focus:ring-2 ring-christmas-gold"
              >
                <span className="mr-2 text-xl">Generate Secret Santa</span>
                <Wand2 className="w-6 h-6 animate-pulse" />
                <div className="absolute -inset-3 rounded-full bg-christmas-gold opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-200" />
              </button>
            )}
          </div>
        ) : (
          <Results matches={matches} onReset={handleReset} />
        )}
      </main>

      <footer className="fixed bottom-0 w-full py-4 text-center text-christmas-white/60 text-sm font-light tracking-widest uppercase bg-gradient-to-t from-christmas-red to-transparent">
        Powered by Egypt Express Travel
      </footer>
    </div>
  );
}

export default App;
