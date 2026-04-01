import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAgenda } from "../../context/agendaContext";
import { Animated, Dimensions, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/authContext";

export default function Agenda() {
  const router = useRouter();
  const {
    consultas,
    confirmarConsulta,
    cancelarConsulta,
    enviarConfirmacaoWhatsApp,
    marcarComoConfirmada,
  } = useAgenda();
  const diasScrollRef = useRef<ScrollView>(null);

  const hoje = new Date();

  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());

  const screenWidth = Dimensions.get("window").width;

  const [painelAberto, setPainelAberto] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  const [painelConfigAberto, setPainelConfigAberto] = useState(false);
  const slideConfigAnim = useRef(new Animated.Value(screenWidth)).current;

  const [consultaSelecionada, setConsultaSelecionada] = useState<any>(null);
  const [modalConsultaAberto, setModalConsultaAberto] = useState(false);

  const [modoVisualizacao, setModoVisualizacao] = useState<"dia" | "semana">(
    "dia",
  );
  const [inicioSemana, setInicioSemana] = useState(getInicioSemana(new Date()));

  const { user, resetPassword } = useAuth();
  const { logout } = useAuth();

  function getInicioSemana(data: Date) {
    const d = new Date(data);
    const dia = d.getDay();
    const diff = dia === 0 ? -6 : 1 - dia; // segunda como início
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function semanaAnterior() {
    const nova = new Date(inicioSemana);
    nova.setDate(nova.getDate() - 7);
    setInicioSemana(nova);
  }

  function proximaSemana() {
    const nova = new Date(inicioSemana);
    nova.setDate(nova.getDate() + 7);
    setInicioSemana(nova);
  }

  useEffect(() => {
    const hoje = new Date();

    setMesAtual(hoje.getMonth());
    setAnoAtual(hoje.getFullYear());
    setDiaSelecionado(hoje.getDate());

    setTimeout(() => {
      const index = hoje.getDate() - 1;
      const boxWidth = 100;
      diasScrollRef.current?.scrollTo({
        x: index * boxWidth,
        animated: true,
      });
    }, 300);
  }, []);

  function diasDoMes(ano: number, mes: number) {
    return new Date(ano, mes + 1, 0).getDate();
  }

  function somar30Min(hora: string) {
    const [h, m] = hora.split(":").map(Number);
    const data = new Date();
    data.setHours(h);
    data.setMinutes(m + 30);

    const hh = String(data.getHours()).padStart(2, "0");
    const mm = String(data.getMinutes()).padStart(2, "0");

    return `${hh}:${mm}`;
  }

  const totalDias = diasDoMes(anoAtual, mesAtual);
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1);

  function mesAnterior() {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual((a) => a - 1);
    } else {
      setMesAtual((m) => m - 1);
    }
    setDiaSelecionado(1);
  }

  function proximoMes() {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual((a) => a + 1);
    } else {
      setMesAtual((m) => m + 1);
    }
    setDiaSelecionado(1);
  }

  const consultasDoDia = consultas
    .filter(
      (c) =>
        c.data.getDate() === diaSelecionado &&
        c.data.getMonth() === mesAtual &&
        c.data.getFullYear() === anoAtual,
    )
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const hojeReal = new Date();

  const consultasHoje = consultas
    .filter(
      (c) =>
        c.data.getDate() === hojeReal.getDate() &&
        c.data.getMonth() === hojeReal.getMonth() &&
        c.data.getFullYear() === hojeReal.getFullYear(),
    )
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const diasSemana = Array.from({ length: 5 }, (_, i) => {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    return dia;
  });

  function gerarHorarios() {
    const horarios = [];
    let hora = 8;
    let minuto = 0;

    while (!(hora === 18 && minuto === 30)) {
      const hh = String(hora).padStart(2, "0");
      const mm = String(minuto).padStart(2, "0");
      const horarioAtual = `${hh}:${mm}`;

      // Pular horário de almoço
      if (!(hora === 12 && minuto === 0) && !(hora === 12 && minuto === 30)) {
        horarios.push(horarioAtual);
      }

      minuto += 30;
      if (minuto === 60) {
        minuto = 0;
        hora++;
      }
    }

    return horarios;
  }

  const horariosDoDia = gerarHorarios();

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

  useEffect(() => {
    if (consultasHoje.length > 0) {
      setTimeout(() => {
        abrirPainel();
      }, 500);
    }
  }, []);

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

  function renderHorario(horario: string) {
    const consulta = consultasDoDia.find((c) => c.hora === horario);

    if (!consulta) {
      return (
        <TouchableOpacity
          key={horario}
          style={styles.slotVazio}
          onPress={() =>
            router.push({
              pathname: "/(agenda)/novo",
              params: {
                dia: diaSelecionado.toString(),
                mes: mesAtual.toString(),
                ano: anoAtual.toString(),
                hora: horario,
              },
            })
          }
        >
          <Text style={styles.slotHora}>{horario}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View
        key={consulta.id}
        style={[
          styles.card,
          consulta.tipo === "manutencao" && {
            borderWidth: 0,
            borderColor: "#9b59b6",
          },
        ]}
      >
        <View
          style={[
            styles.leftBar,
            consulta.tipo === "manutencao" && {
              backgroundColor: "#9b59b6",
            },
          ]}
        />

        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <Text style={styles.paciente}>{consulta.paciente}</Text>
            <Text style={styles.status}>{consulta.status}</Text>
          </View>

          <Text style={styles.horario}>
            ⏰{" "}
            <Text style={{ fontWeight: 600 }}>
              {consulta.hora} - {somar30Min(consulta.hora)}
            </Text>
            {consulta.tipo === "manutencao" && (
              <Text style={{ fontWeight: 700, color: "#9b59b6" }}>
                {" "}
                (Manutenção)
              </Text>
            )}
          </Text>

          {consulta.obs ? <Text style={styles.obs}>{consulta.obs}</Text> : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={() => cancelarConsulta(consulta.id)}
            >
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>

            {consulta.confirmacaoWhatsapp === "nao_enviado" ||
            !consulta.confirmacaoWhatsapp ? (
              <TouchableOpacity
                style={styles.btnWhatsapp}
                onPress={() => enviarConfirmacaoWhatsApp(consulta.id)}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                <Text style={styles.btnWhatsappText}>Confirmar</Text>
              </TouchableOpacity>
            ) : consulta.confirmacaoWhatsapp === "pendente" ? (
              <TouchableOpacity
                style={styles.btnPendente}
                onPress={() => marcarComoConfirmada(consulta.id)}
              >
                <View
                  style={[
                    styles.badge,
                    {
                      minWidth: 13,
                      height: 13,
                      right: -3,
                      top: -3,
                      backgroundColor: "#c41400",
                    },
                  ]}
                ></View>
                <Text style={[styles.btnWhatsappText, { fontWeight: 500 }]}>
                  Marcar confirmação
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.confirmadoText}>Consulta confirmada ✅</Text>
            )}
          </View>
        </View>
      </View>
    );
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
        <Text style={styles.title}>Agenda</Text>

        <Text
          style={{
            backgroundColor: "#035087",
            borderEndStartRadius: 14,
            borderBottomRightRadius: 14,
            width: 145,
            height: 8,
            marginBottom: 18,
          }}
        ></Text>

        <View style={styles.modoContainer}>
          <TouchableOpacity
            style={[
              styles.modoBtn,
              modoVisualizacao === "dia" && styles.modoAtivo,
            ]}
            onPress={() => setModoVisualizacao("dia")}
          >
            <Text style={styles.modoTexto}>Visualizar por dia</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modoBtn,
              modoVisualizacao === "semana" && styles.modoAtivo,
            ]}
            onPress={() => setModoVisualizacao("semana")}
          >
            <Text style={styles.modoTexto}>Visualizar por semana</Text>
          </TouchableOpacity>
        </View>

        {modoVisualizacao === "dia" && (
          <>
            {/* CONTROLE DE MÊS */}
            <View style={styles.mesHeader}>
              <TouchableOpacity onPress={mesAnterior}>
                <Text style={styles.mesBtn}>◀</Text>
              </TouchableOpacity>

              <Text style={styles.mesTexto}>
                {new Date(anoAtual, mesAtual).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <TouchableOpacity onPress={proximoMes}>
                <Text style={styles.mesBtn}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* DIAS */}
            <ScrollView
              ref={diasScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {dias.map((d) => {
                const dataDia = new Date(anoAtual, mesAtual, d);

                const diaSemanaNumero = dataDia.getDay();
                const fimDeSemana =
                  diaSemanaNumero === 0 || diaSemanaNumero === 6;

                const qtdConsultas = consultas.filter(
                  (c) =>
                    c.data.getDate() === d &&
                    c.data.getMonth() === mesAtual &&
                    c.data.getFullYear() === anoAtual,
                ).length;

                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.diaBox,
                      diaSelecionado === d && styles.diaSelecionado,
                    ]}
                    onPress={() => setDiaSelecionado(d)}
                  >
                    <Text style={styles.diaNumero}>{d}</Text>
                    <Text
                      style={[
                        styles.diaSemana,
                        fimDeSemana && { color: "#9f1212", fontWeight: 900 },
                      ]}
                    >
                      {dataDia.toLocaleDateString("pt-BR", {
                        weekday: "short",
                      })}
                    </Text>
                    <Text style={styles.qtd}>{qtdConsultas} consultas</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* LISTA DE HORÁRIOS */}

            <ScrollView
              style={{ marginTop: 10 }}
              contentContainerStyle={{ paddingBottom: 330 }}
              showsVerticalScrollIndicator={false}
            >
              {horariosDoDia.map((horario) => {
                if (horario === "13:00") {
                  return (
                    <View key="almoco">
                      <View style={styles.almocoContainer}>
                        <Text style={styles.almocoTexto}>
                          Horário de almoço
                        </Text>
                      </View>

                      {renderHorario(horario)}
                    </View>
                  );
                }

                return renderHorario(horario);
              })}
            </ScrollView>
          </>
        )}
      </View>

      {modoVisualizacao === "semana" && (
        <View style={{ flex: 1 }}>
          {/* Header com setas */}
          <View style={styles.semanaHeader}>
            <TouchableOpacity onPress={semanaAnterior}>
              <Text style={styles.mesBtn}>◀</Text>
            </TouchableOpacity>

            <Text style={styles.mesTexto}>
              Semana de {diasSemana[0].toLocaleDateString("pt-BR")}
            </Text>

            <TouchableOpacity onPress={proximaSemana}>
              <Text style={styles.mesBtn}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Linha dos dias */}
          <View style={styles.linhaDias}>
            <View style={styles.colunaHorarioHeader} />
            {diasSemana.map((dia, index) => (
              <View key={index} style={styles.celulaDia}>
                <Text style={styles.diaSemanaTexto}>
                  {dia.toLocaleDateString("pt-BR", { weekday: "short" })}
                </Text>
                <Text style={styles.diaDataTexto}>
                  {dia.toLocaleDateString("pt-BR")}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView>
            {horariosDoDia.map((horario) => {
              const linhaHorarioComum = (
                <View key={horario} style={styles.linhaHorario}>
                  <View style={styles.colunaHorario}>
                    <Text style={styles.horarioSemana}>{horario}</Text>
                  </View>

                  {diasSemana.map((dia, index) => {
                    const consulta = consultas.find(
                      (c) =>
                        c.data.getDate() === dia.getDate() &&
                        c.data.getMonth() === dia.getMonth() &&
                        c.data.getFullYear() === dia.getFullYear() &&
                        c.hora === horario,
                    );

                    return (
                      <View key={index} style={styles.celulaSemana}>
                        {consulta ? (
                          <TouchableOpacity
                            style={styles.cardSemana}
                            onPress={() => {
                              setConsultaSelecionada(consulta);
                              setModalConsultaAberto(true);
                            }}
                          >
                            {consulta.confirmacaoWhatsapp === "pendente" && (
                              <View
                                style={[
                                  styles.badgeMini,
                                  { backgroundColor: "#cbb400" },
                                ]}
                              />
                            )}

                            {consulta.confirmacaoWhatsapp === "confirmado" && (
                              <View
                                style={[
                                  styles.badgeMini,
                                  { backgroundColor: "#078b37" },
                                ]}
                              />
                            )}
                            <Text style={styles.nomeSemana}>
                              {consulta.paciente.split(" ")[0]}
                            </Text>
                            <Text style={styles.horaSemana}>(Visualizar)</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={{ width: "100%", height: "100%", flex: 1 }}
                            onPress={() =>
                              router.push({
                                pathname: "/(agenda)/novo",
                                params: {
                                  dia: dia.getDate().toString(),
                                  mes: dia.getMonth().toString(),
                                  ano: dia.getFullYear().toString(),
                                  hora: horario,
                                },
                              })
                            }
                          >
                            <Text style={styles.maisCelula}>＋</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              );

              if (horario === "13:00") {
                return (
                  <View key="almoco-wrapper">
                    <View style={styles.linhaAlmocoSemana}>
                      <Text style={styles.textoAlmocoSemana}>
                        Horário de almoço
                      </Text>
                    </View>
                    {linhaHorarioComum}
                  </View>
                );
              }

              return linhaHorarioComum;
            })}
          </ScrollView>
        </View>
      )}

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

      {modalConsultaAberto && consultaSelecionada && (
        <Modal transparent animationType="fade" visible={modalConsultaAberto}>
          <View style={styles.modalContainer}>
            <View
              style={[styles.modalCard, { paddingBottom: 2, paddingTop: 13 }]}
            >
              <View style={styles.topRow}>
                <Text style={styles.paciente}>
                  {consultaSelecionada.paciente}
                </Text>
                <Text style={styles.status}>{consultaSelecionada.status}</Text>
              </View>

              <Text style={styles.horario}>
                ⏰ {consultaSelecionada.hora} -{" "}
                {somar30Min(consultaSelecionada.hora)}
              </Text>

              {consultaSelecionada.obs && (
                <Text style={styles.obs}>{consultaSelecionada.obs}</Text>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.btnCancelar}
                  onPress={() => {
                    cancelarConsulta(consultaSelecionada.id);
                    setModalConsultaAberto(false);
                  }}
                >
                  <Text style={styles.btnText}>Cancelar</Text>
                </TouchableOpacity>
                {/* WHATSAPP */}
                {consultaSelecionada.confirmacaoWhatsapp === "nao_enviado" ||
                !consultaSelecionada.confirmacaoWhatsapp ? (
                  <TouchableOpacity
                    style={styles.btnWhatsapp}
                    onPress={() => {
                      enviarConfirmacaoWhatsApp(consultaSelecionada.id);

                      setConsultaSelecionada((prev: any) => ({
                        ...prev,
                        confirmacaoWhatsapp: "pendente",
                      }));
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                    <Text style={styles.btnWhatsappText}>Confirmar</Text>
                  </TouchableOpacity>
                ) : consultaSelecionada.confirmacaoWhatsapp === "pendente" ? (
                  <TouchableOpacity
                    style={styles.btnPendente}
                    onPress={() => {
                      marcarComoConfirmada(consultaSelecionada.id);

                      setConsultaSelecionada((prev: any) => ({
                        ...prev,
                        confirmacaoWhatsapp: "confirmado",
                      }));
                    }}
                  >
                    <View
                      style={[
                        styles.badge,
                        {
                          minWidth: 13,
                          height: 13,
                          right: -3,
                          top: -3,
                          backgroundColor: "#c41400",
                        },
                      ]}
                    ></View>
                    <Text style={styles.btnWhatsappText}>
                      Marcar confirmação
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.confirmadoText}>
                    Consulta confirmada ✅
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.btnFechar, { width: "100%", marginTop: 15 }]}
                onPress={() => setModalConsultaAberto(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push({
            pathname: "/(agenda)/novo",
            params: {
              dia: new Date().getDate().toString(),
              mes: new Date().getMonth().toString(),
              ano: new Date().getFullYear().toString(),
            },
          })
        }
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 17,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 1,
    marginTop: 30,
    color: "#222",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },

  mesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 17,
  },

  mesTexto: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  mesBtn: {
    fontSize: 22,
    paddingHorizontal: 10,
  },

  diaBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E3E8EC",
    width: 90,
    paddingBottom: 38,
    marginBottom: 3,
  },

  diaSelecionado: {
    borderColor: "#0097A7",
    borderWidth: 2,
  },

  diaNumero: {
    fontSize: 18,
    fontWeight: "bold",
  },

  diaSemana: {
    fontSize: 12,
    color: "#555",
  },

  qtd: {
    fontSize: 9.5,
    marginTop: 6,
    color: "#fff",
    backgroundColor: "#0097A7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 15,
    paddingVertical: 12,
    paddingRight: 12,
    elevation: 2,
  },

  leftBar: {
    width: 6,
    backgroundColor: "#0a3d62",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    marginRight: 10,
  },

  cardBody: {
    flex: 1,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  paciente: {
    fontSize: 18,
    fontWeight: "bold",
    width: "70%",
  },

  status: {
    fontSize: 12,
    color: "#0a3d62",
    fontWeight: "500",
  },

  horario: {
    fontSize: 15,
    color: "#555",
    marginTop: 4,
  },

  obs: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
    marginTop: 10,
  },

  btnCancelar: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  btnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 25,
    backgroundColor: "#00BCD4",
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },

  fabText: {
    color: "#fff",
    fontSize: 34,
    marginBottom: 2,
  },
  slotVazio: {
    backgroundColor: "#F2F4F6",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#E3E8EC",
  },

  slotHora: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
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
  almocoContainer: {
    marginTop: 20,
    marginBottom: 5,
    alignItems: "center",
  },

  almocoTexto: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#888",
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

  btnWhatsapp: {
    backgroundColor: "#2E7D5B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  btnWhatsappText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    alignItems: "center",
  },

  btnPendente: {
    backgroundColor: "#cbb400",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: "center",
  },

  confirmadoText: {
    alignSelf: "center",
    fontSize: 12,
    color: "#076329",
    fontWeight: "700",
  },

  modoContainer: {
    flexDirection: "row",
    gap: 10,
  },

  modoBtn: {
    flex: 1,
    backgroundColor: "#b0b0b0",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },

  modoAtivo: {
    backgroundColor: "#0097A7",
  },

  modoTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },

  semanaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  linhaDias: {
    flexDirection: "row",
  },

  colunaHorarioHeader: {
    width: 60,
  },

  celulaDia: {
    flex: 1,
    alignItems: "center",
  },

  diaSemanaTexto: {
    fontSize: 12,
    fontWeight: "600",
  },

  diaDataTexto: {
    fontSize: 11,
    color: "#666",
    marginBottom: 3,
  },

  linhaHorario: {
    flexDirection: "row",
    minHeight: 55,
  },

  colunaHorario: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  horarioSemana: {
    fontSize: 11,
    color: "#555",
  },

  celulaSemana: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#c4cacd",
    justifyContent: "center",
    alignItems: "center",
  },

  cardSemana: {
    backgroundColor: "#008192",
    paddingVertical: 8,
    width: "90%",
    borderRadius: 6,
    alignItems: "center",
  },

  nomeSemana: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  horaSemana: {
    fontSize: 10,
    color: "#fff",
  },
  linhaAlmocoSemana: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#dbe0e3",
  },

  textoAlmocoSemana: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },

  modalContainer: {
    position: "absolute",
    top: "25%",
    width: "90%",
    alignSelf: "center",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  maisCelula: {
    fontSize: 18,
    color: "#cbd5e1",
    fontWeight: "600",
  },
  badgeMini: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
