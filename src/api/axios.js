import axios from "axios";
import useAuthStore from "../store/useAuthStore";

import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();
const isEnv = import.meta.env.MODE;

// Si está en el celular (Android/iOS) o en producción web -> usa el servidor remoto.
// Si está en desarrollo web (navegador) -> usa localhost.
const BASE_URL =
  isNative || isEnv === "production"
    ? "https://orion.myddns.me/api/mobile"
    : "http://localhost:3002/api/mobile";

const api = axios.create({
  baseURL: "https://orion.myddns.me/api/mobile",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // withCredentials: true // Uncomment if using cookie-based Sanctum, but we use Token-based
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
