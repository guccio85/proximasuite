import React, { useState, useRef, useEffect } from 'react';

interface LongPressEditableProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
}

export const LongPressEditable: React.FC<LongPressEditableProps> = ({ 
  value, 
  onSave, 
  className = "",
  placeholder = "" 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal state with props
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent triggering row clicks etc if needed, though usually handled in editing state
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      setIsEditing(true);
      setIsPressing(false);
    }, 3000); // 3 seconds
  };

  const cancelPress = () => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue !== value) {
      onSave(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Stop propagation so we don't trigger row clicks when clicking the input
    if (isEditing) {
      e.stopPropagation();
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={`bg-white border border-blue-400 rounded px-1 py-0.5 outline-none text-gray-900 w-full min-w-[100px] shadow-sm ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      className={`cursor-pointer transition-all duration-200 select-none ${className} ${isPressing ? 'opacity-50 scale-95' : ''}`}
      title="Houd 3 seconden ingedrukt om te bewerken"
    >
      {value || <span className="text-gray-400 italic text-xs">Leeg</span>}
    </span>
  );
};