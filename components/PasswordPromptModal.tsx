
import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Check } from 'lucide-react';

interface PasswordPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title?: string;
  checkPassword?: (password: string) => boolean;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Beveiligde Actie",
  checkPassword
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      // Focus input after a short delay to allow animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if master key (1111) or custom check passes
    if (password === '1111' || (checkPassword && checkPassword(password))) {
        onConfirm(password);
        // Do not reset password here immediately to avoid UI glitch before closing
    } else {
        setError(true);
        // Shake animation effect could be added here
        setTimeout(() => setError(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in border border-gray-200">
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Lock size={18} className="text-red-500" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Voer het beheerderswachtwoord in om door te gaan.
          </p>
          
          <div className="relative">
            <input 
              ref={inputRef}
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className={`w-full pl-4 pr-10 py-3 border rounded-lg outline-none text-lg tracking-widest font-mono transition-all ${error ? 'border-red-500 ring-2 ring-red-100 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
              placeholder="••••"
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1 animate-pulse">
                <X size={12} /> Wachtwoord onjuist
            </p>
          )}

          <div className="flex gap-2 mt-6">
            <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
                Annuleren
            </button>
            <button 
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
                <Check size={18} /> Bevestigen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
