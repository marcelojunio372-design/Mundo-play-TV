import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";

const { width, height } = Dimensions.get("window");
const isPhone = width < 900;

function safeText(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

export default function SettingsScreen({
  session,
  onBack,
  onOpenHome,
}) {
  const username =
    safeText(session?.username, "") !== ""
      ? safeText(session?.username)
      : safeText(session?.data?.user_info?.username, "Marcelo123");

  const statusRaw =
    session?.data?.user_info?.status ||
    session?.data?.server_info?.status ||
    session?.status ||
    "Ativo";

  const status =
    String(statusRaw).toLowerCase() === "active" ? "Ativo" : safeText(statusRaw);

  const expiryDate =
    session?.data?.user_info?.exp_date_readable ||
    session?.data?.user_info?.expiration ||
    session?.data?.user_info?.expiry_date ||
    session?.expiryDate ||
    "03/04/2026";

  const currentLanguage =
    session?.languageLabel ||
    session?.language ||
    "Português";

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    if (typeof onOpenHome === "function") {
      onOpenHome();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>⚙ Configuração</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Idiomas</Text>

          <TouchableOpacity style={[styles.langRow, styles.langRowActive]}>
            <Text style={[styles.langText, styles.langTextActive]}>Português</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.langRow}>
            <Text style={styles.langText}>English</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.langRow}>
            <Text style={styles.langText}>Español</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Validade da Lista</Text>

          <Text style={styles.infoLine}>Usuário: {username}</Text>
          <Text style={styles.infoLine}>Status: {status}</Text>
          <Text style={styles.infoLine}>Validade: {expiryDate}</Text>
          <Text style={styles.infoLine}>Idioma atual: {currentLanguage}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3c3f8a",
  },

  topbar: {
    height: isPhone ? 52 : 66,
    backgroundColor: "rgba(21,26,76,0.55)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isPhone ? 10 : 16,
  },

  backButton: {
    height: isPhone ? 34 : 40,
    paddingHorizontal: isPhone ? 12 : 16,
    borderRadius: 10,
    backgroundColor: "rgba(8,15,34,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  backButtonText: {
    color: "#ffffff",
    fontSize: isPhone ? 11 : 14,
    fontWeight: "800",
  },

  title: {
    color: "#ffffff",
    fontSize: isPhone ? 16 : 22,
    fontWeight: "900",
  },

  scrollContent: {
    paddingHorizontal: isPhone ? 10 : 18,
    paddingTop: isPhone ? 10 : 16,
    paddingBottom: isPhone ? 16 : 24,
  },

  card: {
    width: "100%",
    backgroundColor: "#081a2f",
    borderRadius: isPhone ? 18 : 24,
    paddingHorizontal: isPhone ? 14 : 22,
    paddingVertical: isPhone ? 14 : 20,
    marginBottom: isPhone ? 12 : 16,
    minHeight: isPhone ? 170 : 220,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: isPhone ? 15 : 22,
    fontWeight: "900",
    marginBottom: isPhone ? 12 : 18,
  },

  langRow: {
    minHeight: isPhone ? 34 : 42,
    justifyContent: "center",
    paddingVertical: isPhone ? 4 : 6,
  },

  langRowActive: {
    backgroundColor: "transparent",
  },

  langText: {
    color: "#e8edf7",
    fontSize: isPhone ? 11 : 16,
    fontWeight: "500",
  },

  langTextActive: {
    color: "#38d7ff",
    fontWeight: "900",
  },

  infoLine: {
    color: "#e3e9f4",
    fontSize: isPhone ? 11 : 16,
    lineHeight: isPhone ? 20 : 28,
    marginBottom: isPhone ? 4 : 6,
  },
});
