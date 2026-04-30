import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export function SetupPage() {
  const { setup, isSetup } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await setup(password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSetup && !success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[#e6e6e6] mb-2">Already Configured</h1>
          <p className="text-[#888888] mb-6">Your MagicBox already has a master password.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-[#0a0a0a] rounded-lg transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-semibold text-[#e6e6e6] mb-2">Setup Complete!</h1>
          <p className="text-[#888888] mb-8">Your master password has been set.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#6366f1] hover:bg-[#4f46e5] text-[#0a0a0a] rounded-xl transition-colors font-medium"
          >
            Continue to MagicBox
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#6366f1]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-[#6366f1]" />
          </div>
          <h1 className="text-3xl font-semibold text-[#e6e6e6] mb-2">Setup MagicBox</h1>
          <p className="text-[#888888]">Create a master password to secure your notes</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Master password (min 8 characters)"
              autoFocus
              required
              minLength={8}
              className="w-full px-4 py-3 pr-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[#e6e6e6] placeholder-[#5a5a5a] focus:outline-none focus:border-[#6366f1] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a5a] hover:text-[#888888]"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <input
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            required
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[#e6e6e6] placeholder-[#5a5a5a] focus:outline-none focus:border-[#6366f1] transition-colors"
          />

          <button
            type="submit"
            disabled={isLoading || !password || !confirm}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#6366f1] hover:bg-[#4f46e5] text-[#0a0a0a] disabled:opacity-50 rounded-xl transition-all font-medium text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Setting up...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Create Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
