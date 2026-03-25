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

function getFeaturedItem(movies = [], series = []) {
  if (movies.length > 0) return movies[0];
  if (series.length > 0) return series[0];
  return null;
}

export default function HomeScreen({
  session,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onReload,
}) {
  const movies = useMemo(() => safeArray(session?.data?.movies), [session]);
  const series = useMemo(() => safeArray(session?.data?.series), [session]);
  const featured = useMemo(() => getFeaturedItem(movies, series), [movies, series]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.appTitle}>MUNDO PLAY TV</Text>
        <Text style={styles.statusText}>Pronto</Text>
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
            <Text style={styles.sideButtonSmallText}>ATUALIZAR</Text>
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
                "Abra Filmes ou Séries para ver o destaque do catálogo."}
            </Text>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>
                {featured ? "CATÁLOGO PRONTO" : "SEM DESTAQUE"}
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
    height: 34,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  appTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },

  statusText: {
    color: "#35c8ff",
    fontSize: 9,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    padding: 5,
  },

  sidebar: {
    width: 84,
    gap: 5,
    paddingRight: 5,
  },

  sideButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#08203a",
    alignItems: "center",
    justifyContent: "center",
  },

  sideButtonText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },

  sideButtonSmall: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#08203a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  sideButtonSmallText: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "800",
    textAlign: "center",
  },

  mainCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#020812",
    borderRadius: 10,
    padding: 8,
  },

  posterBox: {
    width: 78,
    alignItems: "center",
    justifyContent: "center",
  },

  poster: {
    width: 62,
    height: 98,
    borderRadius: 8,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 62,
    height: 98,
    borderRadius: 8,
    backgroundColor: "#132a45",
    alignItems: "center",
    justifyContent: "center",
  },

  posterFallbackText: {
    color: "#35c8ff",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },

  infoBox: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 8,
  },

  featureLabel: {
    color: "#35c8ff",
    fontSize: 9,
    fontWeight: "900",
    marginBottom: 5,
  },

  featureTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6,
  },

  featureDesc: {
    color: "#d8d8d8",
    fontSize: 9,
    marginBottom: 8,
  },

  actionButton: {
    height: 30,
    width: 160,
    maxWidth: "100%",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#35c8ff",
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonText: {
    color: "#35c8ff",
    fontSize: 9,
    fontWeight: "900",
  },
});
