import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
} from "react-native";
import { TextInput, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaciente } from "../../context/pacienteContext";
import { useAgenda } from "../../context/agendaContext";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { RotateInDownLeft } from "react-native-reanimated";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const FDI_DENTES = [
  // -------- SUPERIOR --------
  { numero: "18", nome: "Terceiro molar sup. dir.", x: 0.06, y: 28 },
  { numero: "17", nome: "Segundo molar sup. dir.", x: 0.13, y: 29 },
  { numero: "16", nome: "Primeiro molar sup. dir.", x: 0.195, y: 29 },
  { numero: "15", nome: "Segundo pré-molar sup. dir.", x: 0.254, y: 29 },
  { numero: "14", nome: "Primeiro pré-molar sup. dir.", x: 0.308, y: 29 },
  { numero: "13", nome: "Canino sup. dir.", x: 0.358, y: 29 },
  { numero: "12", nome: "Incisivo lateral sup. dir.", x: 0.41, y: 30 },
  { numero: "11", nome: "Incisivo central sup. dir.", x: 0.465, y: 30 },

  { numero: "21", nome: "Incisivo central sup. esq.", x: 0.53, y: 30 },
  { numero: "22", nome: "Incisivo lateral sup. esq.", x: 0.59, y: 30 },
  { numero: "23", nome: "Canino sup. esq.", x: 0.638, y: 30 },
  { numero: "24", nome: "Primeiro pré-molar sup. esq.", x: 0.688, y: 30 },
  { numero: "25", nome: "Segundo pré-molar sup. esq.", x: 0.74, y: 30 },
  { numero: "26", nome: "Primeiro molar sup. esq.", x: 0.8, y: 29 },
  { numero: "27", nome: "Segundo molar sup. esq.", x: 0.865, y: 29 },
  { numero: "28", nome: "Terceiro molar sup. esq.", x: 0.935, y: 28 },

  // -------- INFERIOR --------
  { numero: "48", nome: "Terceiro molar inf. dir.", x: 0.063, y: 98 },
  { numero: "47", nome: "Segundo molar inf. dir.", x: 0.132, y: 101 },
  { numero: "46", nome: "Primeiro molar inf. dir.", x: 0.195, y: 101 },
  { numero: "45", nome: "Segundo pré-molar inf. dir.", x: 0.255, y: 101 },
  { numero: "44", nome: "Primeiro pré-molar inf. dir.", x: 0.312, y: 101 },
  { numero: "43", nome: "Canino inf. dir.", x: 0.365, y: 101 },
  { numero: "42", nome: "Incisivo lateral inf. dir.", x: 0.413, y: 101 },
  { numero: "41", nome: "Incisivo central inf. dir.", x: 0.467, y: 101 },

  { numero: "31", nome: "Incisivo central inf. esq.", x: 0.525, y: 101 },
  { numero: "32", nome: "Incisivo lateral inf. esq.", x: 0.58, y: 101 },
  { numero: "33", nome: "Canino inf. esq.", x: 0.627, y: 101 },
  { numero: "34", nome: "Primeiro pré-molar inf. esq.", x: 0.68, y: 101 },
  { numero: "35", nome: "Segundo pré-molar inf. esq.", x: 0.735, y: 101 },
  { numero: "36", nome: "Primeiro molar inf. esq.", x: 0.796, y: 101 },
  { numero: "37", nome: "Segundo molar inf. esq.", x: 0.86, y: 101 },
  { numero: "38", nome: "Terceiro molar inf. esq.", x: 0.93, y: 99 },
];

