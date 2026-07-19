import React, { useState } from 'react';

export const GlowCard = ({ children, className = '', glowColor = 'rgba(0, 245, 255, 0.15)', onClick }) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl glass-panel p-6 transition-all duration-300 hover:border-slate-700/80 group ${
        onClick ? 'cursor-pointer hover:translate-y-[-2px]' : ''
      } ${className}`}
    >
      {/* Glow radial highlight */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
        }}
      />
      
      {/* Corner/Border Glow Mask */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent transition-colors duration-300"
        style={{
          borderColor: isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
};
