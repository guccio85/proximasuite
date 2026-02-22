
import React, { useState } from 'react';
import { Lock, ShieldCheck, UserCog } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (password: string) => void;
  error?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-800 p-8 text-center border-b border-slate-700">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3">
             <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Planner Management</h1>
          <p className="text-slate-400 text-sm mt-1">Systeem Toegang</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-lg"
                  placeholder="Voer wachtwoord in..."
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 font-medium">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Inloggen
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Admin: admin123 &bull; User: officina
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
