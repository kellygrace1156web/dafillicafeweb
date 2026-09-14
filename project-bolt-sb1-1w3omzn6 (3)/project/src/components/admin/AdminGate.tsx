import { useState } from 'react';
import { Lock, ArrowRight, Coffee } from 'lucide-react';
import { siteConfig } from '@/config/siteConfig';

type AdminGateProps = {
  onUnlock: () => void;
  onBack: () => void;
};

export function AdminGate({ onUnlock, onBack }: AdminGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === siteConfig.adminPassword) {
      sessionStorage.setItem('admin_unlocked', '1');
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-sage-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button
          onClick={onBack}
          className="text-sage-200/70 hover:text-sage-200 text-sm font-medium mb-6 flex items-center gap-1.5 transition-colors"
        >
          <Coffee className="w-4 h-4" /> Back to menu
        </button>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/15 p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-sage-500/20 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-sage-300" />
          </div>

          <h1 className="text-xl font-bold text-white text-center mb-1">Admin Access</h1>
          <p className="text-sm text-stone-300 text-center mb-6">
            Enter your password to manage the cafe
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="Enter password"
                autoFocus
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white text-center text-lg tracking-widest outline-none transition-colors placeholder:text-stone-400 placeholder:text-sm placeholder:tracking-normal ${
                  error
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-white/20 focus:border-sage-400'
                }`}
              />
              {error && (
                <p className="text-xs text-red-400 mt-2 text-center">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-sage-500 hover:bg-sage-400 text-stone-900 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02]"
            >
              Unlock Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
