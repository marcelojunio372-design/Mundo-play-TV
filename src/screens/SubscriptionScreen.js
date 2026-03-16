import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS } from "../utils/constants";

export default function SubscriptionScreen({ onBack, onLogout }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBtn}>VOLTAR</Text>
        </TouchableOpacity>

        <Text style={styles.brand}>ASSINATURA</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>SAIR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.centeredScreen}>
        <View style={styles.infoCard}>
          <Text style={styles.contentTitle}>Subscription Info</Text>
          <Text style={styles.infoLine}>Usuário: Marcelo123</Text>
          <Text style={styles.infoLine}>Estado da conta: Ativo</Text>
          <Text style={styles.infoLine}>Vencimento: 03/04/2026</Text>
          <Text style={styles.infoLine}>Teste: Não</Text>
          <Text style={styles.infoLine}>Conexões ativas: 0</Text>
          <Text style={styles.infoLine}>Conexões máximas: 1</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
  brand: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  logoutBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: { color: COLORS.primary, fontWeight: "800" },

  centeredScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },

  infoCard: {
    width: "100%",
    maxWidth: 700,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 20,
  },

  contentTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },

  infoLine: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 10,
  },
});
