import { useState } from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { usePaciente } from "../../context/pacienteContext";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAgenda } from "../../context/agendaContext";
import { useAuth } from "../../context/authContext";

/* ===== FUNÇÕES DE FORMATAÇÃO ===== */

function formatTelefone(v: string) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 2) return `(${v}`;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

function formatData(v: string) {
  v = v.replace(/\D/g, "").slice(0, 8);
  if (v.length <= 2) return v;
  if (v.length <= 4) return `${v.slice(0, 2)}/${v.slice(2)}`;
  return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
}

function formatCPF(v: string) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 3) return v;
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
}

function formatRG(v: string) {
  return v.replace(/\D/g, "").slice(0, 9);
}

function formatCEP(v: string) {
  v = v.replace(/\D/g, "").slice(0, 8);
  if (v.length <= 5) return v;
  return `${v.slice(0, 5)}-${v.slice(5)}`;
}

function calcularIdade(data: string) {
  if (data.length !== 10) return "";

  const [dia, mes, ano] = data.split("/").map(Number);
  if (!dia || !mes || !ano) return "";

  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;

  if (
    hoje.getMonth() + 1 < mes ||
    (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)
  ) {
    idade--;
  }

  return String(idade);
}

type FormPaciente = {
  nome: string;
  telefone: string;
  email: string;
  nascimento: string;
  idade: string;
  rg: string;
  cpf: string;
  cep: string;
  numero?: string;
  complemento?: string;
  convenio: "sim" | "nao";
  nomeConvenio: string;
};

/* ===== COMPONENTE ===== */

