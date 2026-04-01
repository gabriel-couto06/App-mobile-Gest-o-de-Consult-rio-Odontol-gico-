import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./authContext";

/* ===== TIPOS ===== */

export type HistoricoConsulta = {
  id: string;
  data: string;
  hora: string;
  obs: string;
  tipo?: "consulta" | "manutencao";
};

export type DenteRegistro = {
  numero: string;
  nome: string;
  obs: string;
  tratado: boolean;
};

export type Cobranca = {
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

export type Pagamento = {
  id: string;
  cobrancaId: string;
  valor: number;
  data: string;
  forma: "pix" | "credito" | "debito" | "dinheiro";

  numeroParcela?: number;
  oculto?: boolean;
};

export type Paciente = {
  id: string;
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
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  convenio: "sim" | "nao";
  nomeConvenio?: string;

  cobrancas?: Cobranca[];
  pagamentos?: Pagamento[];

  imagens?: string[];
  arquivos?: {
    name: string;
    uri: string;
  }[];

  historico: HistoricoConsulta[];
  odontograma: DenteRegistro[];

  planejamentoOrto?: {
    dataInicio: string;
    tempoEstimado: string;
    faseAtual: string;
    acessorios: {
      id: string;
      tipo: string;
      instrucao: string;
      adesao: "boa" | "irregular";
    }[];

    etapas: {
      id: string;
      texto: string;
      concluido: boolean;
    }[];
  };
};

/* ===== CONTEXTO ===== */

type PacienteContextType = {
  pacientes: Paciente[];
  adicionarPaciente: (
    p: Omit<Paciente, "id" | "historico" | "odontograma" | "planejamentoOrto">,
  ) => void;
  adicionarHistorico: (
    pacienteNome: string,
    consulta: HistoricoConsulta,
  ) => void;
  salvarPlanejamentoOrto: (
    pacienteId: string,
    planejamento: Paciente["planejamentoOrto"],
  ) => void;

  removerPaciente: (id: string) => void;
  limparHistorico: (pacienteId: string) => void;

  salvarDente: (pacienteId: string, dente: DenteRegistro) => void;
  removerDente: (pacienteId: string, numero: string) => void;
  toggleTratado: (pacienteId: string, numero: string) => void;

  atualizarPaciente: (id: string, dados: Partial<Paciente>) => void;

  adicionarImagem: (pacienteId: string, uri: string) => void;
  removerImagem: (pacienteId: string, uri: string) => void;

  adicionarArquivo: (
    pacienteId: string,
    arquivo: { name: string; uri: string },
  ) => void;

  removerArquivo: (pacienteId: string, uri: string) => void;
};

const PacienteContext = createContext({} as PacienteContextType);

/* ===== PROVIDER ===== */

export function PacienteProvider({ children }: { children: ReactNode }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [carregado, setCarregado] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      carregarPacientes();
    }
  }, [user]);

  async function carregarPacientes() {
    if (!user) return;

    const snapshot = await getDocs(
      collection(db, "usuarios", user.uid, "pacientes"),
    );

    const lista: Paciente[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Paciente[];

    setPacientes(lista);
  }

  useEffect(() => {
    if (carregado) {
      AsyncStorage.setItem("pacientes", JSON.stringify(pacientes));
    }
  }, [pacientes, carregado]);

  async function atualizarPaciente(id: string, dados: Partial<Paciente>) {
    if (!user) return;

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", id), dados);

    setPacientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...dados } : p)),
    );
  }

  async function adicionarImagem(pacienteId: string, uri: string) {
    if (!user) return;

    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (!paciente) return;

    const novasImagens = [...(paciente.imagens || []), uri];

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      imagens: novasImagens,
    });

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === pacienteId ? { ...p, imagens: novasImagens } : p,
      ),
    );
  }

  async function removerImagem(pacienteId: string, uri: string) {
    if (!user) return;

    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (!paciente) return;

    const novasImagens = paciente.imagens?.filter((img) => img !== uri) || [];

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      imagens: novasImagens,
    });

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === pacienteId ? { ...p, imagens: novasImagens } : p,
      ),
    );
  }

  async function adicionarArquivo(
    pacienteId: string,
    arquivo: { name: string; uri: string },
  ) {
    if (!user) return;

    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (!paciente) return;

    const novosArquivos = [...(paciente.arquivos || []), arquivo];

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      arquivos: novosArquivos,
    });

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === pacienteId ? { ...p, arquivos: novosArquivos } : p,
      ),
    );
  }

  async function removerArquivo(pacienteId: string, uri: string) {
    if (!user) return;

    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (!paciente) return;

    const novosArquivos = paciente.arquivos?.filter((a) => a.uri !== uri) || [];

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      arquivos: novosArquivos,
    });

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === pacienteId ? { ...p, arquivos: novosArquivos } : p,
      ),
    );
  }

  /* ===== PACIENTE ===== */

  async function adicionarPaciente(
    p: Omit<Paciente, "id" | "historico" | "odontograma">,
  ) {
    if (!user) return;

    const novoPaciente = {
      ...p,
      historico: [],
      odontograma: [],
      planejamentoOrto: {
        dataInicio: "",
        tempoEstimado: "24 meses",
        faseAtual: "Alinhamento inicial",
        acessorios: [],
        etapas: [],
      },
    };

    const docRef = await addDoc(
      collection(db, "usuarios", user.uid, "pacientes"),
      novoPaciente,
    );

    setPacientes((prev) => [...prev, { ...novoPaciente, id: docRef.id }]);
  }

  async function removerPaciente(id: string) {
    if (!user) return;

    await deleteDoc(doc(db, "usuarios", user.uid, "pacientes", id));

    setPacientes((prev) => prev.filter((p) => p.id !== id));
  }

  /* ===== HISTÓRICO ===== */

  async function adicionarHistorico(
    pacienteNome: string,
    consulta: HistoricoConsulta,
  ) {
    if (!user) return;

    const paciente = pacientes.find((p) => p.nome === pacienteNome);
    if (!paciente) return;

    const novoHistorico = [
      ...paciente.historico,
      {
        ...consulta,
        tipo: consulta.tipo ?? "consulta",
      },
    ];

    // Atualiza no Firestore
    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", paciente.id), {
      historico: novoHistorico,
    });

    // Atualiza no estado local
    setPacientes((prev) =>
      prev.map((p) =>
        p.id === paciente.id ? { ...p, historico: novoHistorico } : p,
      ),
    );
  }

  async function limparHistorico(pacienteId: string) {
    if (!user) return;

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      historico: [],
    });

    setPacientes((prev) =>
      prev.map((p) => (p.id === pacienteId ? { ...p, historico: [] } : p)),
    );
  }

  /* ===== ODONTOGRAMA ===== */

  async function salvarDente(pacienteId: string, dente: DenteRegistro) {
    if (!user) return;

    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (!paciente) return;

    const existe = paciente.odontograma.find((d) => d.numero === dente.numero);

    let novoOdontograma;

    if (existe) {
      novoOdontograma = paciente.odontograma.map((d) =>
        d.numero === dente.numero ? dente : d,
      );
    } else {
      novoOdontograma = [...paciente.odontograma, dente];
    }

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      odontograma: novoOdontograma,
    });

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === pacienteId ? { ...p, odontograma: novoOdontograma } : p,
      ),
    );
  }

  async function removerDente(pacienteId: string, numero: string) {
    if (!user) return;

    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (!paciente) return;

    const novoOdontograma = paciente.odontograma.filter(
      (d) => d.numero !== numero,
    );

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      odontograma: novoOdontograma,
    });

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === pacienteId ? { ...p, odontograma: novoOdontograma } : p,
      ),
    );
  }

  async function toggleTratado(pacienteId: string, numero: string) {
    if (!user) return;

    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (!paciente) return;

    const novoOdontograma = paciente.odontograma.map((d) =>
      d.numero === numero ? { ...d, tratado: !d.tratado } : d,
    );

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      odontograma: novoOdontograma,
    });

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === pacienteId ? { ...p, odontograma: novoOdontograma } : p,
      ),
    );
  }

  async function salvarPlanejamentoOrto(
    pacienteId: string,
    planejamento: Paciente["planejamentoOrto"],
  ) {
    if (!user) return;

    await updateDoc(doc(db, "usuarios", user.uid, "pacientes", pacienteId), {
      planejamentoOrto: planejamento,
    });

    setPacientes((prev) =>
      prev.map((p) =>
        p.id === pacienteId ? { ...p, planejamentoOrto: planejamento } : p,
      ),
    );
  }

  return (
    <PacienteContext.Provider
      value={{
        pacientes,
        adicionarPaciente,
        adicionarHistorico,
        removerPaciente,
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
      }}
    >
      {children}
    </PacienteContext.Provider>
  );
}

export function usePaciente() {
  return useContext(PacienteContext);
}
