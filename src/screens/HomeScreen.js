import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { COLORS, IS_TV_LAYOUT } from "../utils/constants";

function Header({ onLogout }) {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("pt-BR");

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>MUNDO PLAY TV</Text>
        <Text style={styles.brandSub}>IPTV Profissional</Text>
      </View>

      <View style={styles.headerRight}>
        <Text style={styles.headerInfo}>{time}   {date}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>SAIR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen({
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSubscription,
  onOpenLanguages,
  onOpenSettings,
  onLogout,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <Header onLogout={onLogout} />

      <ScrollView contentContainerStyle={styles.homeContent}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Bem-vindo ao Mundo Play TV</Text>
          <Text style={styles.heroText}>
            Layout profissional para TV Box, Smart TV e celular.
          </Text>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.bigCard} onPress={onOpenLive}>
            <Text style={styles.bigCardTitle}>LIVE TV</Text>
            <Text style={styles.bigCardText}>Abrir categorias e canais ao vivo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bigCard} onPress={onOpenMovies}>
            <Text style={styles.bigCardTitle}>FILMES</Text>
            <Text style={styles.bigCardText}>Catálogos e lançamentos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bigCard} onPress={onOpenSeries}>
            <Text style={styles.bigCardTitle}>SÉRIES</Text>
            <Text style={styles.bigCardText}>Temporadas e episódios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bigCard} onPress={onOpenSubscription}>
            <Text style={styles.bigCardTitle}>ASSINATURA</Text>
            <Text style={styles.bigCardText}>Validade e conexões</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bigCard} onPress={onOpenLanguages}>
            <Text style={styles.bigCardTitle}>IDIOMAS</Text>
            <Text style={styles.bigCardText}>Português, English, Español</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bigCard} onPress={onOpenSettings}>
            <Text style={styles.bigCardTitle}>CONFIGURAÇÕES</Text>
            <Text style={styles.bigCardText}>Ajustes do player e app</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  brand: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  brandSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  headerRight: { alignItems: "flex-end", gap: 8 },
  headerInfo: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: { color: COLORS.primary, fontWeight: "800" },
  homeContent: { padding: 18 },
  hero: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
  },
  heroTitle: { color: COLORS.text, fontSize: 28, fontWeight: "900" },
  heroText: { color: COLORS.muted, fontSize: 15, marginTop: 8 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  bigCard: {
    width: IS_TV_LAYOUT ? "32%" : "100%",
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
  },
  bigCardTitle: { color: COLORS.primary, fontSize: 20, fontWeight: "900" },
  bigCardText: { color: COLORS.text, marginTop: 8, fontSize: 14 },
});
