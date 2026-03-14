import { useEffect } from 'react';
import { useLayoutContext } from '../contexts/LayoutContext';

interface BackgroundImgProps {
    src?: string;
}

export default function BackgroundImg({ src }: BackgroundImgProps) {
    const { setBackgroundImage } = useLayoutContext();

    useEffect(() => {
        if (src) {
            setBackgroundImage(src);
        } else {
            setBackgroundImage(null);
        }
        // Cleanup not needed here as we want the state to persist until next comprehensive update
        // or we could say cleaning up on unmount might remove background when scrolled away?
        // Requirement: "The last rendered message containing these tags will determine the current state."
        // React's rendering of markdown happens linearly. If we scroll up/down, components might mount/unmount?
        // Actually, in many chat implementations, messages are kept mounted.
        // However, if we possess a "latest wins" logic, relying on mount effect is tricky if multiple messages render at once.
        // But usually, messages are appended. The last one to mount (at bottom) should win.
        // If we scroll up and a previous message remounts (virtualization), it might overwrite.
        // For now, simple effect is the starting point.
    }, [src, setBackgroundImage]);

    return null;
}
