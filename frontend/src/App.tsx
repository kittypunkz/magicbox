import { Navigate, Route, Routes } from 'react-router-dom';
import type React from 'react';
import { Agentation } from 'agentation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { Shell } from './shell/Shell';
import './App.css';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mb-base">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-mb-accent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

  if (isTestMode) return <>{children}</>;
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SetupRoute({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/setup" element={<SetupRoute><SetupPage /></SetupRoute>} />
      <Route path="/" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/folder/:folderId" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/note/:noteId" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/tasks/:taskId" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/ask" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/brief" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/bookmarks/:bookmarkId" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const isDev = import.meta.env.VITE_AGENTATION === 'true';

  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      {isDev && <Agentation />}
    </AuthProvider>
  );
}

export default App;
