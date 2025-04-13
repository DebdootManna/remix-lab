
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Scissors, 
  SplitSquareVertical, 
  Download,
  Mic,
  Music
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface AudioToolsProps {
  audioBuffer: AudioBuffer;
  audioFile: File;
  selectionStart: number;
  selectionEnd: number;
  onTrim: (start: number, end: number) => void;
  onSplit: (position: number) => void;
}

const AudioTools: React.FC<AudioToolsProps> = ({
  audioBuffer,
  audioFile,
  selectionStart,
  selectionEnd,
  onTrim,
  onSplit
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const handleTrim = () => {
    onTrim(selectionStart, selectionEnd);
    toast({
      title: "Audio trimmed",
      description: `Trimmed to ${formatTime(selectionStart)} - ${formatTime(selectionEnd)}`,
    });
  };

  const handleSplit = () => {
    const splitPoint = (selectionStart + selectionEnd) / 2;
    onSplit(splitPoint);
    toast({
      title: "Audio split",
      description: `Split at ${formatTime(splitPoint)}`,
    });
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    offlineContext.startRendering().then(renderedBuffer => {
      const wavBlob = bufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_audio.wav';
      a.click();
      
      URL.revokeObjectURL(url);
    });
    
    toast({
      title: "Download started",
      description: "Your edited audio file is downloading",
    });
  };

  // Convert AudioBuffer to WAV Blob
  const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const result = new Uint8Array(44 + length);
    
    // RIFF chunk descriptor
    writeUTFBytes(result, 0, 'RIFF');
    setUint32(result, 4, 36 + length);
    writeUTFBytes(result, 8, 'WAVE');
    
    // FMT sub-chunk
    writeUTFBytes(result, 12, 'fmt ');
    setUint32(result, 16, 16);
    setUint16(result, 20, 1);
    setUint16(result, 22, numOfChannels);
    setUint32(result, 24, buffer.sampleRate);
    setUint32(result, 28, buffer.sampleRate * numOfChannels * 2);
    setUint16(result, 32, numOfChannels * 2);
    setUint16(result, 34, 16);
    
    // Data sub-chunk
    writeUTFBytes(result, 36, 'data');
    setUint32(result, 40, length);
    
    // Write the PCM samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        setInt16(result, offset, value);
        offset += 2;
      }
    }
    
    return new Blob([result], { type: 'audio/wav' });
  };

  const setUint16 = (data: Uint8Array, offset: number, value: number) => {
    data[offset] = value & 0xff;
    data[offset + 1] = (value >> 8) & 0xff;
  };

  const setInt16 = (data: Uint8Array, offset: number, value: number) => {
    setUint16(data, offset, value < 0 ? value + 0x10000 : value);
  };

  const setUint32 = (data: Uint8Array, offset: number, value: number) => {
    data[offset] = value & 0xff;
    data[offset + 1] = (value >> 8) & 0xff;
    data[offset + 2] = (value >> 16) & 0xff;
    data[offset + 3] = (value >> 24) & 0xff;
  };

  const writeUTFBytes = (data: Uint8Array, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      data[offset + i] = string.charCodeAt(i);
    }
  };

  const handleExtractVocals = () => {
    setIsExtracting(true);
    // This would normally call a backend API for vocal extraction
    // Here we're simulating the process
    
    setTimeout(() => {
      setIsExtracting(false);
      toast({
        title: "Vocals extracted",
        description: "This is a simulated extraction. In a real app, this would call a backend service.",
      });
    }, 2000);
  };

  return (
    <div className="p-4 bg-studio-muted rounded-lg border border-studio-border">
      <h3 className="text-lg font-medium mb-4">Audio Tools</h3>
      
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="default" 
          onClick={handleTrim}
        >
          <Scissors size={16} className="mr-2" />
          Trim Selection
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleSplit}
        >
          <SplitSquareVertical size={16} className="mr-2" />
          Split Audio
        </Button>
        
        <Button 
          variant={isExtracting ? "secondary" : "outline"}
          onClick={handleExtractVocals}
          disabled={isExtracting}
        >
          {isExtracting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-studio-primary border-t-transparent"></span>
              Extracting...
            </>
          ) : (
            <>
              <Mic size={16} className="mr-2" />
              Extract Vocals
            </>
          )}
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleDownload}
        >
          <Download size={16} className="mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default AudioTools;
