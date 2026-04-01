import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/authContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ativarBiometria } from "../../services/biometria";

export default function Login() {
  const { login, resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleLogin() {
    const usuario = await login(email, senha);
    if (!usuario) return;
  }

  function handleResetPassword() {
    if (!email) {
      alert("Digite seu email primeiro 🙂");
      return;
    }

    resetPassword(email);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo de volta 🦷</Text>
      <Text style={styles.subtitle}>Entre para acessar sua clínica</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Senha"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <View>
        <TouchableOpacity onPress={handleResetPassword}>
          <Text style={styles.forgotText}>Esqueceu a senha?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    color: "#64748B",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#787878",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  forgotText: {
    color: "#515151",
    marginTop: 11,
    fontWeight: "300",
  },
  linkContainer: {
    marginTop: 11,
    alignItems: "center",
  },
  link: {
    color: "#247385",
    fontWeight: "600",
  },
});
