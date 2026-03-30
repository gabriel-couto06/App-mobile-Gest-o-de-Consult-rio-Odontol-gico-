import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "expo-router";
import { auth } from "../services/firebase";
import { Alert } from "react-native";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
  sendPasswordResetEmail
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { ativarBiometria, biometriaAtiva, autenticarBiometria } from "../services/biometria"
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  user: User | null;
  login: (email: string, senha: string) => Promise<User | null>;
  register: (email: string, senha: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

 useEffect(() => {

  const unsubscribe = onAuthStateChanged(auth, async (usuario) => {

    if (usuario) {

      const jaPerguntou = await AsyncStorage.getItem("biometria_pergunta");

      if (!jaPerguntou) {

        Alert.alert(
          "Ativar acesso rápido? 🔐",
          "Você poderá entrar usando biometria sem digitar senha.",
          [
            {
              text: "Não",
              onPress: async () => {
                await AsyncStorage.setItem("biometria_pergunta", "true");
              }
            },
            {
              text: "Sim",
              onPress: async () => {
                await ativarBiometria();
                await AsyncStorage.setItem("biometria_pergunta", "true");
              }
            }
          ]
        );

      }

      const ativa = await biometriaAtiva(usuario.uid);

      if (ativa) {
        const ok = await autenticarBiometria();

        if (!ok) {
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
      }

      setUser(usuario);

    } else {
      setUser(null);
    }

    setLoading(false);

  });

  return unsubscribe;

}, []);

  useEffect(() => {

    if (loading) return;

    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }

  }, [user, loading]);

  if (loading) return null;

  async function login(email: string, senha: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, senha);
    return cred.user;
  } catch (error: any) {
    alert(error.message);
    return null;
  }
}

  async function register(email: string, senha: string) {

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      senha
    );

    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      email: user.email,
      criadoEm: new Date(),
    });

  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email de redefinição enviado com sucesso!");
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth fora do provider");
  return context;
}