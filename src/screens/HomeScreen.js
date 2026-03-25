import React, { useMemo, useState } from "react";
import {
  FlatList,
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

function pickFeaturedItems(session) {
  const movies = safeArray(session?.data?.movies);
  const series = safeArray(session?.data?.series);

  const movieLaunches = movies.slice(0, 8).map((item) => ({
    ...item,
    homeType: "movie",
  }));

  const seriesLaunches = series.slice(0, 8).map((item) => ({
    ...item,
    homeType: "series",
  }));

  return [...movieLaunches, ...seriesLaunches].slice(0, 12);
}

export default function HomeScreen({
  session,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onReload,
}) {
  const items = useMemo(() => pickFeaturedItems(session), [session]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const featured = items[selectedIndex] || items[0] || null;

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
          {featured?.logo ? (
            <Image
              source={{ uri: featured.logo }}
              style={styles.backgroundImage}
            />
          ) : null}

          <View style={styles.overlay} />

          <View style={styles.featuredRow}>
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
              <Text style={styles.featureLabel}>LANÇAMENTOS</Text>

              <Text style={styles.featureTitle}>
                {featured?.name || "MUNDO PLAY TV"}
              </Text>

              <Text style={styles.featureDesc}>
                {featured?.group ||
                  "Abra Filmes ou Séries para navegar no conteúdo."}
              </Text>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  featured?.homeType === "series" ? onOpenSeries() : onOpenMovies()
                }
              >
                <Text style={styles.actionButtonText}>ABRIR CATÁLOGO</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={items}
            horizontal
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            renderItem={({ item, index }) => {
              const active = index === selectedIndex;

              return (
                <TouchableOpacity
                  style={[styles.carouselItem, active && styles.carouselItemActive]}
                  onPress={() => setSelectedIndex(index)}
                >
                  {item?.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.carouselPoster} />
                  ) : (
                    <View style={styles.carouselPosterFallback} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
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
    paddingHorizontal: 8,
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
    padding: 6,
  },

  sidebar: {
    width: 90,
    gap: 6,
    paddingRight: 6,
  },

  sideButton: {
    height: 50,
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
    height: 42,
    borderRadius: 10,
    backgroundColor: "#08203a",
    alignItems: "center",
    justifyContent: "center",
  },

  sideButtonSmallText: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "800",
  },

  mainCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#020812",
    position: "relative",
    padding: 10,
  },

  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
    opacity: 0.24,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,8,18,0.72)",
  },

  featuredRow: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
    marginBottom: 10,
  },

  posterBox: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },

  poster: {
    width: 72,
    height: 110,
    borderRadius: 10,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 72,
    height: 110,
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
    paddingLeft: 10,
  },

  featureLabel: {
    color: "#35c8ff",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 5,
  },

  featureTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },

  featureDesc: {
    color: "#d8d8d8",
    fontSize: 10,
    marginBottom: 10,
  },

  actionButton: {
    height: 34,
    width: 170,
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

  carouselContent: {
    paddingTop: 6,
    paddingBottom: 4,
    zIndex: 2,
  },

  carouselItem: {
    width: 78,
    height: 110,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },

  carouselItemActive: {
    borderColor: "#35c8ff",
  },

  carouselPoster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  carouselPosterFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1c2f45",
  },
});
