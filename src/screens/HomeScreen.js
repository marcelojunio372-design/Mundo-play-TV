import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import HeroCarousel from "../components/HeroCarousel";
import { COLORS, TV } from "../utils/constants";

const MENU_ITEMS = [
  { key: "live", label: "LIVE TV" },
  { key: "movies", label: "FILMES" },
  { key: "series", label: "SÉRIES" },
  { key: "subscription", label: "ASSINATURA" },
  { key: "languages", label: "IDIOMAS" },
  { key: "settings", label: "CONFIGURAÇÕES" },
];

export default function HomeScreen({
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSubscription,
  onOpenLanguages,
  onOpenSettings,
  onLogout,
}) {
  const [selected, setSelected] = useState("live");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const now = useMemo(() => new Date(), []);
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR");

  const handleOpen = (key) => {
    setSelected(key);

    if (key === "live") return onOpenLive?.();
    if (key === "movies") return onOpenMovies?.();
    if (key === "series") return onOpenSeries?.();
    if (key === "subscription") return onOpenSubscription?.();
    if (key === "languages") return onOpenLanguages?.();
    if (key === "settings") return onOpenSettings?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>MUNDO PLAY TV</Text>
          <Text style={styles.brandSub}>IPTV Profissional</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.headerInfo}>{time}   {date}</Text>
          <TouchableOpacity style={styles.topBtn} onPress={onLogout}>
            <Text style={styles.topBtnText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.leftMenu}>
          <Text style={styles.leftMenuTitle}>Menu</Text>

          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuButton,
                selected === item.key && styles.menuButtonActive,
              ]}
              onPress={() => handleOpen(item.key)}
            >
              <Text
                style={[
                  styles.menuButtonText,
                  selected === item.key && styles.menuButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.centerContent}>
          <HeroCarousel />

          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickCard} onPress={onOpenMovies}>
              <Text style={styles.quickTitle}>Filmes</Text>
              <Text style={styles.quickText}>Lançamentos e catálogo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={onOpenSeries}>
              <Text style={styles.quickTitle}>Séries</Text>
              <Text style={styles.quickText}>Temporadas e episódios</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.centerInfo}>
            <Text style={styles.centerInfoTitle}>Modo TV Box / Smart TV</Text>
            <Text style={styles.centerInfoText}>
              Interface horizontal fixa com menu lateral, carrossel e painel direito.
            </Text>
          </View>
        </View>

        <View style={[styles.rightPanel, !rightPanelOpen && styles.rightPanelClosed]}>
          <TouchableOpacity
            style={styles.rightToggle}
            onPress={() => setRightPanelOpen(!rightPanelOpen)}
          >
            <Text style={styles.rightToggleText}>
              {rightPanelOpen ? "FECHAR" : "ABRIR"}
            </Text>
          </TouchableOpacity>

          {rightPanelOpen && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.rightTitle}>Painel</Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Usuário</Text>
                <Text style={styles.infoValue}>Marcelo123</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>Ativo</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Validade</Text>
                <Text style={styles.infoValue}>03/04/2026</Text>
              </View>

              <TouchableOpacity style={styles.sideAction} onPress={onOpenLive}>
                <Text style={styles.sideActionText}>LIVE TV</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sideAction} onPress={onOpenMovies}>
                <Text style={styles.sideActionText}>FILMES</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sideAction} onPress={onOpenSeries}>
                <Text style={styles.sideActionText}>SÉRIES</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    height: TV.headerHeight,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },

  brandSub: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  headerRight: {
    alignItems: "flex-end",
  },

  headerInfo: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },

  topBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.primarySoft,
  },

  topBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  body: {
    flex: 1,
    flexDirection: "row",
  },

  leftMenu: {
    width: TV.sideWidth,
    backgroundColor: "#071726",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: 12,
  },

  leftMenuTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12,
  },

  menuButton: {
    minHeight: 48,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  menuButtonActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },

  menuButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  menuButtonTextActive: {
    color: COLORS.primary,
  },

  centerContent: {
    flex: 1,
    padding: 12,
  },

  quickRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  quickCard: {
    flex: 1,
    minHeight: 86,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    justifyContent: "center",
  },

  quickTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },

  quickText: {
    color: COLORS.text,
    fontSize: 12,
  },

  centerInfo: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
  },

  centerInfoTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },

  centerInfoText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  rightPanel: {
    width: TV.rightWidth,
    backgroundColor: "#08131f",
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    padding: 12,
  },

  rightPanelClosed: {
    width: 82,
  },

  rightToggle: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: COLORS.primarySoft,
  },

  rightToggleText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  rightTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },

  infoBox: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  infoLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: 4,
  },

  infoValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  sideAction: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },

  sideActionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
});
