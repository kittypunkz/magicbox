import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export function SetupPage() {
  const { setup, isSetup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await setup();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // If already set up, show message
  if (isSetup && !success) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[#e6e6e6] mb-2">
            Already Configured
          </h1>
          <p className="text-[#6b6b6b] mb-6">
            Your MagicBox is already set up with a passkey.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-semibold text-[#e6e6e6] mb-2">
            Setup Complete!
          </h1>
          <p className="text-[#6b6b6b] mb-8">
            Your passkey has been registered successfully.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium"
          >
            Continue to MagicBox
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-semibold text-[#e6e6e6] mb-2">
            Setup MagicBox
          </h1>
          <p className="text-[#6b6b6b]">
            Create your first passkey to secure your notes
          </p>
        </div>

        <div className="bg-[#202020] border border-[#2f2f2f] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-[#e6e6e6] mb-4">
            What is a passkey?
          </h2>
          <ul className="space-y-3 text-[#6b6b6b]">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Passwordless authentication using your device</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Use Face ID, Touch ID, or Windows Hello</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Add more devices anytime after setup</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleSetup}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Setting up...</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>Create Passkey</span>
            </>
          )}
        </button>

        <p className="mt-6 text-center text-sm text-[#6b6b6b]">
          You'll be prompted to use your device's biometric authentication
        </p>
      </div>
    </div>
  );
}
