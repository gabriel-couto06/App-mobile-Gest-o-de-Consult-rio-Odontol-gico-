import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAgenda, Consulta } from '../../context/agendaContext';
import { useRouter } from 'expo-router';
import { usePaciente } from '../../context/pacienteContext';
import { useAuth } from '../../context/authContext';
import * as Notifications from "expo-notifications"

export default function Home() {
  const { consultas } = useAgenda();
  const router = useRouter();
  const { pacientes } = usePaciente();
  const { user, resetPassword } = useAuth();
  const { logout } = useAuth();

  const hojeReal = new Date();

  const consultasHoje = consultas.filter(
    (c) =>
      c.data.getDate() === hojeReal.getDate() &&
      c.data.getMonth() === hojeReal.getMonth() &&
      c.data.getFullYear() === hojeReal.getFullYear()
  );

  const screenWidth = Dimensions.get('window').width;
  const [painelAberto, setPainelAberto] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  const fadeUpAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const barraAnim = useRef(new Animated.Value(0)).current;

  const [painelConfigAberto, setPainelConfigAberto] = useState(false);
  const slideConfigAnim = useRef(new Animated.Value(screenWidth)).current;

  const hoje = new Date();
  const agora = new Date();

function getDateTime(consulta: Consulta): Date {
  const [h, m] = consulta.hora.split(':').map(Number);

  const data = new Date(consulta.data);
  data.setHours(h, m, 0, 0);

  return data;
}

const proximasConsultas = consultas
  .map((c: Consulta) => ({
    ...c,
    dateTime: getDateTime(c),
  }))
  .filter((c) => c.dateTime >= agora)
  .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
  .slice(0, 4);

  // 19 horários disponíveis por dia
  const totalHorariosDia = 19;
  const ocupacao = Math.min(
    Math.round((consultasHoje.length / totalHorariosDia) * 100),
    100
  );

  function corOcupacao() {
    if (ocupacao < 50) return '#2ecc71';
    if (ocupacao < 80) return '#f1c40f';
    return '#e74c3c';
  }

  useEffect(() => {
  if (ocupacao > 0) {
    Animated.timing(barraAnim, {
      toValue: ocupacao,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }
}, [ocupacao]);

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

  useEffect(() => {
Animated.parallel([
  Animated.timing(fadeUpAnim, {
    toValue: 0,
    duration: 700,
    useNativeDriver: true,
  }),
  Animated.timing(opacityAnim, {
    toValue: 1,
    duration: 130,
    useNativeDriver: true,
  }),
]).start();
  }, []);

  function formatarData(data: Date) {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

  return (
    <View style={{ flex: 1, backgroundColor: '#EEF3F6' }}>

      {!painelAberto && !painelConfigAberto &&(
        <View style={styles.topIcons}>
          <TouchableOpacity onPress={abrirPainel}>
            <View style={{ alignItems: 'center' }}>

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
                  <Text style={styles.badgeText}>
                    {consultasHoje.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginLeft: 18 }} onPress={abrirConfig}>
            <Ionicons name="settings-sharp" size={28} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

    <View style={[styles.container ,{ paddingBottom: 40 }]}>
      
      {/* ===== Cabeçalho ===== */}
      <Text style={styles.titulo}>Olá Doutor,</Text>
      <Text style={styles.subtitulo}>
        {hoje.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        })}
      </Text>

      {/* ===== Imagem ilustrativa ===== */}
      <Animated.View
  style={[
    {
      transform: [{ translateY: fadeUpAnim }],
      opacity: opacityAnim,
    },
  ]}
>

      <Image
        source={require('../../assets/images/CapaOdonto.jpeg')} 
        style={styles.imagem}
        resizeMode="contain"
      />

      {/* ===== Cards resumo ===== */}
      <View style={styles.cardsContainer}>
        
        <View style={styles.card}>
          <Text style={styles.cardNumero}>{pacientes.length}</Text>
          <Text style={[styles.cardTitulo, {fontSize:12.5}]}>Pacientes</Text>

          <TouchableOpacity
            style={styles.cardBotao}
            onPress={() => router.push('/prontuario')}
          >
            <Text style={styles.cardBotaoTexto}>Ver prontuário</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumero}>{consultasHoje.length}</Text>
          <Text style={[styles.cardTitulo, {fontSize:12.5}]}>Consultas hoje</Text>

          <TouchableOpacity
            style={styles.cardBotao}
            onPress={() => router.push('/(tabs)/agenda')}
          >
            <Text style={styles.cardBotaoTexto}>Ver agenda</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== Indicador de ocupação ===== */}
      <View style={styles.ocupacaoCard}>
        <Text style={styles.ocupacaoTitulo}>Ocupação do dia</Text>

        <View style={styles.barraFundo}>
          <Animated.View
  style={[
    styles.barraProgresso,
    {
      width: barraAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
      }),
      backgroundColor: corOcupacao(),
    },
  ]}
