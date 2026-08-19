import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase config is read from VITE_ environment variables with fallback defaults.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD6yhngorYwZpdGVgIwY8KFodsxTG55r-U",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "breathometer6.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "breathometer6",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "breathometer6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "124093463358",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:124093463358:web:df84c2cf31506bbf144a6f",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SYLYY7MDXE",
};

// Initialize Firebase safely
let app = null;
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } else {
    console.warn("[Firebase] Missing required Firebase configuration (apiKey / projectId).");
  }
} catch (error) {
  console.warn("[Firebase] Initialization failed:", error);
}

// Initialize Analytics (only in browser environment & if supported)
let analytics = null;
if (typeof window !== "undefined" && app) {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn("[Firebase Analytics] Init failed:", err);
      }
    }
  }).catch((err) => {
    console.warn("[Firebase Analytics] Support check failed:", err);
  });
}

export { app, analytics, firebaseConfig };

