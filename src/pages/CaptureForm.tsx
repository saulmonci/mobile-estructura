import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import usePromovidosStore, { Promovido } from '../store/usePromovidosStore';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { Network } from '@capacitor/network';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonButton, 
  IonIcon, 
  IonSpinner,
  IonToast,
  IonList,
  IonListHeader
} from '@ionic/react';
import { cameraOutline, saveOutline, sparklesOutline, checkmarkCircle } from 'ionicons/icons';

const CaptureForm: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ editData?: Promovido }>();
  const editData = location.state?.editData;
  const { addPromovido, updatePromovido } = usePromovidosStore();
  const { catalogos, user } = useAuthStore();
  
  const [loadingIne, setLoadingIne] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const { control, handleSubmit, setValue, watch } = useForm<Partial<Promovido>>({
    defaultValues: {
      nombre: editData?.nombre || '',
      apellidos: editData?.apellidos || '',
      clave_elector: editData?.clave_elector || '',
      curp: editData?.curp || '',
      calle: editData?.calle || '',
      numero: editData?.numero || '',
      colonia: editData?.colonia || '',
      codigo_postal: editData?.codigo_postal || '',
      telefono: editData?.telefono || '',
      state_id: editData?.state_id || user?.state_id || '',
      municipality_id: editData?.municipality_id || user?.municipality_id || user?.municipio_id || user?.promotor?.municipality_id || user?.promotor?.municipio_id || '',
      demarcacion_id: editData?.demarcacion_id || user?.demarcacion_id || user?.demarcacion?.id || '',
      seccion_electoral: editData?.seccion_electoral || '',
      promotor_id: editData?.promotor_id || user?.id || '',
      presidente_id: editData?.presidente_id || user?.presidente_id || ''
    }
  });

  const municipality_id = watch('municipality_id');
  const demarcacion_id = watch('demarcacion_id');

  const [fotos, setFotos] = useState({
    ine_frente: editData?.ine_frente || null as string | null,
    ine_reverso: editData?.ine_reverso || null as string | null,
    foto: editData?.foto || null as string | null
  });

  const takePicture = async (tipo: keyof typeof fotos) => {
    try {
      const image = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      setFotos(prev => ({
        ...prev,
        [tipo]: `data:image/${image.format};base64,${image.base64String}`
      }));
    } catch (e) {
      console.log('User cancelled or camera error', e);
    }
  };

  const extractIneData = async () => {
    if (!fotos.ine_frente) {
      setToastMsg("Primero toma la foto del INE Frente.");
      return;
    }

    const status = await Network.getStatus();
    if (!status.connected) {
      setToastMsg("Sin internet no está disponible el servicio de autollenado.");
      return;
    }

    setLoadingIne(true);

    try {
      const mimeType = fotos.ine_frente.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
      const base64Str = fotos.ine_frente.split(',')[1];
      
      const byteCharacters = atob(base64Str);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      const blob = new Blob(byteArrays, { type: mimeType });

      const form = new FormData();
      form.append('ine_image', blob, 'ine.jpg');

      const res = await api.post('/ine-extract', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success && res.data.data) {
        const data = res.data.data;

        let deducedMuni = '';
        let deducedDemarcacion = data.demarcacion_id || '';
        let matchedSeccion = data.seccion_electoral || '';

        if (matchedSeccion && catalogos?.secciones) {
          const seccionNum = matchedSeccion.replace(/^0+/, '');
          const seccionEncontrada = catalogos.secciones.find((s: any) => 
            s.seccion == matchedSeccion || 
            s.numero == matchedSeccion ||
            s.seccion == seccionNum ||
            s.numero == seccionNum
          );
          
          if (seccionEncontrada) {
            deducedMuni = seccionEncontrada.municipality_id;
            matchedSeccion = seccionEncontrada.seccion || seccionEncontrada.numero;
            
            if (!deducedDemarcacion && seccionEncontrada.demarcacion_id) {
               deducedDemarcacion = seccionEncontrada.demarcacion_id;
            } else if (!deducedDemarcacion && catalogos?.demarcaciones) {
               const posiblesDemarcaciones = catalogos.demarcaciones.filter((d: any) => d.municipality_id == deducedMuni);
               if (posiblesDemarcaciones.length === 1) {
                  deducedDemarcacion = posiblesDemarcaciones[0].id;
               }
            }
          }
        }

        if (data.nombre) setValue('nombre', data.nombre);
        if (data.apellidos) setValue('apellidos', data.apellidos);
        if (data.clave_elector) setValue('clave_elector', data.clave_elector);
        if (data.curp) setValue('curp', data.curp);
        if (data.calle) setValue('calle', data.calle);
        if (data.numero_exterior) {
          setValue('numero', data.numero_exterior + (data.numero_interior ? ' ' + data.numero_interior : ''));
        }
        if (data.colonia) setValue('colonia', data.colonia);
        if (data.codigo_postal) setValue('codigo_postal', data.codigo_postal);
        if (matchedSeccion) setValue('seccion_electoral', matchedSeccion);
        if (deducedMuni) setValue('municipality_id', deducedMuni);
        if (deducedDemarcacion) setValue('demarcacion_id', deducedDemarcacion);

        setToastMsg("Datos extraídos correctamente.");
      }
    } catch (err: any) {
      setToastMsg("Error al extraer: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingIne(false);
    }
  };

  const onSubmit = (data: Partial<Promovido>) => {
    const newRecord = {
      ...data,
      ...fotos
    } as Omit<Promovido, 'local_id' | 'status'>;

    if (editData?.local_id) {
      updatePromovido(editData.local_id, newRecord);
      setToastMsg('Promovido actualizado localmente.');
    } else {
      addPromovido(newRecord);
      setToastMsg('Promovido guardado localmente.');
    }
    
    setTimeout(() => {
      history.push('/dashboard');
    }, 1000);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>{editData ? 'Editar Promovido' : 'Capturar Promovido'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f9f9f9' }}>
        
        <IonListHeader style={{ paddingLeft: 0, marginTop: 0 }}>
          <IonLabel style={{ fontSize: '18px', fontWeight: 'bold' }}>Fotografías</IonLabel>
        </IonListHeader>

        <PhotoUploader 
          label="INE Frente" 
          image={fotos.ine_frente} 
          onCapture={() => takePicture('ine_frente')} 
        />
        
        {fotos.ine_frente && (
          <IonButton 
            expand="block" 
            fill="outline" 
            color="tertiary" 
            onClick={extractIneData}
            disabled={loadingIne}
            style={{ margin: '15px 0' }}
          >
            {loadingIne ? <IonSpinner name="dots" /> : (
              <>
                <IonIcon slot="start" icon={sparklesOutline} />
                Autollenar con IA
              </>
            )}
          </IonButton>
        )}

        <div style={{ marginBottom: '10px' }} />

        <PhotoUploader 
          label="INE Reverso" 
          image={fotos.ine_reverso} 
          onCapture={() => takePicture('ine_reverso')} 
        />
        <div style={{ marginBottom: '10px' }} />
        <PhotoUploader 
          label="Foto Rostro" 
          image={fotos.foto} 
          onCapture={() => takePicture('foto')} 
        />

        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
          
          <IonListHeader style={{ paddingLeft: 0, marginTop: '20px' }}>
            <IonLabel style={{ fontSize: '18px', fontWeight: 'bold' }}>Datos Personales</IonLabel>
          </IonListHeader>

          <IonList style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <Controller
              name="nombre"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem>
                  <IonInput label="Nombre(s)*" labelPlacement="floating" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
            <Controller
              name="apellidos"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem>
                  <IonInput label="Apellidos*" labelPlacement="floating" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
            <Controller
              name="clave_elector"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem>
                  <IonInput label="Clave de Elector*" labelPlacement="floating" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
            <Controller
              name="curp"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem>
                  <IonInput label="CURP*" labelPlacement="floating" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
            <Controller
              name="telefono"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem lines="none">
                  <IonInput label="Teléfono*" labelPlacement="floating" type="tel" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
          </IonList>

          <IonListHeader style={{ paddingLeft: 0, marginTop: '20px' }}>
            <IonLabel style={{ fontSize: '18px', fontWeight: 'bold' }}>Dirección</IonLabel>
          </IonListHeader>
          
          <IonList style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <Controller
              name="calle"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem>
                  <IonInput label="Calle*" labelPlacement="floating" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
            <Controller
              name="numero"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem>
                  <IonInput label="Número*" labelPlacement="floating" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
            <Controller
              name="colonia"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem>
                  <IonInput label="Colonia*" labelPlacement="floating" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
            <Controller
              name="codigo_postal"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem lines="none">
                  <IonInput label="Código Postal*" labelPlacement="floating" required value={field.value} onIonChange={e => field.onChange(e.detail.value)} />
                </IonItem>
              )}
            />
          </IonList>

          <IonListHeader style={{ paddingLeft: 0, marginTop: '20px' }}>
            <IonLabel style={{ fontSize: '18px', fontWeight: 'bold' }}>Datos Electorales</IonLabel>
          </IonListHeader>

          <IonList style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <Controller
              name="municipality_id"
              control={control}
              render={({ field }) => (
                <IonItem>
                  <IonInput 
                    label="Municipio*" 
                    labelPlacement="floating" 
                    value={catalogos?.municipalities?.find((m: any) => m.id == field.value)?.name || user?.municipality?.nombre || field.value || 'No asignado al promotor'} 
                    readonly={true}
                    style={{ color: '#64748b' }}
                  />
                </IonItem>
              )}
            />

            <Controller
              name="demarcacion_id"
              control={control}
              render={({ field }) => (
                <IonItem>
                  <IonInput 
                    label="Demarcación*" 
                    labelPlacement="floating" 
                    value={catalogos?.demarcaciones?.find((d: any) => d.id == field.value)?.nombre || catalogos?.demarcaciones?.find((d: any) => d.id == field.value)?.name || user?.demarcacion?.nombre || field.value || 'No asignada al promotor'} 
                    readonly={true}
                    style={{ color: '#64748b' }}
                  />
                </IonItem>
              )}
            />

            <Controller
              name="seccion_electoral"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <IonItem lines="none">
                  <IonSelect 
                    label="Sección Electoral*" 
                    labelPlacement="floating"
                    value={field.value} 
                    onIonChange={e => field.onChange(e.detail.value)}
                  >
                    {catalogos?.secciones?.filter((s: any) => !demarcacion_id || s.demarcacion_id == demarcacion_id).map((s: any) => (
                      <IonSelectOption key={s.seccion} value={s.seccion}>{s.seccion}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              )}
            />
          </IonList>

          <IonButton 
            type="submit" 
            expand="block" 
            color="dark" 
            style={{ marginTop: '30px', marginBottom: '40px', '--border-radius': '8px', height: '50px' }}
          >
            <IonIcon slot="start" icon={saveOutline} />
            {editData ? 'Actualizar Localmente' : 'Guardar Localmente'}
          </IonButton>
        </form>

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          duration={3000}
          onDidDismiss={() => setToastMsg('')}
        />
      </IonContent>
    </IonPage>
  );
}

const PhotoUploader: React.FC<{ label: string, image: string | null, onCapture: () => void }> = ({ label, image, onCapture }) => {
  return (
    <IonItem style={{ '--border-radius': '8px', '--background': '#fff', border: '1px solid #eee' }} lines="none">
      <IonLabel>{label}</IonLabel>
      <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {image && (
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--ion-color-success)', fontSize: '12px', fontWeight: 'bold' }}>
            <IonIcon icon={checkmarkCircle} style={{ marginRight: '4px' }} />
            Capturada
          </div>
        )}
        <IonButton fill="clear" onClick={onCapture} color="dark">
          <IonIcon slot="icon-only" icon={cameraOutline} />
        </IonButton>
      </div>
    </IonItem>
  );
}

export default CaptureForm;
