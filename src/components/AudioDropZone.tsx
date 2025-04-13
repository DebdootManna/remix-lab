
import React, { useCallback, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Music } from "lucide-react";

interface AudioDropZoneProps {
  onAudioLoaded: (audioBuffer: AudioBuffer, audioFile: File) => void;
}

const AudioDropZone: React.FC<AudioDropZoneProps> = ({ onAudioLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processAudioFile = useCallback(async (file: File) => {
    if (!file.type.includes('audio')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      onAudioLoaded(audioBuffer, file);
      toast({
        title: "Audio loaded successfully",
        description: `${file.name} is ready to edit`,
      });
    } catch (error) {
      console.error("Error decoding audio data:", error);
      toast({
        title: "Error loading audio",
        description: "Failed to process the audio file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [audioContext, onAudioLoaded, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  }, [processAudioFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAudioFile(e.target.files[0]);
    }
  }, [processAudioFile]);

  return (
    <div 
      className={`drop-zone ${isDragging ? 'drop-zone-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="audio-file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <label htmlFor="audio-file" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
        {isLoading ? (
          <div className="animate-pulse-soft text-studio-primary">
            <Music size={48} />
            <p className="mt-4 text-lg">Processing audio...</p>
          </div>
        ) : (
          <>
            <Upload 
              size={48} 
              className={`mb-4 ${isDragging ? 'text-studio-accent' : 'text-studio-primary'}`} 
            />
            <p className="text-xl font-medium mb-2">Drop your audio file here</p>
            <p className="text-sm text-muted-foreground">
              or click to browse (MP3, WAV - max 10MB)
            </p>
          </>
        )}
      </label>
    </div>
  );
};

export default AudioDropZone;
