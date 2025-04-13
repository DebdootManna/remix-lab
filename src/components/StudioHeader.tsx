
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw } from 'lucide-react';

interface StudioHeaderProps {
  fileName?: string;
  onReset: () => void;
}

const StudioHeader: React.FC<StudioHeaderProps> = ({ fileName, onReset }) => {
  return (
    <header className="flex justify-between items-center mb-6 pb-4 border-b border-studio-border">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-studio-primary to-studio-accent bg-clip-text text-transparent">
          WebAudio Studio
        </h1>
        {fileName && (
          <p className="text-sm text-muted-foreground mt-1">
            Editing: {fileName}
          </p>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
      >
        <RotateCcw size={16} className="mr-2" />
        Start Over
      </Button>
    </header>
  );
};

export default StudioHeader;
