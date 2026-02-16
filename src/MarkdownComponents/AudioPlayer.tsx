import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

export default function AudioPlayer({ src, caption }: { src: string; caption?: string }) {
  console.log('AudioPlayer rendering', src);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-fit my-2">
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-neutral-200 hover:bg-neutral-300 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div className="flex flex-col">
        {caption && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{caption}</span>}
        <audio
          ref={audioRef}
          src={src}
          onEnded={handleEnded}
          className="hidden"
        />
      </div>
    </div>
  );
}

// Usage example:
// <AudioPlayer src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" caption="Demo Song" />
