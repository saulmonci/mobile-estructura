import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonAvatar,
  IonBadge,
  IonFab,
  IonFabButton,
  IonText,
  IonAlert,
  IonToast
} from '@ionic/react';
import { 
  logOutOutline, 
  peopleOutline, 
  wifiOutline, 
  add, 
  personOutline, 
  callOutline, 
  locationOutline, 
  createOutline, 
  trashOutline,
  cloudUploadOutline
} from 'ionicons/icons';
import useAuthStore from '../store/useAuthStore';
import usePromovidosStore, { Promovido } from '../store/usePromovidosStore';
import { Network } from '@capacitor/network';
import api from '../api/axios';

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { user, logout } = useAuthStore();
  const { promovidos, removeSynced, removePromovido } = usePromovidosStore();
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  useEffect(() => {
    Network.getStatus().then(status => setIsOnline(status.connected));

    const listener = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);



  const syncData = async () => {
    if (!isOnline) {
      setToastMessage('No hay conexión a internet.');
      return;
    }
    
    const pending = promovidos.filter(p => p.status === 'pending_sync');
    if (pending.length === 0) {
      setToastMessage('No hay datos pendientes por sincronizar.');
      return;
    }

    setSyncing(true);
    setToastMessage('Sincronizando...');
    
    try {
      const res = await api.post('/sync', { promovidos: pending });
      if (res.data.success) {
        const { synced_ids, errors } = res.data.data;
        
        if (synced_ids && synced_ids.length > 0) {
          removeSynced(synced_ids);
        }

        if (errors && errors.length > 0) {
          setToastMessage(`Sincronizado con algunos errores: ${errors.length} fallaron.`);
        } else {
          setToastMessage('Sincronización completada exitosamente.');
        }
      }
    } catch (err: any) {
      setToastMessage('Error al sincronizar: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Hola, {user?.name?.split(' ')[0]}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowConfirmLogout(true)} disabled={!isOnline}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f9f9f9' }}>
        
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', color: isOnline ? 'green' : 'red' }}>
          <IonIcon icon={wifiOutline} />
          <IonText>{isOnline ? 'Online' : 'Offline'}</IonText>
        </div>

        {/* Stats Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <IonIcon icon={peopleOutline} style={{ fontSize: '32px', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '36px', margin: '0' }}>{promovidos.length}</h1>
          <IonText color="medium">
            <p style={{ margin: '5px 0 0 0' }}>Promovidos pendientes</p>
          </IonText>
        </div>

        {/* Sincronizar Action */}
        <IonButton 
          expand="block" 
          onClick={syncData}
          disabled={!isOnline || syncing || promovidos.length === 0}
          color="dark"
          style={{ marginBottom: '20px', '--border-radius': '8px' }}
        >
          <IonIcon slot="start" icon={cloudUploadOutline} />
          {syncing ? 'Enviando...' : 'Sincronizar Datos'}
        </IonButton>

        {/* Promovidos List */}
        <IonList style={{ background: 'transparent' }}>
          {promovidos.map((p) => (
            <IonItem key={p.local_id} style={{ '--border-radius': '8px', marginBottom: '10px', '--background': '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} lines="none">
              <div style={{ width: '100%', padding: '10px 0' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <IonAvatar style={{ backgroundColor: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <IonIcon icon={personOutline} style={{ fontSize: '24px', color: '#64748b' }} />
                    </IonAvatar>
                    <div>
                      <h3 style={{ margin: '0 0 3px 0', fontSize: '16px', fontWeight: 'bold' }}>{(p.nombre + ' ' + p.apellidos).toUpperCase()}</h3>
                      <IonText color="medium" style={{ fontSize: '13px' }}>Promovido</IonText>
                    </div>
                  </div>
                  <IonBadge color="warning">Pendiente</IonBadge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IonIcon icon={personOutline} /> <span>CURP: <strong>{p.curp || '-'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IonIcon icon={callOutline} /> <span>Tel: {p.telefono}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IonIcon icon={locationOutline} /> 
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.calle} {p.numero} (CP: {p.codigo_postal})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <IonButton 
                    fill="outline" 
                    color="medium" 
                    expand="block" 
                    style={{ flex: 1 }}
                    onClick={() => history.push({ pathname: '/capture', state: { editData: p } })}
                  >
                    <IonIcon slot="start" icon={createOutline} />
                    Editar
                  </IonButton>
                  <IonButton 
                    fill="outline" 
                    color="danger" 
                    expand="block" 
                    style={{ flex: 1 }}
                    onClick={() => setShowConfirmDelete(p.local_id)}
                  >
                    <IonIcon slot="start" icon={trashOutline} />
                    Eliminar
                  </IonButton>
                </div>

              </div>
            </IonItem>
          ))}
        </IonList>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton color="dark" onClick={() => history.push('/capture')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setToastMessage('')}
        />

        <IonAlert
          isOpen={!!showConfirmDelete}
          header={'¿Eliminar registro local?'}
          message={'Esta acción no se puede deshacer.'}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => setShowConfirmDelete(null)
            },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: () => {
                if (showConfirmDelete) {
                  removePromovido(showConfirmDelete);
                  setShowConfirmDelete(null);
                }
              }
            }
          ]}
          onDidDismiss={() => setShowConfirmDelete(null)}
        />

        <IonAlert
          isOpen={showConfirmLogout}
          header={'¿Cerrar Sesión?'}
          message={'¿Estás seguro de que deseas cerrar sesión? Necesitarás internet para volver a entrar.'}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => setShowConfirmLogout(false)
            },
            {
              text: 'Cerrar Sesión',
              role: 'destructive',
              handler: () => {
                setShowConfirmLogout(false);
                logout();
                history.push('/');
              }
            }
          ]}
          onDidDismiss={() => setShowConfirmLogout(false)}
        />

      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
