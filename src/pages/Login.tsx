import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { 
  IonPage, 
  IonContent, 
  IonInput, 
  IonButton, 
  IonIcon, 
  IonText,
  IonSpinner,
  IonItem
} from '@ionic/react';
import { logInOutline } from 'ionicons/icons';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

interface LoginFormData {
  email: string;
  password?: string;
}

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const history = useHistory();
  const { setAuth, setCatalogos, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      history.replace('/dashboard');
    }
  }, [token, history]);
  
  const { control, handleSubmit } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/login', data);
      
      if (res.data.success) {
        const { token, user } = res.data.data;
        
        // Set auth first so the axios interceptor picks up the token for subsequent requests
        setAuth(token, user);

        // Fetch catalogs immediately for offline use
        try {
          const catRes = await api.get('/catalogos');
          if (catRes.data.success) {
            setCatalogos(catRes.data.data);
          }
        } catch (catErr) {
          console.error("Error fetching catalogs", catErr);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de conexión. Revisa tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': '#f9f9f9' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '20px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <IonIcon icon={logInOutline} style={{ fontSize: '64px', color: '#6d28d9' }} />
            <h1 style={{ fontWeight: 'bold', margin: '10px 0 5px 0' }}>Acceso Promotores</h1>
            <IonText color="medium">
              <p>Captura Offline</p>
            </IonText>
          </div>

          {error && (
            <IonText color="danger" className="ion-text-center" style={{ marginBottom: '20px', display: 'block' }}>
              {error}
            </IonText>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <Controller
              name="email"
              control={control}
              rules={{ required: 'El correo es requerido' }}
              render={({ field }) => (
                <IonItem style={{ '--border-radius': '8px', '--border-color': '#ddd', '--border-width': '1px', '--border-style': 'solid' }} lines="none">
                  <IonInput 
                    label="Correo electrónico"
                    labelPlacement="floating"
                    type="email" 
                    value={field.value}
                    onIonChange={e => field.onChange(e.detail.value)}
                    required
                  />
                </IonItem>
              )}
            />
            
            <Controller
              name="password"
              control={control}
              rules={{ required: 'La contraseña es requerida' }}
              render={({ field }) => (
                <IonItem style={{ '--border-radius': '8px', '--border-color': '#ddd', '--border-width': '1px', '--border-style': 'solid' }} lines="none">
                  <IonInput 
                    label="Contraseña"
                    labelPlacement="floating"
                    type="password" 
                    value={field.value}
                    onIonChange={e => field.onChange(e.detail.value)}
                    required
                  />
                </IonItem>
              )}
            />
            
            <IonButton 
              type="submit" 
              expand="block" 
              disabled={loading}
              style={{ marginTop: '20px', '--border-radius': '8px', height: '50px', '--background': '#000' }}
            >
              {loading ? <IonSpinner name="crescent" /> : 'Entrar e Inicializar'}
            </IonButton>
          </form>
          
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