export default function Prontuario() {
  const router = useRouter();
  const { pacientes, adicionarPaciente, removerPaciente } = usePaciente();
  const { consultas } = useAgenda();
  const { user, resetPassword } = useAuth();
  const { logout } = useAuth();

  const hojeReal = new Date();

  const consultasHoje = consultas.filter(
    (c) =>
      c.data.getDate() === hojeReal.getDate() &&
      c.data.getMonth() === hojeReal.getMonth() &&
      c.data.getFullYear() === hojeReal.getFullYear(),
  );

  const screenWidth = Dimensions.get("window").width;
  const [painelAberto, setPainelAberto] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  function abrirPainel() {
    setPainelAberto(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  function fecharPainel() {
    Animated.timing(slideAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPainelAberto(false);
    });
  }

  const [painelConfigAberto, setPainelConfigAberto] = useState(false);
  const slideConfigAnim = useRef(new Animated.Value(screenWidth)).current;

  function abrirConfig() {
    setPainelConfigAberto(true);

    Animated.timing(slideConfigAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  function fecharConfig() {
    Animated.timing(slideConfigAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPainelConfigAberto(false);
    });
  }

  function handleReset() {
    if (!user?.email) {
      alert("Usuário não encontrado.");
      return;
    }

    resetPassword(user.email);
  }

  const [modalCadastro, setModalCadastro] = useState(false);

  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.cadastro === "1") {
      setModalCadastro(true);
    }
  }, []);

  const [form, setForm] = useState<FormPaciente>({
    nome: "",
    telefone: "",
    email: "",
    nascimento: "",
    idade: "",
    rg: "",
    cpf: "",
    cep: "",
    convenio: "nao",
    nomeConvenio: "",
  });

  const [busca, setBusca] = useState("");

  function salvarPaciente() {
    if (!form.nome) {
      alert("Sem nome não tem paciente");
      return;
    }

    if (!form.telefone) {
      alert("Digite o telefone");
      return;
    }

    if (!form.email) {
      alert("Digite o email");
      return;
    }

    if (form.email && !form.email.includes("@")) {
      alert("Esse email tá mais suspeito que Wi-Fi aberto");
      return;
    }

    if (form.cpf.length < 14) {
      alert("CPF incompleto");
      return;
    }

    adicionarPaciente(form);

    setForm({
      nome: "",
      telefone: "",
      email: "",
      nascimento: "",
      idade: "",
      rg: "",
      cpf: "",
      cep: "",
      convenio: "nao",
      nomeConvenio: "",
    });

    setModalCadastro(false);
  }

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  async function buscarCEP(cep: string) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        }));
      }
    } catch (error) {
      console.log("Erro ao buscar CEP", error);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#EEF3F6" }}>
      {!painelAberto && !painelConfigAberto && (
        <View style={styles.topIcons}>
          <TouchableOpacity onPress={abrirPainel}>
            <View style={{ alignItems: "center" }}>
              {consultasHoje.length > 0 && (
                <View style={styles.notificacaoTextoContainer}>
                  <Text style={styles.notificacaoTexto}>
                    Você tem notificação
                  </Text>
                </View>
              )}

              <Ionicons name="notifications" size={28} color="#6B7280" />

              {consultasHoje.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{consultasHoje.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginLeft: 18 }} onPress={abrirConfig}>
            <Ionicons name="settings-sharp" size={28} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.container}>
        <Text style={styles.title}>Prontuário</Text>

        <Text
          style={{
            backgroundColor: "#035087",
            borderEndStartRadius: 14,
            borderBottomRightRadius: 14,
            width: 185,
            height: 8,
            marginBottom: 18,
          }}
        ></Text>

        <TouchableOpacity
          style={styles.btnCadastrar}
          onPress={() => setModalCadastro(true)}
        >
          <Text style={styles.btnText}>+ Cadastrar Paciente</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            placeholder="Buscar paciente pelo nome..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1 }}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <FlatList
          data={pacientesFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/paciente/${item.id}`)}
            >
              <View style={styles.barra} />

              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{item.nome}</Text>
                <Text style={{ color: "#666", fontSize: 13 }}>
                  {item.idade ? `${item.idade} anos` : ""}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.btnExcluir}
                onPress={() =>
                  Alert.alert(
                    "Excluir paciente",
                    "Tem certeza que deseja excluir este paciente?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Excluir",
                        onPress: () => removerPaciente(item.id),
                      },
                    ],
                  )
                }
              >
                <Text style={styles.btnExcluirText}>Excluir</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />

        {/* ===== MODAL CADASTRO ===== */}
        <Modal visible={modalCadastro} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Cadastro de Paciente</Text>

              <ScrollView>
                <TextInput
                  placeholder="NOME COMPLETO"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={form.nome}
                  onChangeText={(t) => setForm((p) => ({ ...p, nome: t }))}
                />

                <TextInput
                  placeholder="TELEFONE"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={styles.input}
                  value={form.telefone}
                  onChangeText={(t) =>
                    setForm((p) => ({ ...p, telefone: formatTelefone(t) }))
                  }
                />

                <TextInput
                  placeholder="EMAIL"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  value={form.email}
                  onChangeText={(t) => setForm((p) => ({ ...p, email: t }))}
                />

                <TextInput
                  placeholder="DATA NASC. (DD/MM/AAAA)"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  style={styles.input}
                  value={form.nascimento}
                  onChangeText={(t) => {
                    const d = formatData(t);
                    setForm((p) => ({
                      ...p,
                      nascimento: d,
                      idade: calcularIdade(d),
                    }));
                  }}
                />

                <TextInput
                  placeholder="IDADE"
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, { backgroundColor: "#eee" }]}
                  value={form.idade}
                  editable={false}
                />

                <Text style={{ marginBottom: 4 }}>Convênio?</Text>

                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.btnMini,
                      form.convenio === "sim" && { backgroundColor: "#007C91" },
                    ]}
                    onPress={() => setForm((p) => ({ ...p, convenio: "sim" }))}
                  >
                    <Text style={styles.btnMiniText}>Sim</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.btnMini,
                      form.convenio === "nao" && { backgroundColor: "#007C91" },
                    ]}
                    onPress={() =>
                      setForm((p) => ({
                        ...p,
                        convenio: "nao",
                        nomeConvenio: "",
                      }))
                    }
                  >
                    <Text style={styles.btnMiniText}>Não</Text>
                  </TouchableOpacity>
                </View>

                {form.convenio === "sim" && (
                  <TextInput
                    placeholder="NOME DO CONVÊNIO"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={form.nomeConvenio}
                    onChangeText={(t) =>
                      setForm((p) => ({ ...p, nomeConvenio: t }))
                    }
                  />
                )}

                <TextInput
                  placeholder="RG"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  style={styles.input}
                  value={form.rg}
                  onChangeText={(t) =>
                    setForm((p) => ({ ...p, rg: formatRG(t) }))
                  }
                />

                <TextInput
                  placeholder="CPF"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  style={styles.input}
                  value={form.cpf}
                  onChangeText={(t) =>
                    setForm((p) => ({ ...p, cpf: formatCPF(t) }))
                  }
                />

                <TextInput
                  placeholder="CEP"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  style={styles.input}
                  value={form.cep}
                  onChangeText={(t) => {
                    const cepFormatado = t.replace(/\D/g, "").slice(0, 8);
                    setForm((p) => ({ ...p, cep: cepFormatado }));

                    if (cepFormatado.length === 8) {
                      buscarCEP(cepFormatado);
                    }
                  }}
                />

                <View style={{ flexDirection: "row", gap: "10%" }}>
                  <TextInput
                    placeholder="Número da casa"
                    placeholderTextColor="#94A3B8"
                    value={form.numero}
                    onChangeText={(text) => setForm({ ...form, numero: text })}
                    style={[styles.input, { width: "48%", fontSize: 13 }]}
                  />

                  <TextInput
                    placeholder="Complemento"
                    placeholderTextColor="#94A3B8"
                    value={form.complemento}
                    onChangeText={(text) =>
                      setForm({ ...form, complemento: text })
                    }
                    style={[styles.input, { width: "42%", fontSize: 13 }]}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.btnSalvar}
                onPress={salvarPaciente}
              >
                <Text style={styles.btnText}>Salvar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setModalCadastro(false)}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {painelAberto && (
        <>
          {/* Fundo escuro clicável */}
          <TouchableWithoutFeedback onPress={fecharPainel}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>

          {/* Painel animado */}
          <Animated.View
            style={[styles.painel, { transform: [{ translateX: slideAnim }] }]}
          >
            <Text style={styles.painelTitulo}>Consultas de Hoje</Text>

            <ScrollView>
              {consultasHoje.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma consulta hoje</Text>
              ) : (
                consultasHoje.map((consulta) => (
                  <View key={consulta.id} style={styles.painelCard}>
                    <Text style={styles.painelNome}>{consulta.paciente}</Text>

                    <Text style={styles.painelHora}>
                      {consulta.hora}{" "}
                      {consulta.tipo === "manutencao" && (
                        <Text style={{ fontWeight: 700, color: "#535353" }}>
                          - (Manutenção)
                        </Text>
                      )}
                    </Text>

                    {consulta.obs ? (
                      <Text style={styles.painelObs}>{consulta.obs}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>

            {/* BOTÃO FECHAR */}
            <TouchableOpacity style={styles.btnFechar} onPress={fecharPainel}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Fechar</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {painelConfigAberto && (
        <>
          <TouchableWithoutFeedback onPress={fecharConfig}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.painel,
              { transform: [{ translateX: slideConfigAnim }] },
            ]}
          >
            <Text style={styles.painelTitulo}>Configurações</Text>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.configButton} onPress={handleReset}>
              <Text style={styles.configButtonText}>Redefinir senha</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 15 }}>
              <TouchableOpacity style={styles.btnFechar} onPress={fecharConfig}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Fechar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnLogout}
                onPress={async () => {
                  await logout();
                  fecharConfig();
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Sair da conta
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

/* ===== ESTILOS ===== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3F6",
    padding: 17,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 1,
  },

  btnCadastrar: {
    backgroundColor: "#007C91",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 10,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },

  barra: {
    width: 6,
    height: "100%",
    backgroundColor: "#2F6FB2",
    borderRadius: 4,
    marginRight: 12,
  },

  nome: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },

  btnExcluir: {
    backgroundColor: "#E53935",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  btnExcluirText: {
    color: "#fff",
    fontWeight: "600",
  },

  btnMini: {
    backgroundColor: "#00A6C8",
    padding: 8,
    borderRadius: 10,
  },

  btnMiniText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },

  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdfdfd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginTop: 5,
    marginBottom: 12,
    elevation: 2,
  },

  btnSalvar: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  cancelar: {
    textAlign: "center",
    marginTop: 10,
    color: "#777",
  },

  topIcons: {
    position: "absolute",
    top: 55,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
  },

  icon: {
    fontSize: 22,
  },

  painel: {
    position: "absolute",
    right: 0,
    width: 258,
    height: "60%",
    backgroundColor: "#fff",
    marginTop: 55,
    paddingTop: 30,
    paddingHorizontal: 14,
    elevation: 20,
    borderLeftWidth: 1,
    borderColor: "#E3E8EC",
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 20,
    zIndex: 10,
  },

  painelTitulo: {
    color: "#0a3d62",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 15,
  },

  painelCard: {
    backgroundColor: "#F4F7FA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  painelNome: {
    fontWeight: "bold",
    fontSize: 15,
  },

  painelHora: {
    fontSize: 13,
    color: "#0a3d62",
    marginTop: 2,
  },

  painelObs: {
    fontSize: 12,
    color: "#555",
    marginTop: 3,
  },

  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 5,
  },

  btnFechar: {
    marginTop: 15,
    marginBottom: 18,
    backgroundColor: "#0a3d62",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    width: "40%",
    alignSelf: "center",
  },

  notificacaoTextoContainer: {
    position: "absolute",
    top: -20,
    width: 121,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    elevation: 5,
  },

  notificacaoTexto: {
    color: "#363636",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  badge: {
    position: "absolute",
    right: -4,
    top: -4,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
  btnLogout: {
    backgroundColor: "#e74c3c",
    marginTop: 15,
    marginBottom: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    width: "52%",
  },

  configButton: {
    padding: 14,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 30,
  },

  configButtonText: {
    fontWeight: "600",
    textAlign: "center",
  },
});
