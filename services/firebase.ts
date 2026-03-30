import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";

const firebaseConfig = { 
  apiKey: "AIzaSyAdkfDuFyPfbPJ-aw_SkIR3ANzbqONUZrA", 
  authDomain: "odontoapp-b45c1.firebaseapp.com", 
  projectId: "odontoapp-b45c1", 
  storageBucket: "odontoapp-b45c1.firebasestorage.app", 
  messagingSenderId: "326395507192", 
  appId: "1:326395507192:web:e7593bd9655df53e71660d", 
  measurementId: "G-6L4JV4NCKE"
 }; 
 
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});