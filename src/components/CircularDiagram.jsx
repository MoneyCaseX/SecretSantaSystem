import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const CircularDiagram = ({ matches }) => {
    const radius = 200;
    const center = 300;
    const size = 600;

    const positions = useMemo(() => {
        const count = matches.length;
        return matches.map((match, i) => {
            const angle = (i / count) * 2 * Math.PI - Math.PI / 2; // Start from top
            return {
                x: center + radius * Math.cos(angle),
                y: center + radius * Math.sin(angle),
                ...match
            };
        });
    }, [matches]);

    if (matches.length === 0) return null;

    return (
        <div className="w-full max-w-[600px] mx-auto aspect-square bg-gray-900 rounded-full shadow-2xl border-4 border-christmas-gold/30 p-4 overflow-hidden relative">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#0B6B32" />
                    </marker>
                </defs>

                {/* Draw Arrows */}
                {positions.map((pos, i) => {
                    const nextPos = positions[(i + 1) % positions.length];

                    // Calculate control point for slight curve if needed, or straight line
                    // Straight line is fine for circle

                    return (
                        <motion.line
                            key={`line-${i}`}
                            x1={pos.x}
                            y1={pos.y}
                            x2={nextPos.x}
                            y2={nextPos.y}
                            stroke="#0B6B32"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                        />
                    );
                })}

                {/* Draw Nodes */}
                {positions.map((pos, i) => (
                    <g key={`node-${i}`}>
                        <motion.circle
                            cx={pos.x}
                            cy={pos.y}
                            r="25"
                            fill="#B80000"
                            stroke="#D4AF37"
                            strokeWidth="3"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                        />
                        <motion.text
                            x={pos.x}
                            y={pos.y}
                            dy="5"
                            textAnchor="middle"
                            fill="white"
                            fontSize="14"
                            fontWeight="bold"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                        >
                            {i + 1}
                        </motion.text>

                        {/* Name Label - Positioned outside the circle */}
                        <motion.text
                            x={pos.x + (pos.x - center) * 0.35}
                            y={pos.y + (pos.y - center) * 0.35}
                            dy="5"
                            textAnchor="middle"
                            fill="#D4AF37"
                            fontSize="16"
                            fontWeight="500"
                            className="drop-shadow-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 + i * 0.05 }}
                        >
                            {pos.giver.name}
                        </motion.text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default CircularDiagram;
