import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, setCatalogos } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/login', { email, password });
      
      if (res.data.success) {
        const { token, user } = res.data.data;
        setAuth(token, user);
        
        // Fetch catalogs immediately for offline use
        const catRes = await api.get('/catalogos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (catRes.data.success) {
          setCatalogos(catRes.data.data);
        }
        
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error de conexión. Revisa tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <LogIn size={48} color="#000" />
        <h1>Acceso Promotores</h1>
        <p>Captura Offline</p>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Correo electrónico" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#000', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}
        >
          {loading ? 'Ingresando...' : 'Entrar e Inicializar'}
        </button>
      </form>
    </div>
  );
}
