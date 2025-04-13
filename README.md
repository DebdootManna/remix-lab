
# WebAudio Studio

A browser-based audio editing application that allows users to edit audio files without requiring an account or installation.

## Features

- **Audio Editing**: Trim, cut, and split audio files directly in your browser
- **Waveform Visualization**: See your audio files visually and make precise edits
- **8-Band Equalizer**: Fine-tune your audio with a professional-grade 8-band EQ
- **Vocal Extraction**: Simulate separating vocals from instrumental tracks

## How to Use

1. **Upload Audio**: Drag and drop or click to upload your audio file
2. **Edit**: Use the waveform editor to select regions and apply edits
3. **Equalize**: Adjust the 8-band equalizer to enhance your sound
4. **Export**: Download your edited audio file when you're done

## Technical Details

This project is built with:
- React
- TypeScript
- Web Audio API
- Tailwind CSS

## Getting Started

To run this project locally:

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Notes

- This is a client-side application - no data is sent to any server
- Audio processing happens entirely in your browser
- Your work is not saved between sessions - download your edited files before closing

