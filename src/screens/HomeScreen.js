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
                {featured ? "CONTEÚDO PRONTO" : "SEM CONTEÚDO"}
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
    height: 40,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  appTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },

  statusText: {
    color: "#35c8ff",
    fontSize: 10,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    padding: 6,
  },

  sidebar: {
    width: 96,
    gap: 6,
    paddingRight: 6,
  },

  sideButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#08203a",
    alignItems: "center",
    justifyContent: "center",
  },

  sideButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  sideButtonSmall: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#08203a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  sideButtonSmallText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },

  mainCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#020812",
    borderRadius: 12,
    padding: 10,
  },

  posterBox: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },

  poster: {
    width: 72,
    height: 112,
    borderRadius: 10,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 72,
    height: 112,
    borderRadius: 10,
    backgroundColor: "#132a45",
    alignItems: "center",
    justifyContent: "center",
  },

  posterFallbackText: {
    color: "#35c8ff",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },

  infoBox: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 10,
  },

  featureLabel: {
    color: "#35c8ff",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 6,
  },

  featureTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },

  featureDesc: {
    color: "#d8d8d8",
    fontSize: 10,
    marginBottom: 10,
  },

  actionButton: {
    height: 36,
    width: 190,
    maxWidth: "100%",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#35c8ff",
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonText: {
    color: "#35c8ff",
    fontSize: 10,
    fontWeight: "900",
  },
});
