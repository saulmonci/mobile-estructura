import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaptureForm from './pages/CaptureForm';
import useAuthStore from './store/useAuthStore';

// Protective wrapper for authenticated routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore(state => state.token);
  if (!token) {
    return <Redirect to="/" />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const token = useAuthStore(state => state.token);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/">
            {token ? <Redirect to="/dashboard" /> : <Login />}
          </Route>
          
          <Route exact path="/dashboard">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          
          <Route exact path="/capture">
            <ProtectedRoute>
              <CaptureForm />
            </ProtectedRoute>
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
