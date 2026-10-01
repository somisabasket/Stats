import React, { useState } from 'react';
import somisaCrestImage from '../assets/images/somisa_crest_1790786848632.jpg';

interface ClubSomisaLogoProps {
  className?: string;
  size?: number;
}

export const ClubSomisaLogo: React.FC<ClubSomisaLogoProps> = ({
  className = 'w-9 h-9',
  size = 36,
}) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError && somisaCrestImage) {
    return (
      <img
        src={somisaCrestImage}
        alt="Escudo Oficial Club SOMISA"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${className} object-contain rounded-full select-none shadow-xs`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Crisp Vector SVG Fallback
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} select-none drop-shadow-xs`}
      style={{ width: size, height: size }}
    >
      <defs>
        {/* Blue Radial Gradient */}
        <radialGradient id="somisaBlue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0B4FC2" />
          <stop offset="70%" stopColor="#00205B" />
          <stop offset="100%" stopColor="#001438" />
        </radialGradient>

        {/* Basketball Orange Gradient */}
        <radialGradient id="somisaBall" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FF851B" />
          <stop offset="80%" stopColor="#E65100" />
          <stop offset="100%" stopColor="#BF360C" />
        </radialGradient>

        {/* Text Arc Paths */}
        <path id="clubArc" d="M 20 50 A 30 30 0 0 1 80 50" fill="none" />
        <path id="somisaArc" d="M 18 50 A 32 32 0 0 0 82 50" fill="none" />
      </defs>

      {/* Outer Rim */}
      <circle cx="50" cy="50" r="49" fill="#001438" />
      <circle cx="50" cy="50" r="47.5" fill="url(#somisaBlue)" stroke="#FFFFFF" strokeWidth="1.2" />

      {/* Inner White Rim */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

      {/* Central Basketball */}
      <circle cx="50" cy="50" r="17" fill="url(#somisaBall)" stroke="#001438" strokeWidth="1" />
      
      {/* Basketball Seams */}
      <path d="M 33 50 L 67 50" stroke="#001438" strokeWidth="0.9" fill="none" />
      <path d="M 50 33 L 50 67" stroke="#001438" strokeWidth="0.9" fill="none" />
      <path d="M 38 38 Q 48 50 38 62" stroke="#001438" strokeWidth="0.8" fill="none" />
      <path d="M 62 38 Q 52 50 62 62" stroke="#001438" strokeWidth="0.8" fill="none" />

      {/* Top Text: CLUB */}
      <text
        fill="#FFFFFF"
        stroke="#001438"
        strokeWidth="1.2"
        fontSize="15"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="2.5"
      >
        <textPath href="#clubArc" startOffset="50%" textAnchor="middle">
          CLUB
        </textPath>
      </text>

      {/* Bottom Text: SOMISA */}
      <text
        fill="#FFFFFF"
        stroke="#001438"
        strokeWidth="1.2"
        fontSize="14"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="2"
      >
        <textPath href="#somisaArc" startOffset="50%" textAnchor="middle">
          SOMISA
        </textPath>
      </text>
    </svg>
  );
};
