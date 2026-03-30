import * as Notifications from "expo-notifications"

export async function agendarNotificacaoConsulta(
  paciente: string,
  data: Date,
  hora: string,
  obs: string
) {

  const [h, m] = hora.split(":").map(Number)

  const dataConsulta = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    h,
    m,
    0,
    0
  )

  // 30 minutos antes
  const triggerDate = new Date(dataConsulta.getTime() - 30 * 60 * 1000)

  if (triggerDate <= new Date()) return

  // ID único da notificação
  const idUnico = `${paciente}-${hora}-${dataConsulta.getTime()}`

  // remove duplicadas se existir
  const notificacoes = await Notifications.getAllScheduledNotificationsAsync()

  for (const n of notificacoes) {
    if (n.identifier === idUnico) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier)
    }
  }

  await Notifications.scheduleNotificationAsync({
    identifier: idUnico,
    content: {
      title: "Consulta em 30 minutos",
      body: `Consulta hoje às ${hora}\nPaciente: ${paciente}\nProcedimento: ${obs}`,
      data: { screen: "agenda" }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate
    }
  })
}

export async function cancelarNotificacaoConsulta(
  paciente: string,
  data: Date,
  hora: string
) {
  const [h, m] = hora.split(":").map(Number)

  const dataConsulta = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    h,
    m,
    0,
    0
  )

  const idUnico = `${paciente}-${hora}-${dataConsulta.getTime()}`

  await Notifications.cancelScheduledNotificationAsync(idUnico)
}


