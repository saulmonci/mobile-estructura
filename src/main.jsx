import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { defineCustomElements } from '@ionic/pwa-elements/loader'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialize PWA elements for Capacitor web plugins (like Camera)
defineCustomElements(window);
