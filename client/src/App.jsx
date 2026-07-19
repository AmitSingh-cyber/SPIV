import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuroraBackground } from './components/ui/AuroraBackground';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { QuickSearchModal } from './components/Layout/QuickSearchModal';
import { AiChat } from './components/AI/AiChat';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Attendance from './pages/Attendance';
import Projects from './pages/Projects';
import Certificates from './pages/Certificates';
import CredentialsVault from './pages/CredentialsVault';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import FloatingExplorer from './components/FileExplorer/FloatingExplorer';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-slate-500 bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main layout wrapper
const MainLayout = ({ children, onUploadTrigger }) => {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen pl-72 pr-6 py-6 select-none relative overflow-x-hidden">
      {/* Interactive Plexus starfield canvas & glowing nebulae */}
      <AuroraBackground />

      {/* Floating Cyber Sidebar */}
      <Sidebar />

      {/* Main viewport */}
      <div className="max-w-[1400px] mx-auto flex flex-col">
        {/* Top Header widgets hub */}
        <Header 
          onSearchClick={() => setIsSearchOpen(true)}
          onAiClick={() => setIsAiOpen(true)}
          onUploadClick={onUploadTrigger}
          title={window.location.pathname === '/' ? 'System Central' : window.location.pathname.replace('/', '') + ' Core'}
        />

        {/* Dynamic page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* OVERLAY: Cmd+K Command Console */}
      <QuickSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onAiOpen={() => setIsAiOpen(true)}
        onUploadTrigger={onUploadTrigger}
      />

      {/* OVERLAY: AI Drawer Copilot */}
      <AiChat 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
      />
    </div>
  );
};

export const AppContent = () => {
  const { user } = useAuth();
  const [explorerUploadKey, setExplorerUploadKey] = useState(0);

  // Triggering upload file in explorer dynamically by changing a key
  const triggerGlobalUpload = () => {
    setExplorerUploadKey(prev => prev + 1);
  };

  return (
    <>
      <Routes>
        {/* Authentication page */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />

        {/* Dashboard */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* File Manager */}
        <Route 
          path="/files" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                {/* We pass the key so we can trigger a re-render or event in child */}
                <FloatingExplorer key={explorerUploadKey} />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Notes Lab */}
        <Route 
          path="/notes" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                <Notes />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Attendance calculator */}
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                <Attendance />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Projects showcase */}
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                <Projects />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Certificates credentials verification */}
        <Route 
          path="/certificates" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                <Certificates />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Credentials Vault lock */}
        <Route 
          path="/vault" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                <CredentialsVault />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Profile identity variables card */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Host Command Panel */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <MainLayout onUploadTrigger={triggerGlobalUpload}>
                <AdminDashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Fallback route redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* High-fidelity Neon Hot Toasts */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#cbd5e1',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            borderRadius: '12px'
          },
          success: {
            iconTheme: {
              primary: '#00FF99',
              secondary: '#0F172A'
            }
          },
          error: {
            iconTheme: {
              primary: '#FF4D6D',
              secondary: '#0F172A'
            }
          }
        }}
      />
    </>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
