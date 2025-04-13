
import React, { useState, useEffect, useCallback } from 'react';
import EqualizerBand from './EqualizerBand';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface EqualizerProps {
  audioContext: AudioContext | null;
  sourceNode: AudioBufferSourceNode | null;
  isPlaying: boolean;
}

// Define the frequencies for our 8-band EQ
const FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000];

const Equalizer: React.FC<EqualizerProps> = ({ audioContext, sourceNode, isPlaying }) => {
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
  const [gains, setGains] = useState<number[]>(Array(FREQUENCIES.length).fill(0));

  // Create filters when audio context changes
  useEffect(() => {
    if (!audioContext) return;
    
    // Clean up old filters
    filters.forEach(filter => {
      filter.disconnect();
    });
    
    // Create new filters
    const newFilters = FREQUENCIES.map((freq, index) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = index === 0 ? 'lowshelf' 
                 : index === FREQUENCIES.length - 1 ? 'highshelf' 
                 : 'peaking';
      filter.frequency.value = freq;
      filter.gain.value = gains[index];
      filter.Q.value = 1;
      return filter;
    });
    
    setFilters(newFilters);
    
    // Connect filters when source changes
    if (sourceNode) {
      connectFilters(sourceNode, newFilters);
    }
    
    return () => {
      newFilters.forEach(filter => filter.disconnect());
    };
  }, [audioContext]);
  
  // Reconnect filters when source changes
  useEffect(() => {
    if (sourceNode && filters.length > 0) {
      connectFilters(sourceNode, filters);
    }
  }, [sourceNode]);
  
  // Helper to connect filters in series
  const connectFilters = useCallback((source: AudioBufferSourceNode, filterNodes: BiquadFilterNode[]) => {
    if (!audioContext) return;
    
    // Disconnect source from direct output
    source.disconnect();
    
    // Connect filters in series
    let previousNode: AudioNode = source;
    filterNodes.forEach(filter => {
      previousNode.connect(filter);
      previousNode = filter;
    });
    
    // Connect last filter to destination
    previousNode.connect(audioContext.destination);
  }, [audioContext]);
  
  // Handle gain change for a specific band
  const handleGainChange = (index: number, value: number) => {
    if (filters[index]) {
      filters[index].gain.value = value;
      setGains(prev => {
        const newGains = [...prev];
        newGains[index] = value;
        return newGains;
      });
    }
  };
  
  // Reset all EQ bands to 0
  const resetEqualizer = () => {
    if (!filters.length) return;
    
    const newGains = Array(FREQUENCIES.length).fill(0);
    setGains(newGains);
    
    filters.forEach((filter, index) => {
      filter.gain.value = 0;
    });
  };

  return (
    <div className="p-4 bg-studio-muted rounded-lg border border-studio-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">8-Band Equalizer</h3>
        <Button
          variant="outline" 
          size="sm" 
          onClick={resetEqualizer}
        >
          <RotateCcw size={16} className="mr-2" />
          Reset
        </Button>
      </div>
      
      <div className="flex justify-between items-end">
        {FREQUENCIES.map((freq, index) => (
          <EqualizerBand
            key={freq}
            frequency={freq}
            gain={gains[index]}
            onChange={(value) => handleGainChange(index, value)}
            isPlaying={isPlaying}
          />
        ))}
      </div>
      
      {/* EQ Range labels */}
      <div className="flex justify-between mt-2 px-2">
        <span className="text-xs text-muted-foreground">Low</span>
        <span className="text-xs text-muted-foreground">Mid</span>
        <span className="text-xs text-muted-foreground">High</span>
      </div>
    </div>
  );
};

export default Equalizer;
