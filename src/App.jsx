import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaptureForm from './pages/CaptureForm';
import useAuthStore from './store/useAuthStore';

// Protective wrapper for authenticated routes
const ProtectedRoute = ({ children }) => {
  const token = useAuthStore(state => state.token);
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const token = useAuthStore(state => state.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/capture" 
          element={
            <ProtectedRoute>
              <CaptureForm />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
