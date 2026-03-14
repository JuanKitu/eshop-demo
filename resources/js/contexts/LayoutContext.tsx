import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type LayoutPosition = 'left' | 'right';

type LayoutContextType = {
    position: LayoutPosition;
    updatePosition: (val: LayoutPosition) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    const [position, setPosition] = useState<LayoutPosition>('left');

    useEffect(() => {
        const storedPosition = localStorage.getItem('layoutPosition') as LayoutPosition;

        if (storedPosition === 'left' || storedPosition === 'right') {
            setPosition(storedPosition);
        }
    }, []);

    // Sync sidebar position with RTL/LTR direction
    useEffect(() => {
        const handleDirectionChange = () => {
            const direction = document.documentElement.dir;
            const newPosition = direction === 'rtl' ? 'right' : 'left';
            setPosition(newPosition);
            localStorage.setItem('layoutPosition', newPosition);
        };

        // Initial check
        handleDirectionChange();

        // Watch for direction changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
                    handleDirectionChange();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir']
        });

        return () => observer.disconnect();
    }, []);

    const updatePosition = (val: LayoutPosition) => {
        setPosition(val);
        localStorage.setItem('layoutPosition', val);
    };

    return <LayoutContext.Provider value={{ position, updatePosition }}>{children}</LayoutContext.Provider>;
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) throw new Error('useLayout must be used within LayoutProvider');
    return context;
};
