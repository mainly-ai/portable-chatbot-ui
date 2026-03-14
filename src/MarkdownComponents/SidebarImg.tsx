import { useEffect } from 'react';
import { useLayoutContext } from '../contexts/LayoutContext';

interface SidebarImgProps {
    src?: string;
    left?: string | boolean; // Markdown attributes often come as strings
    right?: string | boolean;
    width?: string;
}

export default function SidebarImg({ src, left, right, width }: SidebarImgProps) {
    const { setSidebarImage } = useLayoutContext();

    useEffect(() => {
        const url = src || null;

        // Check for presence of attributes. 
        // In markdown-to-jsx, boolean attributes might be true or empty string? 
        // Usually if `left` is present it's true-ish.
        // The prompt says `left=1 right=1`.

        if (left) {
            setSidebarImage('left', url, width);
        }
        if (right) {
            setSidebarImage('right', url, width);
        }

    }, [src, left, right, width, setSidebarImage]);

    return null;
}
