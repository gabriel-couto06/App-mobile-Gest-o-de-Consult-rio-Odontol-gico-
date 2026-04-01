import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import "react-native-get-random-values";
import { AgendaProvider } from "../context/agendaContext";
import { PacienteProvider } from "../context/pacienteContext";
import { AuthProvider } from "../context/authContext";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    Notifications.requestPermissionsAsync();

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data?.screen === "agenda") {
          router.replace("/(tabs)/agenda");
        }
      },
    );

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    async function checkInitialNotification() {
      const response = await Notifications.getLastNotificationResponseAsync();

      if (response) {
        const data = response.notification.request.content.data;

        if (data?.screen === "agenda") {
          router.replace("/(tabs)/agenda");
        }
      }
    }

    checkInitialNotification();
  }, [router]);

  return (
    <AuthProvider>
      <PacienteProvider>
        <AgendaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AgendaProvider>
      </PacienteProvider>
    </AuthProvider>
  );
}
