
import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Move } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Offset dal centro
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  
  // Reset position when opening
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
      setIsMaximized(false);
    }
  }, [isOpen]);

  // Gestione trascinamento
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || isMaximized) return;
      
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMaximized]);

  const startDrag = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    // Reset position when maximizing/restoring logic could be improved, 
    // but keeping offset allows restoring to "last dragged position".
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden"
      // Se clicchi fuori, non chiude automaticamente per evitare errori durante il resize
    >
      <div 
        className={`
          bg-white shadow-2xl flex flex-col transition-all duration-200 ease-out
          ${isMaximized ? 'fixed inset-0 w-full h-full rounded-none' : 'relative rounded-xl animate-fade-in'}
        `}
        style={!isMaximized ? {
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: 'min(90vw, 800px)', // Default width
          height: 'min(90vh, 700px)', // Default height
          resize: 'both', // ABILITA IL RIDIMENSIONAMENTO
          overflow: 'hidden', // Necessario per resize
          minWidth: '400px',
          minHeight: '300px',
          maxWidth: '98vw',
          maxHeight: '98vh'
        } : {}}
      >
        {/* Header - Draggable Handle */}
        <div 
          onMouseDown={startDrag}
          className={`
            flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 select-none
            ${isMaximized ? '' : 'cursor-move'}
          `}
        >
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {!isMaximized && <Move size={16} className="text-gray-400" />}
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMaximize}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              title={isMaximized ? "Ripristina" : "Ingrandisci"}
            >
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
              title="Chiudi"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>
        
        {/* Resize Handle Visual Hint (bottom right) */}
        {!isMaximized && (
          <div className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize pointer-events-none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-gray-400 opacity-50">
              <path d="M21 15L15 21M21 8L8 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
