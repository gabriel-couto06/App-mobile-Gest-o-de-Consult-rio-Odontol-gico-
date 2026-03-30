import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAgenda } from '../../context/agendaContext';
import { usePaciente } from '../../context/pacienteContext';

export default function NovaConsulta() {
  const router = useRouter();
  const { adicionarConsulta, consultas } = useAgenda();
  const { pacientes } = usePaciente();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalCadastro, setModalCadastro] = useState(false);

  const [paciente, setPaciente] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [obs, setObs] = useState('');

  const { dia, mes, ano, hora: horaParam } = useLocalSearchParams();

  const [data, setData] = useState<Date | null>(() => {
  if (dia && mes && ano) {
    return new Date(
      Number(ano),
      Number(mes),
      Number(dia)
    );
  }
  return null;
});

const [hora, setHora] = useState<string>(
  typeof horaParam === 'string' ? horaParam : ''
);


  function agendar() {
    if (!paciente || !data || !hora) {
      alert('Preencha paciente, data e horário 🙂');
      return;
    }

    adicionarConsulta({
      id: Date.now().toString(),
      paciente,
      data,
      hora,
      obs,
      status: 'agendado',
    });

    router.back();
  }

  function horarioEstaOcupado(h: string) {
  if (!data) return false;

  return consultas.some(
    (c) =>
      c.hora === h &&
      c.data.getDate() === data.getDate() &&
      c.data.getMonth() === data.getMonth() &&
      c.data.getFullYear() === data.getFullYear()
  );
}

  function formatarData(d: Date) {
    return d.toLocaleDateString('pt-BR');
  }

  function gerarHorariosDisponiveis() {
    const lista: string[] = [];

    for (let h = 8; h <= 18; h++) {
      if (h === 12) continue; // almoço

      const horaStr = String(h).padStart(2, '0');
      lista.push(`${horaStr}:00`);
      if (h !== 18) lista.push(`${horaStr}:30`);
    }

    return lista;
  }

  const horarios = gerarHorariosDisponiveis();

  const params = useLocalSearchParams()

  useEffect(() => {
  if (params.selecionarPaciente === "1") {
    setModalVisible(true)
  }
}, [])
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nova Consulta</Text>

      {/* PACIENTE */}
      <Text style={styles.label}>Paciente</Text>

      <TouchableOpacity
        style={styles.selectBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text>{paciente ? paciente : 'Selecionar paciente'}</Text>
      </TouchableOpacity>

      {/* MODAL PACIENTES */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Selecione o paciente</Text>

            {pacientes.length === 0 ? (
              <Text style={{ textAlign: 'center', marginTop: 10 }}>
                Nenhum paciente cadastrado 😬
              </Text>
            ) : (
              <FlatList
                data={pacientes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setPaciente(item.nome);
                      setModalVisible(false);
                    }}
                  >
                    <Text>{item.nome}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
                      style={styles.btnCadastrar}
                      onPress={() => {
  setModalVisible(false)
  router.push("/prontuario?cadastro=1")
}}
                    >
                      <Text style={{color: '#ffffff', fontWeight: 500}}>+ Cadastrar Paciente</Text>
                    </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ textAlign: 'center', marginTop: 10, color: '#777' }}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DATA */}
      <Text style={styles.label}>Data da consulta</Text>

      <TouchableOpacity
        style={styles.input}
        onPress={() => setMostrarCalendario(true)}
      >
        <Text>{data ? formatarData(data) : 'Selecionar data'}</Text>
      </TouchableOpacity>

      {mostrarCalendario && (
        <DateTimePicker
          value={data || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={(event, selectedDate) => {
            setMostrarCalendario(false);
            if (selectedDate) setData(selectedDate);
          }}
        />
      )}

      {/* HORÁRIO */}
      <Text style={styles.label}>Horário (08:00 - 18:00)</Text>

      <View style={styles.horariosGrid}>
        {horarios.map((h) => {
  const ocupado = horarioEstaOcupado(h);

  return (
    <TouchableOpacity
      key={h}
      disabled={ocupado}
      style={[
        styles.horaBtn,
        hora === h && styles.horaSelecionada,
        ocupado && styles.horaOcupada,
      ]}
      onPress={() => !ocupado && setHora(h)}
    >
      <Text
        style={{
          color: ocupado
            ? '#999'
            : hora === h
            ? '#fff'
            : '#333',
          fontWeight: 'bold',
        }}
      >
        {h}
      </Text>
    </TouchableOpacity>
  );
})}

      </View>

      {/* OBS */}
      <Text style={styles.label}>Observações</Text>

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Procedimento, retorno, etc..."
        placeholderTextColor="#94A3B8"
        multiline
        value={obs}
        onChangeText={setObs}
      />

      {/* BOTÕES */}
      <TouchableOpacity style={styles.button} onPress={agendar}>
        <Text style={styles.buttonText}>Agendar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.cancel}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#F2F5F7',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 40,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  horaBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  horaSelecionada: {
    backgroundColor: '#00BCD4',
    borderColor: '#00BCD4',
  },

  button: {
    backgroundColor: '#00BCD4',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  cancel: {
    textAlign: 'center',
    marginTop: 12,
    color: '#666',
  },

  selectBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },

  modalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },

  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  horaOcupada: {
  backgroundColor: '#E0E0E0',
  borderColor: '#E0E0E0',
},
btnCadastrar: {
    backgroundColor: '#007C91',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 3,
    marginTop: 10,
  },

});
