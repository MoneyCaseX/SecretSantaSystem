import React, { useEffect, useState } from 'react';

const Countdown = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        } else {
            timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const TimeCircle = ({ value, label }) => (
        <div className="flex flex-col items-center mx-2 sm:mx-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-sm relative">
                {/* Progress Circle Visual Hack (Optional, keeping it simple clean like ref image) */}
                <span className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                    {String(value).padStart(2, '0')}
                </span>

                {/* Decorative partial ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle cx="50%" cy="50%" r="48%" stroke="white" strokeWidth="2" fill="none" strokeDasharray="100" strokeDashoffset="25" className="opacity-50" />
                </svg>
            </div>
            <span className="text-xs sm:text-sm uppercase tracking-widest text-red-100 mt-2 font-medium">{label}</span>
        </div>
    );

    return (
        <div className="text-center animate-fade-in py-8">
            <h2 className="text-white text-2xl sm:text-4xl font-black uppercase tracking-[0.2em] mb-8 drop-shadow-lg">
                Coming Soon
            </h2>

            <div className="flex justify-center flex-wrap gap-y-4">
                <TimeCircle value={timeLeft.days} label="Days" />
                <TimeCircle value={timeLeft.hours} label="Hours" />
                <TimeCircle value={timeLeft.minutes} label="Minutes" />
                <TimeCircle value={timeLeft.seconds} label="Seconds" />
            </div>

            <div className="mt-10 text-white/80 text-sm font-light px-4 max-w-md mx-auto">
                Our Secret Santa event is scheduled to begin soon. Get your wishlists ready and prepare for the holiday cheer! 🎄
            </div>
        </div>
    );
};

export default Countdown;
