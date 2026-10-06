import React, { useState } from 'react';
import somisaCrestImg from '../assets/images/somisa_crest_1790959553900.jpg';

interface ClubSomisaLogoProps {
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export const ClubSomisaLogo: React.FC<ClubSomisaLogoProps> = ({ 
  size = 40, 
  className = '',
  showBorder = true 
}) => {
  const [imgSrc, setImgSrc] = useState<string>(somisaCrestImg || './somisa_crest.jpg');
  const [hasFailed, setHasFailed] = useState(false);

  const handleError = () => {
    if (imgSrc !== './somisa_crest.jpg') {
      // Fallback to static public crest file
      setImgSrc('./somisa_crest.jpg');
    } else {
      setHasFailed(true);
    }
  };

  return (
    <div 
      style={{ width: size, height: size }} 
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {!hasFailed ? (
        <img
          src={imgSrc}
          alt="Club SOMISA San Nicolás - Escudo Oficial"
          onError={handleError}
          className={`w-full h-full object-contain rounded-full drop-shadow-sm transition-transform hover:scale-105 ${
            showBorder ? 'ring-1.5 ring-[#00205B]/30 dark:ring-white/30 bg-white/5' : ''
          }`}
          style={{ width: size, height: size }}
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Circular outer badge in Royal Blue */}
          <circle cx="50" cy="50" r="48" fill="#00205B" />
          <circle cx="50" cy="50" r="45" fill="#0044B3" stroke="#FFFFFF" strokeWidth="1.5" />
          
          {/* Orange Basketball in center */}
          <circle cx="50" cy="50" r="22" fill="#E65100" stroke="#000000" strokeWidth="1.5" />
          {/* Basketball seams */}
          <path d="M28 50H72" stroke="#000000" strokeWidth="1.5" />
          <path d="M50 28V72" stroke="#000000" strokeWidth="1.5" />
          <path d="M34 34C44 40 44 60 34 66" stroke="#000000" strokeWidth="1.2" fill="none" />
          <path d="M66 34C56 40 56 60 66 66" stroke="#000000" strokeWidth="1.2" fill="none" />

          {/* Arched Text: CLUB (top) */}
          <path id="curveTop" d="M 20,50 A 30,30 0 0,1 80,50" fill="none" />
          <text fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="2">
            <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
              CLUB
            </textPath>
          </text>

          {/* Arched Text: SOMISA (bottom) */}
          <path id="curveBottom" d="M 80,50 A 30,30 0 0,1 20,50" fill="none" />
          <text fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="1.5">
            <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">
              SOMISA
            </textPath>
          </text>
        </svg>
      )}
    </div>
  );
};