export default function PacienteDetalhe() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const {
    pacientes,
    limparHistorico,
    salvarDente,
    removerDente,
    toggleTratado,
    salvarPlanejamentoOrto,
    atualizarPaciente,
    adicionarImagem,
    removerImagem,
    adicionarArquivo,
    removerArquivo,
  } = usePaciente();

  const { consultas, adicionarConsulta } = useAgenda();

  const pacienteBase = pacientes.find((p) => p.id === id);

  if (!pacienteBase) {
    return <Text>Paciente não encontrado 😢</Text>;
  }

  const paciente = {
    ...pacienteBase,
    odontograma: pacienteBase.odontograma || [],
  };

  const imagens = paciente.imagens || [];
  const arquivos = paciente.arquivos || [];

  const planejamentoSalvo = pacienteBase.planejamentoOrto;

  useEffect(() => {
    if (planejamentoSalvo) {
      setOrtoDataInicio(planejamentoSalvo.dataInicio);
      setOrtoTempo(planejamentoSalvo.tempoEstimado);
      setOrtoFase(planejamentoSalvo.faseAtual);
      setAcessorios(
        planejamentoSalvo.acessorios.map((a) => ({
          ...a,
          editando: false,
        })),
      );
      setEtapas(planejamentoSalvo.etapas);
    }
  }, []);

  const [aba, setAba] = useState<
    "Resumo" | "Histórico" | "Odontograma" | "Ficha" | "Financeiro"
  >("Resumo");

  type Acessorio = {
    id: string;
    tipo: string;
    instrucao: string;
    adesao: "boa" | "irregular";
    editando: boolean;
  };

  type Etapa = {
    id: string;
    texto: string;
    concluido: boolean;
  };

  type Cobranca = {
    id: string;
    consultaId: string;
    descricao: string;
    valor: number;
    data: string;

    quitado: boolean;

    parcelas?: {
      total: number;
      atual: number;
      valorParcela: number;
    };
  };

  type Pagamento = {
    id: string;
    cobrancaId: string;
    valor: number;
    data: string;
    forma: "pix" | "credito" | "debito" | "dinheiro";

    numeroParcela?: number;
    oculto?: boolean;
  };

  const [cobrancas, setCobrancas] = useState<Cobranca[]>(
    pacienteBase.cobrancas || [],
  );

  const [pagamentos, setPagamentos] = useState<Pagamento[]>(
    pacienteBase.pagamentos || [],
  );

  const [modalCobranca, setModalCobranca] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);

  const [valorCobranca, setValorCobranca] = useState("");
  const [consultaSelecionada, setConsultaSelecionada] = useState<any>(null);

  const [cobrancaSelecionada, setCobrancaSelecionada] =
    useState<Cobranca | null>(null);
  const [dataPagamento, setDataPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<
    "pix" | "credito" | "debito" | "dinheiro"
  >("pix");

  const [parcelas, setParcelas] = useState("1");
  const [modalParcela, setModalParcela] = useState(false);
  const [cobrancaParcela, setCobrancaParcela] = useState<any>(null);
  const [dataParcela, setDataParcela] = useState("");

  const [denteSelecionado, setDenteSelecionado] = useState<any>(null);
  const [obsDente, setObsDente] = useState("");
  const [mapaWidth, setMapaWidth] = useState(0);

  const [mostrarOrto, setMostrarOrto] = useState(false);
  const [editandoOrto, setEditandoOrto] = useState(false);

  const [ortoDataInicio, setOrtoDataInicio] = useState("");
  const [ortoTempo, setOrtoTempo] = useState("24 meses");
  const [ortoFase, setOrtoFase] = useState("Alinhamento inicial");

  const [mostrarManutencaoForm, setMostrarManutencaoForm] = useState(false);
  const [manutData, setManutData] = useState("");
  const [manutHora, setManutHora] = useState("");
  const [manutObs, setManutObs] = useState("");
  const [denteModal, setDenteModal] = useState<any>(null);

  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);

  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(
    null,
  );
  const [arquivoSelecionado, setArquivoSelecionado] = useState<{
    name: string;
    uri: string;
  } | null>(null);

  const [acessorios, setAcessorios] = useState<Acessorio[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [editandoEtapas, setEditandoEtapas] = useState(false);

  const [modoEdicao, setModoEdicao] = useState(false);
  const [dadosEditados, setDadosEditados] = useState(paciente);

  const totalEtapas = etapas.length;
  const etapasConcluidas = etapas.filter((e) => e.concluido).length;

  const hojeReal = new Date();

  const consultasHoje = consultas.filter(
    (c) =>
      c.data.getDate() === hojeReal.getDate() &&
      c.data.getMonth() === hojeReal.getMonth() &&
      c.data.getFullYear() === hojeReal.getFullYear(),
  );

  useEffect(() => {
    if (pacienteBase.cobrancas) setCobrancas(pacienteBase.cobrancas);
    if (pacienteBase.pagamentos) setPagamentos(pacienteBase.pagamentos);
  }, [pacienteBase]);

  useEffect(() => {
    atualizarPaciente(paciente.id, {
      cobrancas,
      pagamentos,
    });
  }, [cobrancas, pagamentos]);

  useEffect(() => {
    salvarPlanejamentoOrto(paciente.id, {
      dataInicio: ortoDataInicio,
      tempoEstimado: ortoTempo,
      faseAtual: ortoFase,
      acessorios: acessorios.map(({ editando, ...rest }) => rest),
      etapas,
    });
  }, [ortoDataInicio, ortoTempo, ortoFase, acessorios, etapas]);

  const porcentagem =
    totalEtapas === 0 ? 0 : Math.round((etapasConcluidas / totalEtapas) * 100);

  function formatarData(texto: string) {
    const numeros = texto.replace(/\D/g, "");

    let resultado = numeros;

    if (numeros.length >= 3) {
      resultado = numeros.slice(0, 2) + "/" + numeros.slice(2);
    }
    if (numeros.length >= 5) {
      resultado =
        numeros.slice(0, 2) +
        "/" +
        numeros.slice(2, 4) +
        "/" +
        numeros.slice(4, 8);
    }

    return resultado;
  }

  function formatarHora(texto: string) {
    const numeros = texto.replace(/\D/g, "");

    let resultado = numeros;

    if (numeros.length >= 3) {
      resultado = numeros.slice(0, 2) + ":" + numeros.slice(2, 4);
    }

    return resultado;
  }

  function getIconByFileName(nome: string) {
    const ext = nome.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "pdf":
        return (
          <MaterialIcons name="picture-as-pdf" size={26} color="#E53935" />
        );

      case "doc":
      case "docx":
        return <MaterialIcons name="description" size={26} color="#1976D2" />;

      case "xls":
      case "xlsx":
        return (
          <FontAwesome5
            name="file-excel"
            size={22}
            color="#2E7D32"
            style={{ marginLeft: 4 }}
          />
        );

      case "png":
      case "jpg":
      case "jpeg":
        return <MaterialIcons name="image" size={26} color="#8E44AD" />;

      default:
        return <MaterialIcons name="attach-file" size={26} color="#555" />;
    }
  }

  function excluirImagem(uri: string) {
    removerImagem(paciente.id, uri);
  }

  function excluirArquivo(uri: string) {
    removerArquivo(paciente.id, uri);
  }

  function ligarPara(numero: string) {
    const numeroLimpo = numero.replace(/\D/g, "");
    const telefone = `tel:${numeroLimpo}`;

    Linking.openURL(telefone).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o discador");
    });
  }

  const totalDevido = cobrancas.reduce((total, c) => {
    const pago = pagamentos
      .filter((p) => p.cobrancaId === c.id)
      .reduce((soma, p) => soma + p.valor, 0);

    const restante = c.valor - pago;

    return total + (restante > 0 ? restante : 0);
  }, 0);

  const proximaManutencao = consultas
    .filter(
      (c) =>
        c.paciente === paciente.nome &&
        c.tipo === "manutencao" &&
        c.status === "agendado",
    )
    .sort((a, b) => {
      const d1 = new Date(a.data).getTime();
      const d2 = new Date(b.data).getTime();
      if (d1 !== d2) return d1 - d2;
      return a.hora.localeCompare(b.hora);
    })[0];

  if (!paciente) {
    return <Text>Paciente não encontrado 😢</Text>;
  }

  const hoje = new Date();
  const agora = new Date();
  hoje.setHours(0, 0, 0, 0);

  /* Próxima consulta na agenda */
  const proximaConsulta = consultas
    .filter(
      (c) =>
        c.data >= hoje &&
        c.paciente === paciente.nome &&
        c.status === "agendado",
    )
    .sort((a, b) => {
      const d1 = new Date(a.data).getTime();
      const d2 = new Date(b.data).getTime();
      if (d1 !== d2) return d1 - d2;
      return a.hora.localeCompare(b.hora);
    })[0];

  const historicoConsultas = paciente.historico.filter(
    (h) => !h.obs?.startsWith("Manutenção ortodôntica"),
  );

  const historicoManutencoes = paciente.historico.filter((h) =>
    h.obs?.startsWith("Manutenção ortodôntica"),
  );

  const cobrancasPendentes = cobrancas.filter((c) => !c.quitado);

  const pagamentosVisiveis = pagamentos.filter((p) => !p.oculto);

  async function buscarCep(cep: string) {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
      const data = await response.json();

      if (data.erro) {
        Alert.alert("CEP não encontrado");
        return;
      }

      setDadosEditados((prev) => ({
        ...prev,
        logradouro: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      }));
    } catch (error) {
      Alert.alert("Erro ao buscar CEP");
    }
  }

  async function adicionarImagemHandler() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      alert("Preciso de permissão pra acessar suas fotos 😅");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!resultado.canceled) {
      const novaImagem = resultado.assets[0].uri;
      adicionarImagem(paciente.id, novaImagem);
    }
  }

  async function adicionarArquivoHandler() {
    const resultado = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (resultado.canceled) return;

    adicionarArquivo(paciente.id, {
      name: resultado.assets[0].name,
      uri: resultado.assets[0].uri,
    });
  }

  const abrirArquivo = async (uri: string) => {
    try {
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(uri);

        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
        });
      } else {
        await Linking.openURL(uri);
      }
    } catch (error) {
      console.log("Erro ao abrir arquivo:", error);
      Alert.alert("Não foi possível abrir o arquivo 😢");
    }
  };

  const dentesPendentes = paciente.odontograma.filter((d) => !d.tratado);

  const dentesTratados = paciente.odontograma.filter((d) => d.tratado);

  return (
    <View style={{ flex: 1, backgroundColor: "#EEF4FB" }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={18}
            color="#fff"
            style={{ marginTop: 3 }}
          />
        </TouchableOpacity>

        <Text style={styles.nome}>{paciente.nome}</Text>
      </View>

      {/* ABAS */}
      <View style={styles.tabs}>
        {["Resumo", "Histórico", "Odontograma", "Ficha", "Financeiro"].map(
          (t) => (
            <TouchableOpacity key={t} onPress={() => setAba(t as any)}>
              <Text style={[styles.tabText, aba === t && styles.tabAtiva]}>
                {t}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      {/* ============================== CONTEÚDO ===================================== */}

      <ScrollView style={{ padding: 16 }}>
        {/* ================= RESUMO ================= */}

        {aba === "Resumo" && (
          <View>
            {/* GRID DOS DOIS CARDS */}
            <Text style={[styles.sectionTitle, { fontSize: 19 }]}>Resumo</Text>
            <View style={[styles.resumoGrid, { marginBottom: 2 }]}>
              {/* CARD 1 - INFO BÁSICA */}
              <View style={styles.cardResumo}>
                <Text style={styles.resumoTitulo}>
                  Idade:{" "}
                  <Text style={{ fontWeight: 900 }}>
                    {paciente.idade ? `${paciente.idade} anos` : "—"}
                  </Text>
                </Text>

                <Text
                  style={{
                    borderWidth: 0.3,
                    height: 0.3,
                    borderColor: "#cacaca",
                    marginTop: 15,
                  }}
                ></Text>

                <Text style={[styles.resumoTitulo, { marginTop: 10 }]}>
                  Telefone
                </Text>
                <TouchableOpacity onPress={() => ligarPara(paciente.telefone)}>
                  <Text style={styles.resumoValor}>
                    <Text style={{ fontSize: 11 }}>{`📞`}</Text>{" "}
                    {paciente.telefone || "—"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CARD 2 - STATUS DENTÁRIO */}
              <View style={styles.cardResumo}>
                <Text style={styles.resumoTitulo}>Status dentário</Text>

                <Text
                  style={{
                    borderWidth: 0.3,
                    height: 0.3,
                    borderColor: "#cacaca",
                    marginTop: 5,
                    marginBottom: 6,
                  }}
                ></Text>

                <Text style={styles.resumoLinha}>
                  🟡 Pendentes: {dentesPendentes.length}
                </Text>

                <Text style={styles.resumoLinha}>
                  🟢 Tratados: {dentesTratados.length}
                </Text>
              </View>
            </View>

            <Text
              style={{
                borderBottomWidth: 0.5,
                borderColor: "#b4b4b4",
                marginTop: 3,
              }}
            ></Text>

            <Text
              style={[
                styles.sectionTitle,
                { marginTop: 15, textAlign: "center", fontSize: 18 },
              ]}
            >
              Próxima consulta
            </Text>

            {proximaConsulta ? (
              <View
                style={[styles.card, styles.cardAgendada, { marginBottom: 4 }]}
              >
                <Text style={styles.cardTitle}>
                  {proximaConsulta.tipo === "manutencao"
                    ? "Manutenção agendada"
                    : "Consulta agendada"}
                </Text>

                <View style={styles.cardHistoricoProximo}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#3b4262",
                      fontWeight: "500",
                    }}
                  >
                    {proximaConsulta.obs}
                  </Text>
                  <Text style={{ marginBottom: 2, marginTop: 1 }}>
                    📅{" "}
                    <Text style={{ color: "#8a8b9d", fontWeight: "500" }}>
                      {new Date(proximaConsulta.data).toLocaleDateString()}
                    </Text>{" "}
                    ⏰{" "}
                    <Text style={{ fontWeight: "bold", color: "#777" }}>
                      {proximaConsulta.hora}
                    </Text>
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.empty, { textAlign: "center" }]}>
                Nenhuma consulta marcada 😴
              </Text>
            )}

            <Text
              style={{ borderBottomWidth: 0.5, borderColor: "#b4b4b4" }}
            ></Text>

            <Text
              style={[styles.sectionTitle, { marginTop: 14, fontSize: 18 }]}
            >
              Odontograma
            </Text>
            <View
              style={styles.mapaImagemContainer}
              onLayout={(e) => setMapaWidth(e.nativeEvent.layout.width)}
            >
              <Image
                source={require("../../assets/images/Odontograma.jpeg")}
                style={styles.mapaImagem}
                resizeMode="contain"
              />

              {/* OVERLAY DOS DENTES */}
              {FDI_DENTES.map((d) => {
                const registro = paciente.odontograma.find(
                  (r) => r.numero === d.numero,
                );
                const isSelecionado = denteSelecionado?.numero === d.numero;
                const isTratado = registro?.tratado;

                let borderColor = "transparent";

                if (isTratado)
                  borderColor = "#2ecc71"; // verde
                else if (registro)
                  borderColor = "#f1c40f"; // amarelo
                else if (isSelecionado) borderColor = "#2F6FB2"; // azul

                return (
                  <TouchableOpacity
                    key={d.numero}
                    style={[
                      styles.denteArea,
                      {
                        left: d.x * mapaWidth - 15,
                        top: d.y + 30,
                        borderWidth: 3,
                        borderColor,
                        borderRadius: 20,
                      },
                    ]}
                  ></TouchableOpacity>
                );
              })}
            </View>

            <View
              style={[
                styles.card,
                {
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  width: "70%",
                  alignSelf: "center",
                  marginTop: 1,
                },
              ]}
            >
              <Text style={{}}>🟨 Pendente</Text>
              <Text>🟩 Tratado</Text>
            </View>
          </View>
        )}

        {/* ================= HISTÓRICO ================= */}

        {aba === "Histórico" && (
          <ScrollView>
            <>
              {/* PRÓXIMA CONSULTA */}
              <Text style={[styles.sectionTitle, { marginTop: 4 }]}>
                Próxima consulta
              </Text>

              {proximaConsulta ? (
                <View style={[styles.card, styles.cardAgendada]}>
                  <Text style={styles.cardTitle}>
                    {proximaConsulta.tipo === "manutencao"
                      ? "Manutenção agendada"
                      : "Consulta agendada"}
                  </Text>

                  <View style={styles.cardHistoricoProximo}>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#3b4262",
                        fontWeight: "500",
                      }}
                    >
                      {proximaConsulta.obs}
                    </Text>
                    <Text style={{ marginBottom: 2, marginTop: 1 }}>
                      📅{" "}
                      <Text style={{ color: "#8a8b9d", fontWeight: "500" }}>
                        {new Date(proximaConsulta.data).toLocaleDateString()}
                      </Text>{" "}
                      ⏰{" "}
                      <Text style={{ fontWeight: "bold", color: "#777" }}>
                        {proximaConsulta.hora}
                      </Text>
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.empty}>Nenhuma consulta marcada 😴</Text>
              )}

              <Text
                style={{ borderBottomWidth: 0.5, borderColor: "#777" }}
              ></Text>

              {/* ===== CONSULTAS ANTERIORES ===== */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: "#0097A7", marginTop: 18, fontSize: 18 },
                ]}
              >
                Consultas anteriores
              </Text>

              {historicoConsultas.length === 0 ? (
                <Text style={styles.empty}>
                  Nenhuma consulta realizada ainda
                </Text>
              ) : historicoConsultas.length <= 2 ? (
                historicoConsultas.map((h) => (
                  <View key={h.id} style={[styles.card, styles.cardHistorico]}>
                    <Text>
                      📅{" "}
                      <Text style={{ color: "#888", fontWeight: "500" }}>
                        {new Date(h.data).toLocaleDateString()}
                      </Text>
                    </Text>
                    {h.obs ? <Text>📝 {h.obs}</Text> : null}
                  </View>
                ))
              ) : (
                <ScrollView
                  style={{
                    maxHeight: 180,
                    borderWidth: 1.5,
                    borderRadius: 3,
                    borderColor: "#dbdbdb",
                  }}
                >
                  {historicoConsultas.map((h) => (
                    <View
                      key={h.id}
                      style={[styles.card, styles.cardHistorico]}
                    >
                      <Text>
                        📅{" "}
                        <Text style={{ color: "#888", fontWeight: "500" }}>
                          {new Date(h.data).toLocaleDateString()}
                        </Text>
                      </Text>
                      {h.obs ? <Text>📝 {h.obs}</Text> : null}
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* ===== MANUTENÇÕES (SÓ SE EXISTIR) ===== */}
              {historicoManutencoes.length > 0 && (
                <>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: "#0097A7", marginTop: 10, fontSize: 18 },
                    ]}
                  >
                    Manutenções anteriores
                  </Text>

                  {historicoManutencoes.length <= 2 ? (
                    historicoManutencoes.map((h) => (
                      <View
                        key={h.id}
                        style={[styles.card, styles.cardManutencao]}
                      >
                        <Text>
                          📅{" "}
                          <Text style={{ color: "#888", fontWeight: "500" }}>
                            {new Date(h.data).toLocaleDateString()}
                          </Text>
                        </Text>
                        {h.obs ? (
                          <Text>
                            🔧 {h.obs.replace("Manutenção ortodôntica - ", "")}
                          </Text>
                        ) : null}
                      </View>
                    ))
                  ) : (
                    <ScrollView
                      style={{
                        maxHeight: 180,
                        borderWidth: 1.5,
                        borderRadius: 3,
                        borderColor: "#dbdbdb",
                      }}
                    >
                      {historicoManutencoes.map((h) => (
                        <View
                          key={h.id}
                          style={[styles.card, styles.cardManutencao]}
                        >
                          <Text>
                            📅{" "}
                            <Text style={{ color: "#888", fontWeight: "500" }}>
                              {new Date(h.data).toLocaleDateString()}
                            </Text>
                          </Text>
                          {h.obs ? (
                            <Text>
                              🔧{" "}
                              {h.obs.replace("Manutenção ortodôntica - ", "")}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              <TouchableOpacity
                style={[styles.btnLimpar, { marginTop: 23 }]}
                onPress={() =>
                  Alert.alert(
                    "Limpar histórico",
                    "Deseja apagar todas as consultas deste paciente?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Apagar tudo",
                        style: "destructive",
                        onPress: () => limparHistorico(paciente.id),
                      },
                    ],
                  )
                }
              >
                <Text style={styles.btnLimparText}>Excluir histórico</Text>
              </TouchableOpacity>
            </>
          </ScrollView>
        )}

        {/* ================= ODONTOGRAMA ================= */}

        {aba === "Odontograma" && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { marginTop: 4, textAlign: "center" },
              ]}
            >
              Mapa Dentário
            </Text>

            {/* MAPA ODONTOGRAMA */}
            <View
              style={styles.mapaImagemContainer}
              onLayout={(e) => setMapaWidth(e.nativeEvent.layout.width)}
            >
              <Image
                source={require("../../assets/images/Odontograma.jpeg")}
                style={styles.mapaImagem}
                resizeMode="contain"
              />

              {/* OVERLAY DOS DENTES */}
              {FDI_DENTES.map((d) => {
                const registro = paciente.odontograma.find(
                  (r) => r.numero === d.numero,
                );
                const isSelecionado = denteSelecionado?.numero === d.numero;
                const isTratado = registro?.tratado;

                let borderColor = "transparent";

                if (isTratado)
                  borderColor = "#2ecc71"; // verde
                else if (registro)
                  borderColor = "#f1c40f"; // amarelo
                else if (isSelecionado) borderColor = "#2F6FB2"; // azul

                return (
                  <TouchableOpacity
                    key={d.numero}
                    style={[
                      styles.denteArea,
                      {
                        left: d.x * mapaWidth - 15,
                        top: d.y + 30,
                        borderWidth: 3,
                        borderColor,
                        borderRadius: 20,
                      },
                    ]}
                    onPress={() => {
                      setDenteSelecionado(d);
                      setObsDente(registro?.obs || "");
                    }}
                  >
                    {/* NUMERAÇÃO FDI */}
                    <Text style={styles.numeroFDI}></Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* PAINEL DO DENTE */}
            {denteSelecionado && (
              <View style={styles.card}>
                <Text style={{ fontWeight: "700", fontSize: 15 }}>
                  {denteSelecionado.nome} — Dente {denteSelecionado.numero}
                </Text>

                <TextInput
                  placeholder="Observações (cárie, restauração, implante...)"
                  placeholderTextColor="#94A3B8"
                  value={obsDente}
                  onChangeText={setObsDente}
                  style={styles.input}
                />

                <TouchableOpacity
                  style={styles.btnSalvar}
                  onPress={() => {
                    salvarDente(paciente.id, {
                      numero: denteSelecionado.numero,
                      nome: denteSelecionado.nome,
                      obs: obsDente,
                      tratado: false,
                    });
                    setDenteSelecionado(null);
                    setObsDente("");
                  }}
                >
                  <Text style={{ color: "#fff" }}>Salvar</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: "row", gap: 15 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setDenteSelecionado(null);
                    }}
                  >
                    <Text style={{ color: "#777777", marginTop: 8 }}>
                      Voltar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      removerDente(paciente.id, denteSelecionado.numero);
                      setDenteSelecionado(null);
                    }}
                  >
                    <Text style={{ color: "red", marginTop: 8 }}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* LISTA DE REGISTROS */}
            <Text
              style={[
                styles.sectionTitle,
                { marginTop: 9, marginBottom: 3, fontSize: 18 },
              ]}
            >
              Registros
            </Text>

            {paciente.odontograma.length === 0 ? (
              <Text style={styles.empty}>Sem registros atualmente</Text>
            ) : (
              <ScrollView
                style={{
                  borderBottomWidth: 1.5,
                  borderRadius: 3,
                  borderColor: "#dbdbdb",
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 4 }}
              >
                {paciente.odontograma.map((d) => (
                  <View
                    key={d.numero}
                    style={[styles.card, styles.cardRegistroHorizontal]}
                  >
                    <Text style={{ fontWeight: "700" }}>
                      {d.nome} •{" "}
                      <Text style={styles.numeroDente}>Dente {d.numero}</Text>
                    </Text>

                    <Text style={{ marginTop: 4 }}>📝 {d.obs}</Text>

                    <TouchableOpacity
                      onPress={() => toggleTratado(paciente.id, d.numero)}
                      style={[
                        styles.btnTratado,
                        d.tratado
                          ? styles.btnTratadoOk
                          : styles.btnTratadoPendente,
                      ]}
                    >
                      <Text style={styles.btnTratadoText}>
                        {d.tratado ? "✅ Tratado" : "🟡 Marcar como tratado"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[
                styles.btnAdicionarOrto,
                mostrarOrto && {
                  backgroundColor: "#777777",
                  borderColor: "#333",
                },
              ]}
              onPress={() => {
                setMostrarOrto((prev) => !prev);
                setEditandoOrto(false); // fecha modo edição se estiver aberto
              }}
            >
              <Text>
                {mostrarOrto ? (
                  <Text
                    style={{
                      color: "#ebebeb",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    - Minimizar
                  </Text>
                ) : (
                  <Text
                    style={{
                      color: "#ebebeb",
                      fontSize: 15.5,
                      fontWeight: "700",
                    }}
                  >
                    + Abrir Planejamento Ortodôntico
                  </Text>
                )}
              </Text>
            </TouchableOpacity>

            {mostrarOrto && (
              <>
                {/* ===== RESUMO ORTODÔNTICO ===== */}
                <Text
                  style={[
                    styles.sectionTitle,
                    { textAlign: "center", marginBottom: 0.2, marginTop: 20 },
                  ]}
                >
                  Ortodontia
                </Text>
                <Text
                  style={{
                    backgroundColor: "#035087",
                    borderBottomLeftRadius: 14,
                    borderBottomRightRadius: 14,
                    width: 140,
                    height: 4,
                    marginBottom: 15,
                    alignSelf: "center",
                  }}
                ></Text>

                <View style={styles.card}>
                  <View style={styles.cardResumoOrto}>
                    <Text
                      style={{
                        fontWeight: "700",
                        marginBottom: 10,
                        color: "#383838",
                        fontSize: 16,
                      }}
                    >
                      🦷 Resumo Ortodôntico
                    </Text>

                    <View style={styles.gridOrto}>
                      <View style={styles.boxOrto}>
                        <Text style={styles.labelOrto}>📅 Data de início</Text>

                        {editandoOrto ? (
                          <TextInput
                            value={ortoDataInicio}
                            onChangeText={(t) =>
                              setOrtoDataInicio(formatarData(t))
                            }
                            placeholder="dd/mm/aaaa"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            maxLength={10}
                            style={styles.input}
                          />
                        ) : (
                          <Text style={styles.valorOrto}>
                            {ortoDataInicio || "Não informado"}
                          </Text>
                        )}
                      </View>

                      <View style={styles.boxOrto}>
                        <Text style={styles.labelOrto}>⏳ Tempo estimado</Text>

                        {editandoOrto ? (
                          <TextInput
                            placeholder="Ex: 24 meses"
                            placeholderTextColor="#94A3B8"
                            value={ortoTempo}
                            onChangeText={setOrtoTempo}
                            style={styles.input}
                          />
                        ) : (
                          <Text style={[styles.valorOrto, { color: "#999" }]}>
                            {ortoTempo}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.labelOrto}>🌀 Fase atual</Text>

                      {editandoOrto ? (
                        <TextInput
                          placeholder="Ex: Alinhamento inicial"
                          placeholderTextColor="#94A3B8"
                          value={ortoFase}
                          onChangeText={setOrtoFase}
                          style={styles.input}
                        />
                      ) : (
                        <Text style={styles.valorOrto}>{ortoFase}</Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.btnEditarPlano}
                    onPress={() => setEditandoOrto((prev) => !prev)}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                    >
                      {editandoOrto ? "💾 Salvar Plano" : "✏️ Editar Plano"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ===== PRÓXIMA MANUTENÇÃO ===== */}
                <Text
                  style={[styles.sectionTitle, { fontSize: 18, marginTop: 10 }]}
                >
                  Próxima manutenção
                </Text>
                <View style={[styles.card, { marginBottom: 10 }]}>
                  {proximaManutencao ? (
                    <>
                      <View style={styles.cardResumoOrto}>
                        <Text style={styles.cardTitle}>
                          Manutenção agendada
                        </Text>
                        <Text>
                          📅{" "}
                          {new Date(
                            proximaManutencao.data,
                          ).toLocaleDateString()}{" "}
                          - ⏰ {proximaManutencao.hora}
                        </Text>
                        <Text>📝 {proximaManutencao.obs}</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={{ color: "#777" }}>
                      Nenhuma manutenção agendada
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.btnSalvar,
                      {
                        marginTop: 12,
                        backgroundColor: "#9b59b6",
                        alignSelf: "center",
                      },
                    ]}
                    onPress={() => setMostrarManutencaoForm(true)}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                    >
                      + Agendar manutenção
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Elásticos e Acessórios */}
                <Text
                  style={[styles.sectionTitle, { fontSize: 18, marginTop: 10 }]}
                >
                  Elásticos e Acessórios
                </Text>

                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 100 }}
                >
                  {/* CARDS DE ACESSÓRIOS */}
                  {acessorios.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.card,
                        styles.cardAcessorio,
                        { marginBottom: 10 },
                      ]}
                    >
                      {/* TIPO */}
                      <Text style={styles.labelOrto}>🪢 Tipo de elástico</Text>
                      {item.editando ? (
                        <TextInput
                          value={item.tipo}
                          onChangeText={(t) =>
                            setAcessorios((prev) =>
                              prev.map((a) =>
                                a.id === item.id ? { ...a, tipo: t } : a,
                              ),
                            )
                          }
                          style={styles.input}
                        />
                      ) : (
                        <Text style={styles.valorOrto}>{item.tipo || "—"}</Text>
                      )}

                      {/* INSTRUÇÃO */}
                      <Text style={[styles.labelOrto, { marginTop: 6 }]}>
                        📋 Instrução de uso
                      </Text>
                      {item.editando ? (
                        <TextInput
                          value={item.instrucao}
                          onChangeText={(t) =>
                            setAcessorios((prev) =>
                              prev.map((a) =>
                                a.id === item.id ? { ...a, instrucao: t } : a,
                              ),
                            )
                          }
                          style={styles.input}
                        />
                      ) : (
                        <Text style={styles.valorOrto}>
                          {item.instrucao || "—"}
                        </Text>
                      )}

                      {/* ADESÃO */}
                      <Text style={[styles.labelOrto, { marginTop: 6 }]}>
                        🙂 Adesão
                      </Text>

                      {item.editando ? (
                        <View
                          style={{ flexDirection: "row", gap: 8, marginTop: 6 }}
                        >
                          {["boa", "irregular"].map((op) => (
                            <TouchableOpacity
                              key={op}
                              style={[
                                styles.btnAdesao,
                                item.adesao === op && styles.btnAdesaoAtivo,
                              ]}
                              onPress={() =>
                                setAcessorios((prev) =>
                                  prev.map((a) =>
                                    a.id === item.id
                                      ? { ...a, adesao: op as any }
                                      : a,
                                  ),
                                )
                              }
                            >
                              <Text
                                style={{
                                  color: item.adesao === op ? "#fff" : "#555",
                                  fontWeight: "600",
                                }}
                              >
                                {op === "boa" ? "Boa" : "Irregular"}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.valorOrto}>
                          {item.adesao === "boa" ? "Boa" : "Irregular"}
                        </Text>
                      )}

                      {/* BOTÃO EDITAR */}
                      <View style={styles.rowBotoesAcessorio}>
                        <TouchableOpacity
                          style={[styles.btnEditarMini, { width: "45%" }]}
                          onPress={() =>
                            setAcessorios((prev) =>
                              prev.map((a) =>
                                a.id === item.id
                                  ? { ...a, editando: !a.editando }
                                  : a,
                              ),
                            )
                          }
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: 11,
                            }}
                          >
                            {item.editando ? "💾 Salvar" : "✏️ Editar"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnExcluirAcessorio, { width: "45%" }]}
                          onPress={() =>
                            setAcessorios((prev) =>
                              prev.filter((a) => a.id !== item.id),
                            )
                          }
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: 11,
                            }}
                          >
                            🗑️ Excluir
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* BOTÃO NOVO ACESSÓRIO */}
                  {acessorios.length < 2 && (
                    <TouchableOpacity
                      style={[
                        styles.card,
                        styles.cardNovoAcessorio,
                        { marginBottom: 10 },
                      ]}
                      onPress={() =>
                        setAcessorios((prev) => [
                          ...prev,
                          {
                            id: Date.now().toString(),
                            tipo: "",
                            instrucao: "",
                            adesao: "boa",
                            editando: true,
                          },
                        ])
                      }
                    >
                      <Text style={{ fontSize: 30 }}>➕</Text>
                      <Text style={{ fontWeight: "700", marginTop: 6 }}>
                        Novo acessório
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {mostrarManutencaoForm && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <Text
                    style={{
                      fontWeight: "700",
                      marginBottom: 10,
                      fontSize: 15,
                    }}
                  >
                    🦷 Agendar manutenção
                  </Text>

                  <TextInput
                    placeholder="Data (dd/mm/aaaa)"
                    placeholderTextColor="#94A3B8"
                    value={manutData}
                    onChangeText={(t) => setManutData(formatarData(t))}
                    keyboardType="numeric"
                    maxLength={10}
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="Hora (hh:mm)"
                    placeholderTextColor="#94A3B8"
                    value={manutHora}
                    onChangeText={(t) => setManutHora(formatarHora(t))}
                    keyboardType="numeric"
                    maxLength={5}
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="Procedimento planejado"
                    placeholderTextColor="#94A3B8"
                    value={manutObs}
                    onChangeText={setManutObs}
                    style={styles.input}
                  />

                  <TouchableOpacity
                    style={[styles.btnSalvar, { marginTop: 12 }]}
                    onPress={() => {
                      const [d, m, a] = manutData.split("/").map(Number);

                      adicionarConsulta({
                        id: Date.now().toString(),
                        paciente: paciente.nome,
                        data: new Date(a, m - 1, d),
                        hora: manutHora,
                        obs: manutObs,
                        status: "agendado",
                        tipo: "manutencao",
                      });

                      setMostrarManutencaoForm(false);
                      setManutData("");
                      setManutHora("");
                      setManutObs("");
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Agendar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setMostrarManutencaoForm(false)}
                  >
                    <Text
                      style={{
                        marginTop: 10,
                        color: "#777",
                        textAlign: "center",
                      }}
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {aba === "Ficha" && (
          <View>
            <Text style={[styles.sectionTitle, { marginTop: 4 }]}>
              Ficha do Paciente
            </Text>

            <View style={styles.cardFicha}>
              <View style={styles.linhaDupla}>
                <View style={styles.coluna}>
                  <Text style={styles.label}>Nome</Text>
                  {modoEdicao ? (
                    <TextInput
                      value={dadosEditados.nome}
                      onChangeText={(t) =>
                        setDadosEditados((prev) => ({ ...prev, nome: t }))
                      }
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.valor}>{paciente.nome}</Text>
                  )}

                  <Text style={styles.label}>Telefone</Text>
                  {modoEdicao ? (
                    <TextInput
                      value={dadosEditados.telefone}
                      onChangeText={(t) =>
                        setDadosEditados((prev) => ({ ...prev, telefone: t }))
                      }
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.valor}>{paciente.telefone}</Text>
                  )}

                  <Text style={styles.label}>Email</Text>
                  {modoEdicao ? (
                    <TextInput
                      value={dadosEditados.email}
                      onChangeText={(t) =>
                        setDadosEditados((prev) => ({ ...prev, email: t }))
                      }
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.valor}>{paciente.email}</Text>
                  )}

                  <Text style={styles.label}>Nascimento</Text>
                  <Text style={styles.valor}>{paciente.nascimento}</Text>

                  <Text style={styles.label}>Idade</Text>
                  <Text style={styles.valor}>
                    {paciente.idade ? `${paciente.idade} anos` : "—"}
                  </Text>
                </View>

                <View style={styles.coluna}>
                  <Text style={styles.label}>RG</Text>
                  {modoEdicao ? (
                    <TextInput
                      value={dadosEditados.rg}
                      onChangeText={(t) =>
                        setDadosEditados((prev) => ({ ...prev, rg: t }))
                      }
                      style={[styles.input, { width: 100 }]}
                    />
                  ) : (
                    <Text style={styles.valor}>{paciente.rg}</Text>
                  )}

                  <Text style={styles.label}>CPF</Text>
                  {modoEdicao ? (
                    <TextInput
                      value={dadosEditados.cpf}
                      onChangeText={(t) =>
                        setDadosEditados((prev) => ({ ...prev, cpf: t }))
                      }
                      style={[styles.input, { width: 125 }]}
                    />
                  ) : (
                    <Text style={styles.valor}>{paciente.cpf}</Text>
                  )}

                  <Text style={styles.label}>Convênio</Text>

                  {modoEdicao ? (
                    <>
                      <View
                        style={{ flexDirection: "row", gap: 8, marginTop: 6 }}
                      >
                        {["sim", "nao"].map((op) => (
                          <TouchableOpacity
                            key={op}
                            style={[
                              styles.btnAdesao,
                              dadosEditados.convenio === op &&
                                styles.btnAdesaoAtivo,
                            ]}
                            onPress={() =>
                              setDadosEditados((prev) => ({
                                ...prev,
                                convenio: op as "sim" | "nao",
                                nomeConvenio:
                                  op === "nao" ? "" : prev.nomeConvenio,
                              }))
                            }
                          >
                            <Text
                              style={{
                                color:
                                  dadosEditados.convenio === op
                                    ? "#fff"
                                    : "#555",
                                fontWeight: "600",
                              }}
                            >
                              {op === "sim" ? "sim" : "não"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {dadosEditados.convenio === "sim" && (
                        <TextInput
                          placeholder="Convênio"
                          placeholderTextColor="#94A3B8"
                          value={dadosEditados.nomeConvenio}
                          onChangeText={(t) =>
                            setDadosEditados((prev) => ({
                              ...prev,
                              nomeConvenio: t,
                            }))
                          }
                          style={[styles.input, { width: 125, marginTop: 8 }]}
                        />
                      )}
                    </>
                  ) : (
                    <Text style={styles.valor}>
                      {paciente.convenio === "sim"
                        ? paciente.nomeConvenio
                        : "Não possui"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.enderecoContainer}>
                <Text style={[styles.sectionTitle, { fontSize: 17 }]}>
                  Endereço
                </Text>

                <Text style={[styles.valor, { paddingRight: 30 }]}>
                  {paciente.logradouro || ""}
                </Text>

                {modoEdicao ? (
                  <>
                    <View style={{ flexDirection: "row", gap: 20 }}>
                      <TextInput
                        placeholder="Número"
                        placeholderTextColor="#94A3B8"
                        value={dadosEditados.numero}
                        onChangeText={(t) =>
                          setDadosEditados((prev) => ({ ...prev, numero: t }))
                        }
                        style={[
                          styles.input,
                          { width: 100, marginTop: 0, marginBottom: 8 },
                        ]}
                      />

                      <TextInput
                        placeholder="Complemento"
                        placeholderTextColor="#94A3B8"
                        value={dadosEditados.complemento}
                        onChangeText={(t) =>
                          setDadosEditados((prev) => ({
                            ...prev,
                            complemento: t,
                          }))
                        }
                        style={[
                          styles.input,
                          { width: 100, marginTop: 0, marginBottom: 8 },
                        ]}
                      />
                    </View>
                  </>
                ) : (
                  <Text style={styles.valor}>
                    Número da casa: {paciente.numero || ""}
                    {paciente.complemento ? ` - ${paciente.complemento}` : ""}
                  </Text>
                )}

                <Text style={styles.valor}>{paciente.bairro || ""}</Text>

                <Text style={styles.valor}>
                  {paciente.cidade || ""} - {paciente.estado || ""}
                </Text>

                {modoEdicao ? (
                  <TextInput
                    placeholder="Digite o CEP"
                    placeholderTextColor="#94A3B8"
                    value={dadosEditados.cep}
                    keyboardType="numeric"
                    maxLength={9}
                    onChangeText={(t) => {
                      setDadosEditados((prev) => ({ ...prev, cep: t }));
                      buscarCep(t);
                    }}
                    style={[
                      styles.input,
                      { width: 100, marginTop: 0, marginBottom: 8 },
                    ]}
                  />
                ) : (
                  <Text style={styles.valor}>CEP: {paciente.cep || ""}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.botaoEditarFlutuante, { margin: 5 }]}
                onPress={async () => {
                  if (modoEdicao) {
                    atualizarPaciente(paciente.id, dadosEditados);
                  }
                  setModoEdicao(!modoEdicao);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {modoEdicao ? "💾 Salvar" : "✏️ Editar"}
                </Text>
              </TouchableOpacity>

              {/* ================= IMAGENS ================= */}
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 27 }]}>
              Imagens e Arquivos
            </Text>
            <View style={[styles.card, { marginBottom: 100 }]}>
              <Text style={[styles.subTitle, { marginTop: 0 }]}>
                📷 Imagens Clínicas
              </Text>

              <TouchableOpacity
                style={styles.botaoAdicionar}
                onPress={adicionarImagemHandler}
              >
                <Text style={styles.botaoTexto}>+ Adicionar imagem</Text>
              </TouchableOpacity>

              <View style={styles.imagensContainer}>
                {imagens.length === 0 ? (
                  <Text style={styles.textoVazio}>Nenhuma imagem anexada</Text>
                ) : (
                  <View style={styles.grid}>
                    {imagens.map((img, index) => (
                      <View key={index} style={{ position: "relative" }}>
                        <TouchableOpacity
                          onPress={() => setImagemSelecionada(img)}
                        >
                          <Image
                            source={{ uri: img }}
                            style={styles.imagemGrid}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* ================= ARQUIVOS ================= */}
              <Text style={[styles.subTitle, { marginTop: 20 }]}>
                📎 Documentos e Arquivos
              </Text>

              <TouchableOpacity
                style={styles.botaoAdicionar}
                onPress={adicionarArquivoHandler}
              >
                <Text style={styles.botaoTexto}>+ Adicionar arquivo</Text>
              </TouchableOpacity>

              <View style={{ marginBottom: 10, marginTop: 1 }}>
                {arquivos.length === 0 ? (
                  <Text style={[styles.textoVazio, { marginTop: 4 }]}>
                    Nenhum arquivo anexado
                  </Text>
                ) : (
                  arquivos.map((file, index) => (
                    <View key={index} style={styles.arquivoItem}>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                        onPress={() => setArquivoSelecionado(file)}
                      >
                        <View style={{ marginRight: 8 }}>
                          {getIconByFileName(file.name)}
                        </View>

                        <Text style={styles.nomeArquivo}>{file.name}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            "Excluir arquivo",
                            `Deseja excluir "${file.name}"?`,
                            [
                              { text: "Cancelar", style: "cancel" },
                              {
                                text: "Excluir",
                                style: "destructive",
                                onPress: () => excluirArquivo(file.uri),
                              },
                            ],
                          );
                        }}
                        style={styles.btnExcluirMini}
                      >
                        <Text style={{ color: "#fff" }}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        )}

        {aba === "Financeiro" && (
          <>
            {/* TOTAL */}
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { fontSize: 17 }]}>
                💰 Total devido
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  marginTop: 3,
                  color: "#b40000",
                }}
              >
                R$ {totalDevido.toFixed(2)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.btnSalvar,
                  { backgroundColor: "#0a3d62", marginTop: 10 },
                ]}
                onPress={() => setModalCobranca(true)}
              >
                <Text style={{ color: "#fff", fontWeight: "500" }}>
                  + Adicionar cobrança
                </Text>
              </TouchableOpacity>
            </View>

            {/* PENDENTES */}
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
              Pagamentos pendentes
            </Text>

            {cobrancasPendentes.length === 0 ? (
              <Text style={styles.empty}>Nenhum pagamento pendente</Text>
            ) : cobrancasPendentes.length <= 1 ? (
              cobrancasPendentes.map((c) => {
                const pago = pagamentos
                  .filter((p) => p.cobrancaId === c.id)
                  .reduce((soma, p) => soma + p.valor, 0);

                const restante = c.valor - pago;

                return (
                  <View
                    key={c.id}
                    style={[
                      styles.card,
                      {
                        paddingTop: 7,
                        paddingBottom: 12,
                        paddingHorizontal: 12,
                        width: 290,
                        marginRight: 10,
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {/* ESQUERDA */}
                      <View style={{ flex: 1 }}>
                        {c.descricao ? (
                          <Text
                            style={{
                              fontSize: 16,
                              color: "#3b4262",
                              fontWeight: "500",
                            }}
                          >
                            {c.descricao}
                          </Text>
                        ) : null}
                        <Text style={{ color: "#8a8b9d", fontWeight: "500" }}>
                          {c.data}
                        </Text>
                      </View>

                      {/* DIREITA */}
                      <View style={{ flexDirection: "column" }}>
                        {c.parcelas && (
                          <Text style={{ color: "#007C91", fontWeight: "600" }}>
                            💳 Parcela {c.parcelas.atual + 1} de{" "}
                            {c.parcelas.total}
                          </Text>
                        )}
                        <Text
                          style={{
                            fontWeight: "700",
                            color: "#b40000",
                            alignSelf: "flex-end",
                          }}
                        >
                          💸 R$ {restante.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {c.parcelas && c.parcelas.atual < c.parcelas.total ? (
                      <TouchableOpacity
                        style={[
                          styles.btnSalvar,
                          {
                            paddingVertical: 8,
                            paddingHorizontal: 13,
                            backgroundColor: "#176977",
                            marginTop: 12,
                            width: "75%",
                            alignSelf: "flex-end",
                          },
                        ]}
                        onPress={() => {
                          setCobrancaParcela(c);
                          setModalParcela(true);
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "500" }}>
                          💳 Registrar {c.parcelas.atual + 1}° parcela
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.btnSalvar,
                          {
                            paddingVertical: 8,
                            paddingHorizontal: 13,
                            backgroundColor: "#007C91",
                            marginTop: 12,
                            width: "75%",
                            alignSelf: "flex-end",
                          },
                        ]}
                        onPress={() => {
                          setCobrancaSelecionada(c);
                          setModalPagamento(true);
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "500",
                            fontSize: 13,
                          }}
                        >
                          ✅ Registrar pagamento
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {cobrancasPendentes.map((c) => {
                  const pago = pagamentos
                    .filter((p) => p.cobrancaId === c.id)
                    .reduce((soma, p) => soma + p.valor, 0);

                  const restante = c.valor - pago;

                  return (
                    <View
                      key={c.id}
                      style={[
                        styles.card,
                        {
                          paddingTop: 7,
                          paddingBottom: 12,
                          paddingHorizontal: 12,
                          width: 290,
                          marginRight: 10,
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* ESQUERDA */}
                        <View style={{ flex: 1 }}>
                          {c.descricao ? (
                            <Text
                              style={{
                                fontSize: 16,
                                color: "#3b4262",
                                fontWeight: "500",
                              }}
                            >
                              {c.descricao}
                            </Text>
                          ) : null}
                          <Text style={{ color: "#8a8b9d", fontWeight: "500" }}>
                            {c.data}
                          </Text>
                        </View>

                        {/* DIREITA */}
                        <View style={{ flexDirection: "column" }}>
                          {c.parcelas && (
                            <Text
                              style={{ color: "#007C91", fontWeight: "600" }}
                            >
                              💳 Parcela {c.parcelas.atual + 1} de{" "}
                              {c.parcelas.total}
                            </Text>
                          )}
                          <Text
                            style={{
                              fontWeight: "700",
                              color: "#b40000",
                              alignSelf: "flex-end",
                            }}
                          >
                            💸 R$ {restante.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {c.parcelas && c.parcelas.atual < c.parcelas.total ? (
                        <TouchableOpacity
                          style={[
                            styles.btnSalvar,
                            {
                              paddingVertical: 8,
                              paddingHorizontal: 13,
                              backgroundColor: "#176977",
                              marginTop: 12,
                              width: "75%",
                              alignSelf: "flex-end",
                            },
                          ]}
                          onPress={() => {
                            setCobrancaParcela(c);
                            setModalParcela(true);
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "500" }}>
                            💳 Registrar {c.parcelas.atual + 1}° parcela
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.btnSalvar,
                            {
                              paddingVertical: 8,
                              paddingHorizontal: 13,
                              backgroundColor: "#007C91",
                              marginTop: 12,
                              width: "75%",
                              alignSelf: "flex-end",
                            },
                          ]}
                          onPress={() => {
                            setCobrancaSelecionada(c);
                            setModalPagamento(true);
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "500",
                              fontSize: 13,
                            }}
                          >
                            ✅ Registrar pagamento
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* HISTÓRICO */}
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
              Histórico de pagamentos
            </Text>

            {pagamentosVisiveis.length === 0 ? (
              <Text style={styles.empty}>Nenhum pagamento realizado</Text>
            ) : pagamentosVisiveis.length <= 2 ? (
              pagamentosVisiveis.map((p) => {
                const cobranca = cobrancas.find((c) => c.id === p.cobrancaId);

                return (
                  <View key={p.id} style={[styles.card, { paddingTop: 7 }]}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#654A24",
                          fontSize: 15,
                          fontWeight: "600",
                        }}
                      >
                        Pago
                      </Text>
                      {cobranca?.parcelas && p.numeroParcela && (
                        <Text style={{ color: "#007C91", fontWeight: "600" }}>
                          Parcela {p.numeroParcela} de {cobranca.parcelas.total}
                        </Text>
                      )}
                    </View>
                    <View
                      style={{
                        borderBottomWidth: 0.2,
                        marginTop: 5,
                        marginBottom: 6,
                        borderColor: "#bdbdbd",
                      }}
                    ></View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        {cobranca?.descricao ? (
                          <Text
                            style={{
                              fontSize: 16,
                              color: "#3b4262",
                              fontWeight: "500",
                            }}
                          >
                            {cobranca.descricao}
                          </Text>
                        ) : null}
                        <Text style={{ color: "#8a8b9d", fontWeight: "500" }}>
                          {p.data}
                        </Text>
                      </View>

                      <View>
                        <Text
                          style={{
                            fontSize: 16,
                            color: "#3b4262",
                            fontWeight: "500",
                          }}
                        >
                          R$ {p.valor.toFixed(2)}
                        </Text>
                        <Text
                          style={{
                            color: "#8a8b9d",
                            fontWeight: "500",
                            alignSelf: "flex-end",
                          }}
                        >
                          💳 {p.forma}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <ScrollView
                style={{
                  maxHeight: 215,
                  borderWidth: 1.5,
                  borderRadius: 3,
                  borderColor: "#dbdbdb",
                }}
              >
                {pagamentosVisiveis.map((p) => {
                  const cobranca = cobrancas.find((c) => c.id === p.cobrancaId);

                  return (
                    <View key={p.id} style={[styles.card, { paddingTop: 7 }]}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#654A24",
                            fontSize: 15,
                            fontWeight: "600",
                          }}
                        >
                          Pago
                        </Text>
                        {cobranca?.parcelas && p.numeroParcela && (
                          <Text style={{ color: "#007C91", fontWeight: "600" }}>
                            Parcela {p.numeroParcela} de{" "}
                            {cobranca.parcelas.total}
                          </Text>
                        )}
                      </View>
                      <View
                        style={{
                          borderBottomWidth: 0.2,
                          marginTop: 5,
                          marginBottom: 6,
                          borderColor: "#bdbdbd",
                        }}
                      ></View>

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          {cobranca?.descricao ? (
                            <Text
                              style={{
                                fontSize: 16,
                                color: "#3b4262",
                                fontWeight: "500",
                              }}
                            >
                              {cobranca.descricao}
                            </Text>
                          ) : null}
                          <Text style={{ color: "#8a8b9d", fontWeight: "500" }}>
                            {p.data}
                          </Text>
                        </View>

                        <View>
                          <Text
                            style={{
                              fontSize: 16,
                              color: "#3b4262",
                              fontWeight: "500",
                            }}
                          >
                            R$ {p.valor.toFixed(2)}
                          </Text>
                          <Text
                            style={{
                              color: "#8a8b9d",
                              fontWeight: "500",
                              alignSelf: "flex-end",
                            }}
                          >
                            💳 {p.forma}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.btnLimpar}
              onPress={() =>
                Alert.alert(
                  "Limpar pagamentos",
                  "Deseja apagar todo o histórico de pagamentos?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Apagar tudo",
                      style: "destructive",
                      onPress: () => {
                        setPagamentos((prev) =>
                          prev.map((p) => ({ ...p, oculto: true })),
                        );
                      },
                    },
                  ],
                )
              }
            >
              <Text style={styles.btnLimparText}>
                Excluir histórico de pagamentos
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal visible={modalCobranca} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: "700", marginBottom: 10, fontSize: 16 }}>
              Nova cobrança
            </Text>

            {historicoConsultas.length <= 3 ? (
              historicoConsultas.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => setConsultaSelecionada(h)}
                  style={{
                    maxHeight: 200,
                    borderWidth: 0.5,
                    borderColor: "#ccc",
                    paddingRight: 4,
                    padding: 8,
                    marginTop: 6,
                    borderRadius: 8,
                    backgroundColor:
                      consultaSelecionada?.id === h.id ? "#053a72" : "#eee",
                  }}
                >
                  <Text
                    style={{
                      color: consultaSelecionada?.id === h.id ? "#fff" : "#333",
                      fontWeight:
                        consultaSelecionada?.id === h.id ? "700" : "400",
                    }}
                  >
                    📅 {new Date(h.data).toLocaleDateString()}
                    {h.obs ? ` - ${h.obs}` : ""}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <ScrollView
                style={{ maxHeight: 170 }} // controla altura visível
                showsVerticalScrollIndicator={true}
              >
                {historicoConsultas.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => setConsultaSelecionada(h)}
                    style={{
                      maxHeight: 200,
                      borderWidth: 0.5,
                      borderColor: "#ccc",
                      paddingRight: 4,
                      padding: 8,
                      marginTop: 6,
                      borderRadius: 8,
                      backgroundColor:
                        consultaSelecionada?.id === h.id ? "#053a72" : "#eee",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          consultaSelecionada?.id === h.id ? "#fff" : "#333",
                        fontWeight:
                          consultaSelecionada?.id === h.id ? "700" : "400",
                      }}
                    >
                      📅 {new Date(h.data).toLocaleDateString()}
                      {h.obs ? ` - ${h.obs}` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={{ marginTop: 10 }}>Digite o valor cobrado:</Text>

            <TextInput
              placeholder="R$ 0.00"
              placeholderTextColor="#94A3B8"
              value={valorCobranca}
              onChangeText={setValorCobranca}
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.btnSalvar, { marginTop: 16 }]}
              onPress={() => {
                if (!consultaSelecionada) return;

                setCobrancas((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    consultaId: consultaSelecionada.id,
                    descricao: consultaSelecionada.obs || "Consulta",
                    valor: Number(valorCobranca),
                    data: new Date(
                      consultaSelecionada.data,
                    ).toLocaleDateString(),

                    quitado: false,
                  },
                ]);

                setModalCobranca(false);
                setValorCobranca("");
                setConsultaSelecionada(null);
              }}
            >
              <Text style={{ color: "#fff" }}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalCobranca(false)}>
              <Text
                style={{ marginTop: 10, textAlign: "center", color: "#777" }}
              >
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalPagamento} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 10 }}>
              Registrar pagamento
            </Text>

            <Text style={{ marginBottom: 5 }}>
              Selecione o dia em que foi pago:
            </Text>
            <TouchableOpacity onPress={() => setMostrarDatePicker(true)}>
              <Text
                style={{
                  marginTop: 5,
                  borderWidth: 4,
                  padding: 7,
                  borderColor: "#a9a9a9",
                  borderRadius: 10,
                  width: "40%",
                }}
              >
                📅 {dataPagamento || "Selecionar data"}
              </Text>
            </TouchableOpacity>

            {mostrarDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setMostrarDatePicker(false);
                  if (date) {
                    setDataPagamento(date.toLocaleDateString());
                  }
                }}
              />
            )}

            <Text style={{ marginTop: 15 }}>Forma de pagamento:</Text>

            {["pix", "credito", "debito", "dinheiro"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFormaPagamento(f as any)}
              >
                <Text style={{ marginTop: 6 }}>
                  {formaPagamento === f ? "✅" : "⬜"} {f}
                </Text>
              </TouchableOpacity>
            ))}

            {formaPagamento === "credito" && (
              <>
                <Text style={{ marginTop: 10 }}>
                  Parcelar em quantas vezes?
                </Text>

                <TextInput
                  value={parcelas}
                  onChangeText={setParcelas}
                  keyboardType="numeric"
                  style={[styles.input, { width: 60 }]}
                  placeholder="Ex: 5"
                  placeholderTextColor="#94A3B8"
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.btnSalvar, { marginTop: 16 }]}
              onPress={() => {
                if (!cobrancaSelecionada) return;

                const qtdParcelas =
                  formaPagamento === "credito" ? Number(parcelas) : 1;

                if (formaPagamento === "credito" && qtdParcelas > 1) {
                  const valorParcela = cobrancaSelecionada.valor / qtdParcelas;

                  // Atualiza cobrança com parcelas
                  setCobrancas((prev) =>
                    prev.map((c) =>
                      c.id === cobrancaSelecionada.id
                        ? {
                            ...c,
                            parcelas: {
                              total: qtdParcelas,
                              atual: 0,
                              valorParcela,
                            },
                          }
                        : c,
                    ),
                  );
                } else {
                  // pagamento normal
                  setPagamentos((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      cobrancaId: cobrancaSelecionada.id,
                      valor: cobrancaSelecionada.valor,
                      data: dataPagamento,
                      forma: formaPagamento,
                      oculto: false,
                    },
                  ]);

                  setCobrancas((prev) =>
                    prev.map((c) =>
                      c.id === cobrancaSelecionada.id
                        ? { ...c, quitado: true }
                        : c,
                    ),
                  );
                }

                setModalPagamento(false);
                setDataPagamento("");
                setParcelas("1");
              }}
            >
              <Text style={{ color: "#fff" }}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalPagamento(false)}>
              <Text
                style={{ marginTop: 10, textAlign: "center", color: "#777" }}
              >
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalParcela} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontWeight: "700", fontSize: 16 }}>
              Registrar parcela
            </Text>

            <Text style={{ marginTop: 10 }}>
              Selecione o dia em que foi pago:
            </Text>

            <TouchableOpacity onPress={() => setMostrarDatePicker(true)}>
              <Text style={styles.input}>
                📅 {dataParcela || "Selecionar data"}
              </Text>
            </TouchableOpacity>

            {mostrarDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setMostrarDatePicker(false);
                  if (date) {
                    setDataParcela(date.toLocaleDateString());
                  }
                }}
              />
            )}

            <TouchableOpacity
              style={[styles.btnSalvar, { marginTop: 16 }]}
              onPress={() => {
                if (!cobrancaParcela || !cobrancaParcela.parcelas) return;

                const proxima = cobrancaParcela.parcelas.atual + 1;

                setPagamentos((prevPagamentos) => {
                  const novosPagamentos: Pagamento[] = [
                    ...prevPagamentos,
                    {
                      id: Date.now().toString(),
                      cobrancaId: cobrancaParcela.id,
                      valor: cobrancaParcela.parcelas.valorParcela,
                      data: dataParcela,
                      forma: "credito",
                      numeroParcela: proxima,
                      oculto: false,
                    },
                  ];

                  setCobrancas((prevCobrancas) =>
                    prevCobrancas.map((cb) => {
                      if (cb.id !== cobrancaParcela.id || !cb.parcelas)
                        return cb;

                      const terminou = proxima === cb.parcelas.total;

                      return {
                        ...cb,
                        parcelas: {
                          ...cb.parcelas,
                          atual: proxima,
                        },
                        quitado: terminou,
                      };
                    }),
                  );

                  return novosPagamentos;
                });

                setModalParcela(false);
                setDataParcela("");
              }}
            >
              <Text style={{ color: "#fff" }}>Salvar parcela</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalParcela(false)}>
              <Text style={{ marginTop: 10, textAlign: "center" }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!imagemSelecionada}
        transparent
        animationType="fade"
        onRequestClose={() => setImagemSelecionada(null)}
      >
        <View style={styles.modalContainer}>
          {imagemSelecionada && (
            <Image
              source={{ uri: imagemSelecionada }}
              style={styles.imagemExpandida}
              resizeMode="contain"
            />
          )}

          {imagemSelecionada && (
            <View style={{ flexDirection: "row", gap: 80 }}>
              <TouchableOpacity
                style={styles.fecharModal}
                onPress={() => setImagemSelecionada(null)}
              >
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                >
                  Fechar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnExcluirNoModal}
                onPress={() => {
                  Alert.alert(
                    "Excluir imagem",
                    "Tem certeza que deseja excluir esta imagem?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Excluir",
                        style: "destructive",
                        onPress: () => {
                          excluirImagem(imagemSelecionada!);
                          setImagemSelecionada(null);
                        },
                      },
                    ],
                  );
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                >
                  Excluir
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={!!arquivoSelecionado}
        transparent
        animationType="fade"
        onRequestClose={() => setArquivoSelecionado(null)}
      >
        <View style={styles.modalContainer}>
          {arquivoSelecionado && (
            <View style={styles.modalArquivoBox}>
              <View style={{ marginBottom: 12 }}>
                {arquivoSelecionado &&
                  getIconByFileName(arquivoSelecionado.name)}
              </View>

              <Text style={styles.nomeArquivoModal}>
                {arquivoSelecionado.name}
              </Text>

              <TouchableOpacity
                style={styles.botaoAbrirArquivo}
                onPress={() => abrirArquivo(arquivoSelecionado.uri)}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Abrir arquivo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoFecharArquivo}
                onPress={() => setArquivoSelecionado(null)}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#2F6FB2",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  nome: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.2,
    borderBottomColor: "#888",
  },

  tabText: {
    color: "#888",
    fontWeight: "600",
  },

  tabAtiva: {
    color: "#2F6FB2",
    borderBottomWidth: 2,
    borderBottomColor: "#2F6FB2",
    paddingBottom: 0.2,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 6,
    color: "#2F6FB2",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },

  cardAgendada: {
    borderLeftWidth: 6,
    borderLeftColor: "#3498db",
  },

  cardHistorico: {
    borderLeftWidth: 6,
    borderLeftColor: "#2ecc71",
  },

  cardManutencao: {
    borderLeftWidth: 6,
    borderLeftColor: "#9b59b6",
  },

  cardTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },

  empty: {
    color: "#777",
    marginBottom: 5,
  },

  btnLimpar: {
    marginTop: 20,
    marginBottom: 90,
    backgroundColor: "#dc2510",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  btnLimparText: {
    color: "#fff",
    fontWeight: "bold",
  },

  mapaSvg: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
  },

  arcada: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },

  btnSalvar: {
    backgroundColor: "#2F6FB2",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  btnTratado: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
  },

  btnTratadoOk: {
    backgroundColor: "#eafaf1",
    borderColor: "#2ecc71",
  },

  btnTratadoPendente: {
    backgroundColor: "#fef9e7",
    borderColor: "#f1c40f",
  },

  btnTratadoText: {
    fontSize: 12,
    fontWeight: "600",
  },

  mapaImagemContainer: {
    position: "relative",
    backgroundColor: "#fff",
    elevation: 2,
    borderRadius: 12,
    marginBottom: 12,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
  },

  mapaImagem: {
    width: "100%",
    height: 180,
  },

  denteArea: {
    position: "absolute",
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  bolinhaMapa: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  numeroFDI: {
    fontSize: 10,
    color: "#555",
    textAlign: "center",
  },

  btnAdicionarOrto: {
    marginTop: 23,
    borderWidth: 4,
    borderColor: "#214f7f",
    backgroundColor: "#2F6FB2",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },

  cardResumoOrto: {
    backgroundColor: "#F8FBFF",
    borderRadius: 10,
    padding: 10,
  },

  cardHistoricoProximo: {
    backgroundColor: "#F8FBFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 5,
    width: "auto",
  },

  gridOrto: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  boxOrto: {
    width: "48%",
  },

  labelOrto: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },

  valorOrto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },

  btnEditarPlano: {
    backgroundColor: "#2F6FB2",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    alignSelf: "center",
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },

  cardAcessorio: {
    width: "48%",
  },

  cardNovoAcessorio: {
    width: "48%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#9b59b6",
  },

  btnEditarMini: {
    backgroundColor: "#2F6FB2",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    width: "46%",
  },

  btnAdesao: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  btnAdesaoAtivo: {
    backgroundColor: "#0097A7",
    borderColor: "#0097A7",
  },

  btnExcluirAcessorio: {
    backgroundColor: "#e74c3c",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    width: "46%",
  },

  rowBotoesAcessorio: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
    justifyContent: "space-between",
  },

  cardRegistroHorizontal: {
    width: 194,
    marginRight: 10,
  },
  numeroDente: {
    color: "#777777",
  },

  gridChecklist: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  checkItem: {
    width: "30%",
    marginBottom: 10,
  },

  checkButton: {
    backgroundColor: "#F2F4F8",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  checkConcluido: {
    backgroundColor: "#2ecc71",
  },

  btnAdicionarEtapa: {
    marginTop: 5,
    alignItems: "center",
  },

  progressContainer: {
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 5,
  },

  progressBar: {
    height: 10,
    backgroundColor: "#2F6FB2",
  },

  inputChecklist: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    fontSize: 12,
  },
  headerPlanejamento: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardFicha: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 3,
    position: "relative",
  },

  linhaDupla: {
    flexDirection: "row",
    gap: 55,
    justifyContent: "space-between",
  },

  coluna: {
    width: "48%",
  },

  label: {
    fontSize: 13,
    color: "#777",
    marginTop: 7,
  },

  valor: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  col: {
    width: "48%",
  },

  enderecoContainer: {
    marginTop: 20,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  btnEditarFicha: {
    backgroundColor: "#007C91",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  botaoEditarFlutuante: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#2F6FB2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
  },

  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },

  botaoAdicionar: {
    backgroundColor: "#eaeaea",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  botaoTexto: {
    fontSize: 13,
    fontWeight: "500",
    color: "#444",
  },

  textoVazio: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },

  imagensContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },

  imagemPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },

  arquivoItem: {
    flexDirection: "row",
    backgroundColor: "#f7f7f7",
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },

  nomeArquivo: {
    fontSize: 13,
    color: "#333",
    marginRight: 10,
  },

  grid: {
    marginVertical: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 28,
    marginHorizontal: 10,
  },

  imagemGrid: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },

  modalImagemBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalImagemContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  imagemExpandida: {
    width: "90%",
    height: "50%",
    marginBottom: 95,
    marginTop: 95,
  },

  fecharModal: {
    bottom: 10,
    backgroundColor: "#00BCD4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    padding: 10,
  },

  modalArquivoBox: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
  },

  iconeArquivoGrande: {
    fontSize: 60,
    marginBottom: 12,
  },

  nomeArquivoModal: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  botaoFecharArquivo: {
    backgroundColor: "#5c5c5c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  botaoAbrirArquivo: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    marginTop: 25,
  },

  btnExcluirNoModal: {
    backgroundColor: "#e74c3c",
    bottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    padding: 10,
  },

  btnExcluirMini: {
    marginLeft: 8,
    backgroundColor: "#b8221f",
    padding: 6,
    borderRadius: 6,
    height: 32,
  },

  fileIcon: {
    fontSize: 22,
    marginRight: 8,
  },

  resumoGrid: {
    flexDirection: "row",
    gap: 10,
  },

  cardResumo: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 2,
  },

  resumoTitulo: {
    fontSize: 15.5,
    fontWeight: "500",
    color: "#002d4e",
  },

  resumoValor: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#2F6FB2",
  },

  resumoLinha: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: "600",
    color: "#333",
  },
});
