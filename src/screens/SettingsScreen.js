import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, LAYOUT } from "../utils/constants";

export default function SettingsScreen({ onBack, onLogout }) {
  const now = useMemo(() => new Date(), []);
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>⚙ Configuração</Text>
        <Text style={styles.headerClock}>{time}   {date}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Idiomas</Text>
          <Text style={styles.cardText}>Português</Text>
          <Text style={styles.cardText}>English</Text>
          <Text style={styles.cardText}>Español</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Validade da Lista</Text>
          <Text style={styles.cardText}>Usuário: Marcelo123</Text>
          <Text style={styles.cardText}>Status: Ativo</Text>
          <Text style={styles.cardText}>Validade: 03/04/2026</Text>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bottomBtn} onPress={onBack}>
          <Text style={styles.bottomBtnText}>VOLTAR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={onLogout}>
          <Text style={styles.bottomBtnText}>SAIR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101737" },

  header: {
    height: LAYOUT.isTV ? 70 : 56,
    paddingHorizontal: LAYOUT.isTV ? 18 : 10,
    backgroundColor: "#2b2f66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBrand: {
    color: "#d9f6ff",
    fontSize: LAYOUT.isTV ? 18 : 12,
    fontWeight: "700",
  },

  headerClock: {
    color: "#e7fbff",
    fontSize: LAYOUT.isTV ? 16 : 11,
    fontWeight: "700",
  },

  body: {
    flex: 1,
    padding: LAYOUT.isTV ? 18 : 10,
    gap: 14,
  },

  card: {
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: LAYOUT.isTV ? 18 : 12,
    fontWeight: "900",
    marginBottom: 10,
  },

  cardText: {
    color: "#d4e4f7",
    fontSize: LAYOUT.isTV ? 15 : 11,
    marginBottom: 8,
  },

  bottomActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },

  bottomBtn: {
    flex: 1,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  bottomBtnText: {
    color: COLORS.primary,
    fontSize: LAYOUT.isTV ? 13 : 10,
    fontWeight: "900",
  },
});
