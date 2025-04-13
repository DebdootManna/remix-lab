
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface WaveformProps {
  audioBuffer: AudioBuffer;
  onRegionChange?: (start: number, end: number) => void;
}

const Waveform: React.FC<WaveformProps> = ({ audioBuffer, onRegionChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(audioBuffer.duration);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawWaveform = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const data = audioBuffer.getChannelData(0);
      const step = Math.ceil(data.length / width);
      const amp = height / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      
      // Selection background
      const selStartPx = Math.floor(selectionStart / audioBuffer.duration * width);
      const selEndPx = Math.floor(selectionEnd / audioBuffer.duration * width);
      ctx.fillStyle = 'rgba(155, 135, 245, 0.2)';
      ctx.fillRect(selStartPx, 0, selEndPx - selStartPx, height);

      // Draw waveform
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#9b87f5';
      ctx.beginPath();
      
      for (let i = 0; i < width; i++) {
        const min = 1.0;
        const max = -1.0;

        for (let j = 0; j < step; j++) {
          const datum = data[(i * step) + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }

        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
      }
      ctx.stroke();

      // Draw playhead
      const playheadPos = Math.floor((currentTime / audioBuffer.duration) * width);
      ctx.beginPath();
      ctx.strokeStyle = '#1EAEDB';
      ctx.lineWidth = 2;
      ctx.moveTo(playheadPos, 0);
      ctx.lineTo(playheadPos, height);
      ctx.stroke();
    };

    // Set canvas dimensions
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    
    // Scale the context to ensure crisp rendering
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = `${canvas.clientWidth}px`;
      canvas.style.height = `${canvas.clientHeight}px`;
    }
    
    drawWaveform();

    // Setup waveform click for selection
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickTime = (x / rect.width) * audioBuffer.duration;
      
      // When click is closer to selection start, move start; otherwise move end
      if (Math.abs(clickTime - selectionStart) < Math.abs(clickTime - selectionEnd)) {
        setSelectionStart(clickTime);
      } else {
        setSelectionEnd(clickTime);
      }
      
      // Ensure start is always before end
      if (selectionStart > selectionEnd) {
        const temp = selectionStart;
        setSelectionStart(selectionEnd);
        setSelectionEnd(temp);
      }
      
      if (onRegionChange) {
        onRegionChange(selectionStart, selectionEnd);
      }
    };

    canvas.addEventListener('click', handleClick);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [audioBuffer, currentTime, selectionStart, selectionEnd, onRegionChange]);

  // Handle play/pause and playback
  const togglePlayback = () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (!audioContextRef.current) return;
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      const offset = Math.max(0, Math.min(selectionStart, audioBuffer.duration));
      const duration = Math.min(selectionEnd - selectionStart, audioBuffer.duration - offset);
      
      source.start(0, offset, duration);
      source.onended = () => setIsPlaying(false);
      
      sourceNodeRef.current = source;
      startTimeRef.current = audioContextRef.current.currentTime - offset;
      
      const updatePlayhead = () => {
        if (!audioContextRef.current) return;
        
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        setCurrentTime(selectionStart + elapsed);
        
        if (selectionStart + elapsed >= selectionEnd) {
          setIsPlaying(false);
          setCurrentTime(selectionStart);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          return;
        }
        
        animationRef.current = requestAnimationFrame(updatePlayhead);
      };
      
      animationRef.current = requestAnimationFrame(updatePlayhead);
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <div className="waveform-container">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
        />
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs font-mono">
          {formatTime(currentTime)} / {formatTime(audioBuffer.duration)}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setCurrentTime(selectionStart)}
          >
            <SkipBack size={16} />
          </Button>
          <Button 
            variant="default" 
            size="icon"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setCurrentTime(selectionEnd)}
          >
            <SkipForward size={16} />
          </Button>
        </div>
        <div className="text-xs font-mono">
          Selection: {formatTime(selectionStart)} - {formatTime(selectionEnd)}
        </div>
      </div>
    </div>
  );
};

export default Waveform;
