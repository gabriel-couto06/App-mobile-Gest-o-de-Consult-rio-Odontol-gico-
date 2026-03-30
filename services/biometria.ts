import * as LocalAuthentication from "expo-local-authentication"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "./firebase"

export async function ativarBiometria() {
  const user = auth.currentUser

  if (!user) return

  await AsyncStorage.setItem("biometria_ativa", "true")
  await AsyncStorage.setItem("biometria_uid", user.uid)
}

export async function biometriaAtiva(uid: string) {

  const ativa = await AsyncStorage.getItem("biometria_ativa")
  const uidSalvo = await AsyncStorage.getItem("biometria_uid")

  return ativa === "true" && uidSalvo === uid

}

export async function autenticarBiometria() {

  const temBiometria = await LocalAuthentication.hasHardwareAsync()
  const cadastrada = await LocalAuthentication.isEnrolledAsync()

  if (!temBiometria || !cadastrada) {
    return true
  }

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Entrar com biometria",
    fallbackLabel: "Usar senha",
  })

  return resultado.success
}