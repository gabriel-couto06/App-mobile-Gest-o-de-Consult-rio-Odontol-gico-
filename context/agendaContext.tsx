import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePaciente } from "./pacienteContext";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./authContext";
import { Linking } from "react-native";
import {
  agendarNotificacaoConsulta,
  cancelarNotificacaoConsulta,
} from "../services/notificacoes";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Consulta = {
  id: string;
  paciente: string;
  data: Date;
  hora: string;
  obs: string;
  status: "agendado" | "confirmado";
  tipo?: "consulta" | "manutencao";
  confirmacaoWhatsapp?: "nao_enviado" | "pendente" | "confirmado";
};

type AgendaContextType = {
  consultas: Consulta[];
  adicionarConsulta: (c: Consulta) => void;
  confirmarConsulta: (id: string) => void;
  cancelarConsulta: (id: string) => void;
  enviarConfirmacaoWhatsApp: (id: string) => void;
  marcarComoConfirmada: (id: string) => void;
};

const AgendaContext = createContext({} as AgendaContextType);

export function AgendaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [carregado, setCarregado] = useState(false);
  const { adicionarHistorico } = usePaciente();
  const { pacientes } = usePaciente();

  useEffect(() => {
    if (user && !carregado) {
      carregarConsultas();
      setCarregado(true);
    }
  }, [user]);

  useEffect(() => {
    if (consultas.length > 0) {
      verificarConsultasVencidas();
    }
  }, [consultas]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      verificarConsultasVencidas();
    }, 60000);

    return () => clearInterval(intervalo);
  }, [consultas]);

  async function carregarConsultas() {
    if (!user) return;

    const snapshot = await getDocs(
      collection(db, "usuarios", user.uid, "consultas"),
    );

    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      data: new Date(doc.data().data),
    })) as Consulta[];

    setConsultas(lista);

    // pega só consultas de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const consultasHoje = lista
      .filter((c) => {
        const d = new Date(c.data);
        return d >= hoje && d < amanha;
      })
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .map((c) => ({
        hora: c.hora,
        paciente: c.paciente,
      }));
  }

  async function adicionarConsulta(novaConsulta: Consulta) {
    if (!user) return;

    const conflito = consultas.some(
      (c) =>
        c.data.getTime() === novaConsulta.data.getTime() &&
        c.hora === novaConsulta.hora,
    );

    if (conflito) {
      alert("Já existe uma consulta nesse horário 😬");
      return;
    }

    const { id, ...consultaSemId } = novaConsulta;

    const docRef = await addDoc(
      collection(db, "usuarios", user.uid, "consultas"),
      {
        ...consultaSemId,
        status: "agendado",
        confirmacaoWhatsapp: "nao_enviado",
        data: novaConsulta.data.getTime(),
      },
    );

    await agendarNotificacaoConsulta(
      novaConsulta.paciente,
      novaConsulta.data,
      novaConsulta.hora,
      novaConsulta.obs,
    );

    setConsultas((prev) => [...prev, { ...consultaSemId, id: docRef.id }]);
  }

  async function confirmarConsulta(id: string) {
    if (!user) return;

    const consulta = consultas.find((c) => c.id === id);
    if (!consulta) return;

    adicionarHistorico(consulta.paciente, {
      id: consulta.id,
      data: consulta.data.toISOString(),
      hora: consulta.hora,
      obs:
        consulta.tipo === "manutencao"
          ? `Manutenção ortodôntica - ${consulta.obs}`
          : consulta.obs,
      tipo: consulta.tipo ?? "consulta",
    });

    await deleteDoc(doc(db, "usuarios", user.uid, "consultas", id));

    setConsultas((prev) => prev.filter((c) => c.id !== id));
  }

  async function cancelarConsulta(id: string) {
    if (!user) return;

    try {
      console.log("Tentando deletar:", id);

      const consulta = consultas.find((c) => c.id === id);
      if (!consulta) return;

      // cancela a notificação antes de deletar
      await cancelarNotificacaoConsulta(
        consulta.paciente,
        consulta.data,
        consulta.hora,
      );

      await deleteDoc(doc(db, "usuarios", user.uid, "consultas", id));

      setConsultas((prev) => prev.filter((c) => c.id !== id));

      console.log("Deletado com sucesso");
    } catch (error) {
      console.log("ERRO AO DELETAR:", error);
    }
  }

  async function enviarConfirmacaoWhatsApp(consultaId: string) {
    if (!user) return;

    const consulta = consultas.find((c) => c.id === consultaId);
    if (!consulta) return;

    const paciente = pacientes.find((p) => p.nome === consulta.paciente);
    if (!paciente?.telefone) {
      alert("Paciente sem telefone cadastrado.");
      return;
    }

    const dataFormatada = consulta.data.toLocaleDateString("pt-BR");

    const mensagem = `Olá ${consulta.paciente}, tudo bem?

Gostaria de confirmar sua consulta no dia ${dataFormatada} às ${consulta.hora}.

Poderia confirmar, por favor?`;

    const telefoneLimpo = paciente.telefone.replace(/\D/g, "");
    const url = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;

    await Linking.openURL(url);

    // SALVA NO FIRESTORE
    await updateDoc(doc(db, "usuarios", user.uid, "consultas", consultaId), {
      confirmacaoWhatsapp: "pendente",
    });

    // Atualiza local
    setConsultas((prev) =>
      prev.map((c) =>
        c.id === consultaId ? { ...c, confirmacaoWhatsapp: "pendente" } : c,
      ),
    );
  }

  async function marcarComoConfirmada(id: string) {
    if (!user) return;

    await updateDoc(doc(db, "usuarios", user.uid, "consultas", id), {
      confirmacaoWhatsapp: "confirmado",
    });

    setConsultas((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, confirmacaoWhatsapp: "confirmado" } : c,
      ),
    );
  }

  async function verificarConsultasVencidas() {
    if (!user) return;

    const agora = new Date();

    for (const consulta of [...consultas]) {
      const dataConsulta = new Date(consulta.data);

      const [hora, minuto] = consulta.hora.split(":").map(Number);
      dataConsulta.setHours(hora, minuto, 0, 0);

      if (dataConsulta < agora && consulta.status === "agendado") {
        // Envia pro histórico
        adicionarHistorico(consulta.paciente, {
          id: consulta.id,
          data: consulta.data.toISOString(),
          hora: consulta.hora,
          obs:
            consulta.tipo === "manutencao"
              ? `Manutenção ortodôntica - ${consulta.obs}`
              : consulta.obs,
          tipo: consulta.tipo ?? "consulta",
        });

        // Remove do Firestore
        await deleteDoc(
          doc(db, "usuarios", user.uid, "consultas", consulta.id),
        );

        // Remove do estado local
        setConsultas((prev) => prev.filter((c) => c.id !== consulta.id));
      }
    }
  }

  return (
    <AgendaContext.Provider
      value={{
        consultas,
        adicionarConsulta,
        confirmarConsulta,
        cancelarConsulta,
        enviarConfirmacaoWhatsApp,
        marcarComoConfirmada,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  return useContext(AgendaContext);
}
