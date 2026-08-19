import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { api } from "./api";
import { app, firebaseConfig } from "./firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BCfM-iZvqP3kNx4bbNksTc9mBKqp5iq2CEnGHMmRfbZgJuYSUsyPFWH68o0oQoHKi_-oVIB1dyNW2CfXRrs33Y0";
if (!VAPID_KEY) {
  console.warn("[Push] VITE_FIREBASE_VAPID_KEY is not set — push notifications will be disabled.");
}

export const initPushNotifications = async () => {
  try {
    if (!app) {
      console.warn("[Push] Firebase app is not initialized.");
      return;
    }

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn("This browser does not support desktop notification");
      return;
    }

    const messagingSupported = await isSupported().catch(() => false);
    if (!messagingSupported) {
      console.warn("Firebase Messaging is not supported in this browser environment.");
      return;
    }

    const messaging = getMessaging(app);

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn("Notification permission denied");
      return;
    }

    // Get FCM registration token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      console.info("FCM Token retrieved successfully");
      // Send token to backend
      await api.post("/push/register", { token, platform: "web" });
    } else {
      console.warn("No registration token available. Request permission to generate one.");
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      console.log('Message received during foreground. ', payload);
    });

  } catch (error) {
    console.error("An error occurred while initializing push notifications:", error);
  }
};

