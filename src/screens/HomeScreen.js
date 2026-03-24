import React, { useMemo } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function HomeScreen({
  session,
  isRefreshingData,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onReload,
}) {
  const movies = useMemo(() => safeArray(session?.data?.movies), [session]);
  const series = useMemo(() => safeArray(session?.data?.series), [session]);
  const live = useMemo(() => safeArray(session?.data?.live), [session]);

  const featured = movies[0] || series[0] || live[0] || null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.appTitle}>MUNDO PLAY TV</Text>
        <Text style={styles.statusText}>
          {isRefreshingData ? "Recarregando..." : "Conteúdo pronto"}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.sideButton} onPress={onOpenLive}>
            <Text style={styles.sideButtonText}>LIVE TV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={onOpenMovies}>
            <Text style={styles.sideButtonText}>FILMES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={onOpenSeries}>
            <Text style={styles.sideButtonText}>SÉRIES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={onOpenSettings}>
            <Text style={styles.sideButtonText}>CONFIG.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButtonSmall} onPress={onReload}>
            <Text style={styles.sideButtonSmallText}>
              {isRefreshingData ? "ATUALIZANDO..." : "RECARREGAR"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.posterBox}>
            {featured?.logo ? (
              <Image source={{ uri: featured.logo }} style={styles.poster} />
            ) : (
              <View style={styles.posterFallback}>
                <Text style={styles.posterFallbackText}>MUNDO{"\n"}PLAY TV</Text>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.featureLabel}>DESTAQUE</Text>

            <Text style={styles.featureTitle}>
              {featured?.name || "MUNDO PLAY TV"}
            </Text>

            <Text style={styles.featureDesc}>
              {featured?.group ||
                "Abra Filmes, Séries ou TV ao Vivo para navegar no conteúdo."}
            </Text>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>
                {featured ? "CONTEÚDO CARREGADO" : "AGUARDANDO CONTEÚDO"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#04111f",
  },

  topbar: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  appTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  statusText: {
    color: "#35c8ff",
    fontSize: 13,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    padding: 10,
  },

  sidebar: {
    width: 140,
    gap: 12,
    paddingRight: 10,
  },

  sideButton: {
    height: 86,
    borderRadius: 18,
    backgroundColor: "#08203a",
    alignItems: "center",
    justifyContent: "center",
  },

  sideButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  sideButtonSmall: {
    height: 72,
    borderRadius: 18,
    backgroundColor: "#08203a",
    alignItems: "center",
    justifyContent: "center",
  },

  sideButtonSmallText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  mainCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#020812",
    borderRadius: 18,
    padding: 16,
  },

  posterBox: {
    width: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  poster: {
    width: 140,
    height: 210,
    borderRadius: 16,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 140,
    height: 210,
    borderRadius: 16,
    backgroundColor: "#132a45",
    alignItems: "center",
    justifyContent: "center",
  },

  posterFallbackText: {
    color: "#35c8ff",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  infoBox: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 16,
  },

  featureLabel: {
    color: "#35c8ff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },

  featureTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 16,
  },

  featureDesc: {
    color: "#d8d8d8",
    fontSize: 16,
    marginBottom: 22,
  },

  actionButton: {
    height: 64,
    width: 320,
    maxWidth: "100%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#35c8ff",
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonText: {
    color: "#35c8ff",
    fontSize: 18,
    fontWeight: "900",
  },
});
