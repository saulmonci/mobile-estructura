import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import usePromovidosStore from '../store/usePromovidosStore';
import { Network } from '@capacitor/network';
import api from '../api/axios';
import { Users, Wifi, WifiOff, LogOut, UploadCloud, Plus, User, Phone, MapPin, UserCircle, Edit2, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { promovidos, removeSynced, removePromovido } = usePromovidosStore();
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check initial network status
    Network.getStatus().then(status => setIsOnline(status.connected));

    // Listen for network changes
    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    return () => {
      Network.removeAllListeners();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const syncData = async () => {
    if (!isOnline) {
      setMessage('No hay conexión a internet.');
      return;
    }
    
    const pending = promovidos.filter(p => p.status === 'pending_sync');
    if (pending.length === 0) {
      setMessage('No hay datos pendientes por sincronizar.');
      return;
    }

    setSyncing(true);
    setMessage('Sincronizando...');
    
    try {
      const res = await api.post('/sync', { promovidos: pending });
      if (res.data.success) {
        const { synced_ids, errors } = res.data.data;
        
        // Remove successfully synced records from local store
        if (synced_ids && synced_ids.length > 0) {
          removeSynced(synced_ids);
        }

        if (errors && errors.length > 0) {
          setMessage(`Sincronizado con algunos errores: ${errors.length} fallaron.`);
        } else {
          setMessage('Sincronización completada exitosamente.');
        }
      }
    } catch (err) {
      setMessage('Error al sincronizar: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Hola, {user?.name?.split(' ')[0]}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: isOnline ? 'green' : 'red', marginTop: '5px' }}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none' }}>
          <LogOut size={24} color="#555" />
        </button>
      </div>

      {/* Stats Card */}
      <div style={{ backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '30px' }}>
        <Users size={32} color="#000" style={{ marginBottom: '10px' }} />
        <h1 style={{ fontSize: '36px', margin: '0' }}>{promovidos.length}</h1>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Promovidos pendientes</p>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ padding: '10px', backgroundColor: '#e0f7fa', color: '#006064', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {/* Promovidos List */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
        {promovidos.map((p) => (
          <div key={p.local_id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginBottom: '15px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: '#cbd5e1', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <User size={30} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 3px 0', fontSize: '15px', color: '#1e293b' }}>{(p.nombre + ' ' + p.apellidos).toUpperCase()}</h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Promovido</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', color: '#334155' }}>
                <div style={{ width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                Pendiente
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={15} /> <span style={{ width: '70px' }}>CURP:</span> <strong style={{ color: '#1e293b' }}>{p.curp || '-'}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={15} /> <span style={{ width: '70px' }}>Tel:</span> <span style={{ color: '#1e293b' }}>{p.telefono}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={15} style={{ flexShrink: 0 }} /> <span style={{ width: '70px', flexShrink: 0 }}>Ubicación:</span> <span style={{ color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.calle} {p.numero} (CP: {p.codigo_postal})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCircle size={15} /> <span style={{ width: '70px' }}>Operador:</span> <strong style={{ color: '#ea580c' }}>{user?.name?.toUpperCase()}</strong>
              </div>
            </div>

            {/* Actions */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex' }}>
              <button onClick={() => navigate('/capture', { state: { editData: p } })} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: 'none', borderRight: '1px solid #f1f5f9', color: '#334155', fontWeight: '500', fontSize: '14px', cursor: 'pointer' }}>
                <Edit2 size={16} /> Editar
              </button>
              <button onClick={() => { if(window.confirm('¿Estás seguro de eliminar este registro local?')) removePromovido(p.local_id) }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: 'none', color: '#ef4444', fontWeight: '500', fontSize: '14px', cursor: 'pointer' }}>
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: 'auto', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/capture')}
          style={{ padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#000', color: '#fff', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <Plus size={20} />
          Nuevo Promovido
        </button>

        <button 
          onClick={syncData}
          disabled={!isOnline || syncing || promovidos.length === 0}
          style={{ padding: '15px', borderRadius: '8px', border: '1px solid #000', backgroundColor: '#fff', color: '#000', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: (!isOnline || syncing || promovidos.length === 0) ? 0.5 : 1 }}
        >
          <UploadCloud size={20} />
          {syncing ? 'Enviando...' : 'Sincronizar Datos'}
        </button>
      </div>

    </div>
  );
}