/>
        </View>

        <Text style={styles.ocupacaoTexto}>{ocupacao}% ocupado</Text>
      </View>

      {/* ===== Próximas consultas ===== */}
      <View style={[styles.proximasCard,{paddingTop: 10}]}>
        <Text style={styles.proximasTitulo}>Próxima consulta</Text>

        {proximasConsultas.length === 0 ? (
  <Text style={{ color: '#777', marginTop: 8 }}>
    Nenhuma consulta agendada 
  </Text>
  
) : proximasConsultas.length === 1 ? (
  <View style={{ height: 55 }}>

     {proximasConsultas.map((consulta) => (
            <View key={consulta.id} style={styles.linhaConsulta}>
  <View style={styles.caixaCard}>
    <Text style={styles.nome}>
    {consulta.paciente}</Text>
    <View style={{flexDirection: 'row', gap: 10}}>
    <Text style={[styles.data, {color: '#8a8b9d', fontWeight: '500'}]}>
      📅 {formatarData(consulta.data)}
    </Text>
  
     <Text style={styles.hora}>
       ⏰ {consulta.hora}
    </Text>
    </View>
  </View>
            </View>
          ))}
          </View>
) : (
  <View style={{ height: 55 }}>   
  <ScrollView
    nestedScrollEnabled={true}
    showsVerticalScrollIndicator={false}
  >

          {proximasConsultas.map((consulta) => (
            <View key={consulta.id} style={styles.linhaConsulta}>
  <View style={styles.caixaCard}>
    <Text style={styles.nome}>
    {consulta.paciente}</Text>
    <View style={{flexDirection: 'row', gap: 10}}>
    <Text style={[styles.data, {color: '#8a8b9d', fontWeight: '500'}]}>
      📅 {formatarData(consulta.data)}
    </Text>
  
     <Text style={styles.hora}>
       ⏰ {consulta.hora}
    </Text>
    </View>
  </View>
            </View>
          ))}
          </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.botaoAgenda}
          onPress={() => router.push('/(tabs)/agenda')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            Ver agenda completa
          </Text>
        </TouchableOpacity>
      </View>
      </Animated.View>
    </View>

      {painelAberto && (
        <>
          {/* Fundo escuro clicável */}
          <TouchableWithoutFeedback onPress={fecharPainel}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
      
          {/* Painel animado */}
          <Animated.View
            style={[
              styles.painel,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <Text style={styles.painelTitulo}>Consultas de Hoje</Text>
      
            <ScrollView>
            {consultasHoje.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhuma consulta hoje 
              </Text>
            ) : (
              consultasHoje.map((consulta) => (
                <View key={consulta.id} style={styles.painelCard}>
                  <Text style={styles.painelNome}>
                    {consulta.paciente}
                  </Text>
      
                  <Text style={styles.painelHora}>
                    {consulta.hora}  {consulta.tipo === 'manutencao' &&  <Text style={{fontWeight: 700, color: '#535353'}}>-  (Manutenção)</Text>}
                  </Text>
      
                  {consulta.obs ? (
                    <Text style={styles.painelObs}>
                      {consulta.obs}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
            </ScrollView>
      
            {/* BOTÃO FECHAR */}
            <TouchableOpacity
              style={styles.btnFechar}
              onPress={fecharPainel}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Fechar
              </Text>
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

<View style={{flexDirection: 'row', gap: 15}}>
<TouchableOpacity
              style={styles.btnFechar}
              onPress={fecharConfig}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
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
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
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

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#EEF3F6',
    padding: 20,
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 27,
  },

  subtitulo: {
    color: '#555',
    fontWeight: 600,
    marginBottom: 20,
  },

  imagem: {
    width: '100%',
    height: 150,
    marginBottom: 20,
  },

  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
  },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 10,
    borderRadius: 16,
    elevation: 3,
  },

  cardNumero: {
    fontSize: 25,
    fontWeight: 'bold',
  },

  cardTitulo: {
    color: '#666',
    marginBottom: 8,
  },

  cardBotao: {
    marginTop: 5,
    backgroundColor: '#007C91',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  cardBotaoTexto: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '600',
  },

  ocupacaoCard: {
    backgroundColor: '#fff',
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    elevation: 3,
  },

  ocupacaoTitulo: {
    fontWeight: 'bold',
    marginBottom: 8,
  },

  barraFundo: {
    width: '100%',
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },

  barraProgresso: {
    height: '100%',
    borderRadius: 10,
  },

  ocupacaoTexto: {
    fontSize: 11,
    marginTop: 4,
    color: '#555',
    fontWeight: '600',
  },

  proximasCard: {
    backgroundColor: '#fff',
    marginTop: 18,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 16,
    borderRadius: 16,
    elevation: 3,
  },

  caixaCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 20,
    paddingBottom: 8,
    paddingTop: 5,
    width: 'auto',
  },

  proximasTitulo: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 3,
  },

  linhaConsulta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 2,
  },

  hora: {
    fontWeight: 'bold',
    color: '#515151'
  },

  nome: {
    color: '#0e588a',
    fontWeight: 900,
  },

  botaoAgenda: {
    marginTop: 11,
    backgroundColor: '#0a3d62',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

topIcons: {
  position: 'absolute',
  top: 55,
  right: 20,
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 100,
},

icon: {
  fontSize: 22,
},

painel: {
  position: 'absolute',
  right: 0,
  width: 258,
  height: '60%',
  backgroundColor: '#fff',
  marginTop: 55,
  paddingTop: 30,
  paddingHorizontal: 14,
  elevation: 20,
  borderLeftWidth: 1,
  borderColor: '#E3E8EC',
  borderBottomLeftRadius: 20,
  borderTopLeftRadius: 20,
  zIndex: 10,
},

painelTitulo: {
  color: '#0a3d62',
  fontSize: 19,
  fontWeight: 'bold',
  marginBottom: 15,
},

painelCard: {
  backgroundColor: '#F4F7FA',
  padding: 12,
  borderRadius: 12,
  marginBottom: 12,
},

painelNome: {
  fontWeight: 'bold',
  fontSize: 15,
},

painelHora: {
  fontSize: 13,
  color: '#0a3d62',
  marginTop: 2,
},

painelObs: {
  fontSize: 12,
  color: '#555',
  marginTop: 3,
},

overlay: {
  position: 'absolute',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.3)',
  zIndex: 5,
},

btnFechar: {
  marginTop: 15,
  marginBottom: 18,
  backgroundColor: '#0a3d62',
  paddingVertical: 10,
  borderRadius: 10,
  alignItems: 'center',
  width: '40%',
  alignSelf: 'center',
},

notificacaoTextoContainer: {
  position: 'absolute',
  top: -20,
  width: 121,
  backgroundColor: '#fff',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 6,
  elevation: 5,
},

notificacaoTexto: {
  color: '#363636',
  fontSize: 10,
  fontWeight: '600',
  textAlign: 'center',
},

badge: {
  position: 'absolute',
  right: -4,
  top: -4,
  backgroundColor: '#e74c3c',
  borderRadius: 10,
  minWidth: 16,
  height: 16,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 4,
},

badgeText: {
  color: '#fff',
  fontSize: 9,
  fontWeight: 'bold',
},
 emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  data: {
  fontSize: 14,
  color: '#888',
  fontWeight: 500,
},
btnLogout: {
  backgroundColor: '#e74c3c',
  marginTop: 15,
  marginBottom: 18,
  paddingVertical: 10,
  borderRadius: 10,
  alignItems: 'center',
  width: '52%',
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
  textAlign: 'center',
}

});


// eas build -p android --profile preview