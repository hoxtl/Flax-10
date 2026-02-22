import { createContext, useContext, useState } from 'react';

const ResizeHighlightContext = createContext();

export function ResizeHighlightProvider({ children }) {
    const [resizeHighlight, setResizeHighlight] = useState(null);
    return (
        <ResizeHighlightContext.Provider value={{ resizeHighlight, setResizeHighlight }}>
            {children}
        </ResizeHighlightContext.Provider>
    );
}

export function useResizeHighlight() {
    const context = useContext(ResizeHighlightContext);
    if (!context) return { resizeHighlight: null, setResizeHighlight: () => {} };
    return context;
}
