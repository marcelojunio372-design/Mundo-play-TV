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

  const featuredMovie = movies[0] || null;
  const featuredSeries = series[0] || null;
  const featured = featuredMovie || featuredSeries || null;

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

          <TouchableOpacity style={styles.sideButton} onPress={onReload}>
            <Text style={styles.sideButtonText}>
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
            <Text style={styles.featureLabel}>
              {featuredMovie ? "FILME" : featuredSeries ? "SÉRIE" : "DESTAQUE"}
            </Text>

            <Text style={styles.featureTitle}>
              {featured?.name || "MUNDO PLAY TV"}
            </Text>

            <Text style={styles.featureDesc}>
              {featured?.group || "Abra Filmes, Séries ou TV ao Vivo para navegar no conteúdo."}
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
    height: 72,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  appTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },

  statusText: {
    color: "#35c8ff",
    fontSize: 16,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
  },

  sidebar: {
    width: 180,
    gap: 18,
    paddingRight: 14,
  },

  sideButton: {
    height: 102,
    borderRadius: 20,
    backgroundColor: "#08203a",
    alignItems: "center",
    justifyContent: "center",
  },

  sideButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  mainCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#020812",
    borderRadius: 20,
    padding: 22,
  },

  posterBox: {
    width: 260,
    alignItems: "center",
    justifyContent: "center",
  },

  poster: {
    width: 200,
    height: 280,
    borderRadius: 20,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 200,
    height: 280,
    borderRadius: 20,
    backgroundColor: "#132a45",
    alignItems: "center",
    justifyContent: "center",
  },

  posterFallbackText: {
    color: "#35c8ff",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },

  infoBox: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 20,
  },

  featureLabel: {
    color: "#35c8ff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 18,
  },

  featureTitle: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 20,
  },

  featureDesc: {
    color: "#d8d8d8",
    fontSize: 18,
    marginBottom: 28,
  },

  actionButton: {
    height: 78,
    width: 430,
    maxWidth: "100%",
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#35c8ff",
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonText: {
    color: "#35c8ff",
    fontSize: 22,
    fontWeight: "900",
  },
});
