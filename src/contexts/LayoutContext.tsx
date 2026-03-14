import { createContext, useContext, useState, ReactNode } from 'react';

type LayoutContextType = {
    backgroundImage: string | null;
    setBackgroundImage: (url: string | null) => void;
    sidebarImages: {
        left: { src: string | null, width?: string };
        right: { src: string | null, width?: string }
    };
    setSidebarImage: (side: 'left' | 'right', src: string | null, width?: string) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayoutContext() {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayoutContext must be used within a LayoutProvider');
    }
    return context;
}

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [sidebarImages, setSidebarImages] = useState<{
        left: { src: string | null, width?: string };
        right: { src: string | null, width?: string }
    }>({
        left: { src: null },
        right: { src: null },
    });

    const setSidebarImage = (side: 'left' | 'right', src: string | null, width?: string) => {
        setSidebarImages(prev => ({ ...prev, [side]: { src, width } }));
    };

    return (
        <LayoutContext.Provider value={{ backgroundImage, setBackgroundImage, sidebarImages, setSidebarImage }}>
            {children}
        </LayoutContext.Provider>
    );
}
