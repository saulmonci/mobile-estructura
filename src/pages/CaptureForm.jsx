import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import usePromovidosStore from '../store/usePromovidosStore';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { Network } from '@capacitor/network';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ArrowLeft, Camera as CameraIcon, Save, Sparkles } from 'lucide-react';

export default function CaptureForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const { addPromovido, updatePromovido } = usePromovidosStore();
  const { catalogos, user } = useAuthStore();
  
  const [loadingIne, setLoadingIne] = useState(false);

  const [formData, setFormData] = useState({
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
    municipality_id: editData?.municipality_id || user?.municipality_id || '',
    demarcacion_id: editData?.demarcacion_id || user?.demarcacion_id || '',
    seccion_electoral: editData?.seccion_electoral || '',
    promotor_id: editData?.promotor_id || user?.id || '',
    presidente_id: editData?.presidente_id || user?.presidente_id || ''
  });

  const [fotos, setFotos] = useState({
    ine_frente: editData?.ine_frente || null,
    ine_reverso: editData?.ine_reverso || null,
    foto: editData?.foto || null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const takePicture = async (tipo) => {
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
      alert("Primero toma la foto del INE Frente.");
      return;
    }

    const status = await Network.getStatus();
    if (!status.connected) {
      alert("Por el momento, sin internet no está disponible el servicio de autollenado.");
      return;
    }

    setLoadingIne(true);

    try {
      // Extract base64 and mime type
      const mimeType = fotos.ine_frente.match(/data:(.*?);base64/)[1];
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
          // Remove leading zeros for matching if needed, or exact match
          const seccionNum = matchedSeccion.replace(/^0+/, '');
          const seccionEncontrada = catalogos.secciones.find(s => 
            s.seccion == matchedSeccion || 
            s.numero == matchedSeccion ||
            s.seccion == seccionNum ||
            s.numero == seccionNum
          );
          
          if (seccionEncontrada) {
            deducedMuni = seccionEncontrada.municipality_id;
            matchedSeccion = seccionEncontrada.seccion || seccionEncontrada.numero;
            
            // Try to find demarcacion if we have municipality but no demarcacion from backend
            if (!deducedDemarcacion && catalogos?.demarcaciones) {
               const posiblesDemarcaciones = catalogos.demarcaciones.filter(d => d.municipality_id == deducedMuni);
               if (posiblesDemarcaciones.length === 1) {
                  deducedDemarcacion = posiblesDemarcaciones[0].id;
               }
            }
          }
        }

        setFormData(prev => ({
          ...prev,
          nombre: data.nombre || prev.nombre,
          apellidos: data.apellidos || prev.apellidos,
          clave_elector: data.clave_elector || prev.clave_elector,
          curp: data.curp || prev.curp,
          calle: data.calle || prev.calle,
          numero: data.numero_exterior ? (data.numero_exterior + (data.numero_interior ? ' ' + data.numero_interior : '')) : prev.numero,
          colonia: data.colonia || prev.colonia,
          codigo_postal: data.codigo_postal || prev.codigo_postal,
          seccion_electoral: matchedSeccion || prev.seccion_electoral,
          municipality_id: prev.municipality_id || deducedMuni,
          demarcacion_id: deducedDemarcacion || prev.demarcacion_id,
        }));
        alert("Datos extraídos correctamente.");
      }
    } catch (err) {
      alert("Error al extraer: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingIne(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newRecord = {
      ...formData,
      ...fotos
    };

    if (editData) {
      updatePromovido(editData.local_id, newRecord);
      alert('Promovido actualizado localmente.');
    } else {
      addPromovido(newRecord);
      alert('Promovido guardado localmente.');
    }
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9f9f9' }}>
      <div style={{ padding: '20px', backgroundColor: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0 }}>
          <ArrowLeft size={24} color="#000" />
        </button>
        <h3 style={{ margin: 0 }}>Capturar Promovido</h3>
      </div>

      <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
        
        <h4 style={{ margin: '0 0 10px 0' }}>Fotografías</h4>
        <PhotoUploader 
          label="INE Frente" 
          image={fotos.ine_frente} 
          onCapture={() => takePicture('ine_frente')} 
        />
        
        {fotos.ine_frente && (
          <button 
            type="button" 
            onClick={extractIneData}
            disabled={loadingIne}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #8b5cf6', backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '10px 0 20px 0' }}
          >
            <Sparkles size={18} />
            {loadingIne ? 'Analizando con IA...' : 'Autollenar con IA (Requiere Internet)'}
          </button>
        )}

        <div style={{ marginBottom: '10px' }}></div>

        <PhotoUploader 
          label="INE Reverso" 
          image={fotos.ine_reverso} 
          onCapture={() => takePicture('ine_reverso')} 
        />
        <div style={{ marginBottom: '10px' }}></div>
        <PhotoUploader 
          label="Foto Rostro" 
          image={fotos.foto} 
          onCapture={() => takePicture('foto')} 
        />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <h4 style={{ margin: '10px 0 5px 0' }}>Datos Personales</h4>
          
          <input type="text" name="nombre" placeholder="Nombre(s)*" required value={formData.nombre} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="apellidos" placeholder="Apellidos*" required value={formData.apellidos} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="clave_elector" placeholder="Clave de Elector" value={formData.clave_elector} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="curp" placeholder="CURP" value={formData.curp} onChange={handleInputChange} style={inputStyle} />
          <input type="tel" name="telefono" placeholder="Teléfono*" required value={formData.telefono} onChange={handleInputChange} style={inputStyle} />

          <h4 style={{ margin: '20px 0 5px 0' }}>Dirección</h4>
          <input type="text" name="calle" placeholder="Calle*" required value={formData.calle} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="numero" placeholder="Número*" required value={formData.numero} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="colonia" placeholder="Colonia*" required value={formData.colonia} onChange={handleInputChange} style={inputStyle} />
          <input type="text" name="codigo_postal" placeholder="Código Postal*" required value={formData.codigo_postal} onChange={handleInputChange} style={inputStyle} />

          <h4 style={{ margin: '20px 0 5px 0' }}>Datos Electorales</h4>
          
          <select 
            name="municipality_id" 
            value={formData.municipality_id} 
            onChange={handleInputChange} 
            required 
            disabled 
            style={{ ...inputStyle, backgroundColor: '#eee', color: '#666' }}
          >
            <option value="">Municipio*</option>
            {catalogos?.municipalities?.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select name="demarcacion_id" value={formData.demarcacion_id} onChange={handleInputChange} style={inputStyle}>
            <option value="">Demarcación (Opcional)</option>
            {catalogos?.demarcaciones?.filter(d => !formData.municipality_id || d.municipality_id == formData.municipality_id).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select name="seccion_electoral" value={formData.seccion_electoral} onChange={handleInputChange} required style={inputStyle}>
            <option value="">Sección Electoral*</option>
            {catalogos?.secciones?.filter(s => !formData.municipality_id || s.municipality_id == formData.municipality_id).map(s => (
              <option key={s.seccion} value={s.seccion}>{s.seccion}</option>
            ))}
          </select>

          <button 
            type="submit" 
            style={{ padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#000', color: '#fff', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px', marginBottom: '40px' }}
          >
            <Save size={20} />
            {editData ? 'Actualizar Localmente' : 'Guardar Localmente'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px', backgroundColor: '#fff', color: '#000', outline: 'none' };

function PhotoUploader({ label, image, onCapture }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <span style={{ fontSize: '15px', fontWeight: '500' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {image && <span style={{ color: 'green', fontSize: '12px', fontWeight: 'bold' }}>✓ Capturada</span>}
        <button type="button" onClick={onCapture} style={{ background: '#eee', border: 'none', padding: '10px', borderRadius: '50%', display: 'flex' }}>
          <CameraIcon size={20} color="#000" />
        </button>
      </div>
    </div>
  );
}
