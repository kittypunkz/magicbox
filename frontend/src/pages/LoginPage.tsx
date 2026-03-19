import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Key, Loader2, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { login, isSetup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // If not set up yet, show message
  if (!isSetup) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[#e6e6e6] mb-2">
            Setup Required
          </h1>
          <p className="text-[#6b6b6b] mb-6">
            This MagicBox instance needs to be configured first.
          </p>
          <a
            href="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go to Setup
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Key className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-semibold text-[#e6e6e6] mb-2">
            Welcome Back
          </h1>
          <p className="text-[#6b6b6b]">
            Sign in with your passkey
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <Key className="w-5 h-5" />
              <span>Sign in with Passkey</span>
            </>
          )}
        </button>

        <p className="mt-6 text-center text-sm text-[#6b6b6b]">
          Use Face ID, Touch ID, or Windows Hello to sign in
        </p>
      </div>
    </div>
  );
}
