import React from 'react';
import { Gift } from 'lucide-react';

const Header = () => {
    return (
        <header className="relative z-10 flex flex-col items-center justify-center py-10 text-christmas-white">
            <div className="flex flex-col items-center gap-4 mb-2">
                <img
                    src="/logo.png"
                    alt="Secret Santa Logo"
                    className="w-64 h-auto drop-shadow-[0_0_20px_rgba(0,140,255,0.9)] animate-pulse bg-gray-200 rounded-xl p-4"
                />
            </div>
            <p className="text-xl opacity-90 font-light tracking-widest uppercase text-christmas-gold mt-4">
                Auto Select
            </p>

            {/* Snowflakes */}
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
            <div className="snowflake">❅</div>
            <div className="snowflake">❆</div>
        </header>
    );
};

export default Header;
