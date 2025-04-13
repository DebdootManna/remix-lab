
import React, { useState, useRef } from 'react';
import AudioDropZone from '@/components/AudioDropZone';
import Waveform from '@/components/Waveform';
import Equalizer from '@/components/Equalizer';
import AudioTools from '@/components/AudioTools';
import StudioHeader from '@/components/StudioHeader';
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  
  const { toast } = useToast();

  const handleAudioLoaded = (buffer: AudioBuffer, file: File) => {
    setAudioBuffer(buffer);
    setAudioFile(file);
    setSelectionStart(0);
    setSelectionEnd(buffer.duration);
    
    // Initialize audio context 
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const handleRegionChange = (start: number, end: number) => {
    setSelectionStart(start);
    setSelectionEnd(end);
  };

  const handleTrim = (start: number, end: number) => {
    if (!audioBuffer) return;
    
    // Create a new buffer with trimmed audio
    const trimmedBuffer = createTrimmedBuffer(audioBuffer, start, end);
    
    setAudioBuffer(trimmedBuffer);
    setSelectionStart(0);
    setSelectionEnd(trimmedBuffer.duration);
    
    toast({
      title: "Audio trimmed",
      description: "The audio has been trimmed to your selection",
    });
  };

  const handleSplit = (position: number) => {
    if (!audioBuffer) return;
    
    // In a real app, you'd create two separate audio buffers
    // Here we're just setting the selection to one half
    setSelectionStart(0);
    setSelectionEnd(position);
    
    toast({
      title: "Audio split",
      description: "Selection has been set to the first part of the split",
    });
  };

  const createTrimmedBuffer = (buffer: AudioBuffer, start: number, end: number): AudioBuffer => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = end - start;
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    
    // Create a new buffer for the trimmed audio
    const newBuffer = context.createBuffer(
      numChannels,
      Math.ceil(duration * sampleRate),
      sampleRate
    );
    
    // Copy the selected portion of the original buffer to the new buffer
    for (let channel = 0; channel < numChannels; channel++) {
      const originalData = buffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      
      for (let i = 0; i < newBuffer.length; i++) {
        const originalIndex = Math.floor((start * sampleRate) + i);
        if (originalIndex < originalData.length) {
          newData[i] = originalData[originalIndex];
        }
      }
    }
    
    return newBuffer;
  };

  const resetStudio = () => {
    setAudioBuffer(null);
    setAudioFile(null);
    setSelectionStart(0);
    setSelectionEnd(0);
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-8">
      <StudioHeader 
        fileName={audioFile?.name} 
        onReset={resetStudio} 
      />
      
      {!audioBuffer ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="max-w-lg w-full">
            <AudioDropZone onAudioLoaded={handleAudioLoaded} />
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <Waveform 
            audioBuffer={audioBuffer} 
            onRegionChange={handleRegionChange} 
          />
          
          <div className="grid md:grid-cols-2 gap-6">
            <AudioTools 
              audioBuffer={audioBuffer}
              audioFile={audioFile!}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              onTrim={handleTrim}
              onSplit={handleSplit}
            />
            
            <Equalizer 
              audioContext={audioContextRef.current}
              sourceNode={sourceNodeRef.current}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      )}
      
      <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        <p>WebAudio Studio - Free audio editing in your browser</p>
      </footer>
    </div>
  );
};

export default Index;
