import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

export default function SettingsScreen({ session, onBack, onLogout }) {
  const [language, setLanguage] = useState("Português");

  function changeLanguage(lang) {
    setLanguage(lang);
    Alert.alert("Idioma alterado", `Idioma atual: ${lang}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙ Configuração</Text>
        <Text style={styles.headerClock}>
          {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}{" "}
          {new Date().toLocaleDateString("pt-BR")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Idiomas</Text>

        <TouchableOpacity style={styles.langBtn} onPress={() => changeLanguage("Português")}>
          <Text style={[styles.langText, language === "Português" && styles.langTextActive]}>
            Português
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.langBtn} onPress={() => changeLanguage("English")}>
          <Text style={[styles.langText, language === "English" && styles.langTextActive]}>
            English
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.langBtn} onPress={() => changeLanguage("Español")}>
          <Text style={[styles.langText, language === "Español" && styles.langTextActive]}>
            Español
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Validade da Lista</Text>
        <Text style={styles.info}>Usuário: Marcelo123</Text>
        <Text style={styles.info}>Status: Ativo</Text>
        <Text style={styles.info}>Validade: 03/04/2026</Text>
        <Text style={styles.info}>Idioma atual: {language}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={onBack}>
          <Text style={styles.footerText}>VOLTAR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerBtn} onPress={onLogout}>
          <Text style={styles.footerText}>SAIR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1f2160" },
  header: {
    height: 46,
    backgroundColor: "#3a3d7a",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  headerClock: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  card: {
    margin: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 10,
  },
  langBtn: {
    paddingVertical: 8,
  },
  langText: {
    color: "#cfd8e3",
    fontSize: 9,
  },
  langTextActive: {
    color: "#38d7ff",
    fontWeight: "900",
  },
  info: {
    color: "#d5dde8",
    fontSize: 9,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    marginTop: "auto",
    marginBottom: 10,
  },
  footerBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    color: "#38d7ff",
    fontSize: 9,
    fontWeight: "900",
  },
});
