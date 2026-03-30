import AsyncStorage from "@react-native-async-storage/async-storage"

const USER_KEY = "usuario_logado"

export const salvarSessao = async (uid: string) => {
  await AsyncStorage.setItem(USER_KEY, uid)
}

export const pegarSessao = async () => {
  return await AsyncStorage.getItem(USER_KEY)
}

export const limparSessao = async () => {
  await AsyncStorage.removeItem(USER_KEY)
}