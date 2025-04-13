
import React, { useState } from 'react';

interface EqualizerBandProps {
  frequency: number;
  gain: number;
  onChange: (value: number) => void;
  isPlaying: boolean;
}

const EqualizerBand: React.FC<EqualizerBandProps> = ({
  frequency,
  gain,
  onChange,
  isPlaying
}) => {
  const [level, setLevel] = useState(gain);
  const normalizedHeight = ((gain + 20) / 40) * 100; // Convert from -20 to +20 dB to percentage
  
  // Format frequency display
  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${freq / 1000}kHz`;
    }
    return `${freq}Hz`;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setLevel(newValue);
    onChange(newValue);
  };

  return (
    <div className="frequency-band">
      <span className="text-xs font-semibold">
        {level > 0 ? `+${level.toFixed(1)}` : level.toFixed(1)} dB
      </span>
      
      <div className="relative h-32 flex items-center justify-center">
        {/* Background levels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="h-1/3 border-t border-studio-border opacity-30"></div>
          <div className="h-1/3 border-t border-studio-border opacity-30"></div>
        </div>
        
        {/* Active EQ bar */}
        <div className="relative w-6 h-full flex items-center justify-center">
          <div 
            className={`eq-bar absolute bottom-0 w-full rounded-t ${
              isPlaying ? 'bg-studio-accent' : 'bg-studio-primary'
            } ${
              isPlaying ? 'animate-waveform' : ''
            }`} 
            style={{ 
              height: `${normalizedHeight}%`, 
              opacity: level > 0 ? 0.8 : 0.6,
              animationDelay: `${frequency % 500 / 1000}s`
            }}
          ></div>
        </div>
        
        {/* Range input for controlling gain */}
        <input 
          type="range"
          min="-20"
          max="20"
          step="0.5"
          value={level}
          onChange={handleChange}
          className="eq-slider absolute inset-0"
          style={{ transform: 'rotate(180deg)' }}
        />
      </div>
      
      <span className="text-xs mt-1">
        {formatFrequency(frequency)}
      </span>
    </div>
  );
};

export default EqualizerBand;
