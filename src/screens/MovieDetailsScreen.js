import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from "expo-av";

const FAVORITES_KEY = "mundoplaytv_movie_favorites";
const RECENTS_KEY = "mundoplaytv_movie_recents";

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getMovieStorageId(item = {}) {
  return safeText(item.id || item.url || item.name);
}

function buildBackdrop(movie) {
  return movie?.logo ? { uri: movie.logo } : null;
}

export default function MovieDetailsScreen({ movie, onBack }) {
  const fullscreenVideoRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const sourceUri = movie?.url || "";
  const backdrop = buildBackdrop(movie);

  useEffect(() => {
    async function loadFavorite() {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        setIsFavorite(ids.includes(getMovieStorageId(movie)));
      } catch (e) {}
    }

    loadFavorite();
  }, [movie]);

  useEffect(() => {
    async function addRecent() {
      try {
        const raw = await AsyncStorage.getItem(RECENTS_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        const id = getMovieStorageId(movie);
        const updated = [id, ...ids.filter((item) => item !== id)].slice(0, 50);
        await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
      } catch (e) {}
    }

    if (movie) addRecent();
  }, [movie]);

  const toggleFavorite = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const id = getMovieStorageId(movie);

      let updated = [];
      if (ids.includes(id)) {
        updated = ids.filter((item) => item !== id);
        setIsFavorite(false);
      } else {
        updated = [id, ...ids];
        setIsFavorite(true);
      }

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {backdrop ? <Image source={backdrop} style={styles.backdrop} /> : null}
        <View style={styles.backdropOverlay} />

        <View style={styles.topbar}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.left}>
            {movie?.logo ? (
              <Image source={{ uri: movie.logo }} style={styles.poster} />
            ) : (
              <View style={styles.posterFallback}>
                <Text style={styles.posterFallbackText}>SEM CAPA</Text>
              </View>
            )}
          </View>

          <View style={styles.right}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{movie?.name || "Filme"}</Text>

              <TouchableOpacity onPress={toggleFavorite}>
                <Text style={[styles.heart, isFavorite && styles.heartActive]}>♥</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoGrid}>
              <Text style={styles.label}>Dirigido por:</Text>
              <Text style={styles.value}>{movie?.director || "N/A"}</Text>

              <Text style={styles.label}>Data de lançamento:</Text>
              <Text style={styles.value}>{movie?.year || "N/A"}</Text>

              <Text style={styles.label}>Duração:</Text>
              <Text style={styles.value}>{movie?.duration || "N/A"}</Text>

              <Text style={styles.label}>Gênero:</Text>
              <Text style={styles.value}>{movie?.group || "Filmes"}</Text>

              <Text style={styles.label}>Elenco:</Text>
              <Text style={styles.value}>{movie?.cast || "N/A"}</Text>
            </View>

            <Text style={styles.synopsisLabel}>Sinopse:</Text>
            <Text style={styles.synopsisText}>
              {movie?.description ||
                movie?.plot ||
                movie?.desc ||
                "Descrição não disponível."}
            </Text>

            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => {
                if (sourceUri) setIsFullscreen(true);
              }}
            >
              <Text style={styles.playBtnText}>PLAY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={isFullscreen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenWrap}>
          {sourceUri ? (
            <>
              <Video
                ref={fullscreenVideoRef}
                style={styles.fullscreenVideo}
                source={{ uri: sourceUri }}
                shouldPlay
                useNativeControls
                resizeMode={ResizeMode.COVER}
                onLoadStart={() => setIsBuffering(true)}
                onReadyForDisplay={() => setIsBuffering(false)}
                onError={() => setIsBuffering(false)}
              />

              {isBuffering && (
                <View style={styles.overlay} pointerEvents="none">
                  <ActivityIndicator size="large" color="#35c8ff" />
                </View>
              )}
            </>
          ) : null}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setIsFullscreen(false)}
          >
            <Text style={styles.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050915",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
    opacity: 0.22,
  },

  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,9,21,0.78)",
  },

  topbar: {
    height: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  backText: {
    color: "#fff",
    fontWeight: "800",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    padding: 14,
  },

  left: {
    width: 160,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  right: {
    flex: 1,
    paddingLeft: 12,
  },

  poster: {
    width: 120,
    height: 180,
    borderRadius: 10,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 120,
    height: 180,
    borderRadius: 10,
    backgroundColor: "#203148",
    alignItems: "center",
    justifyContent: "center",
  },

  posterFallbackText: {
    color: "#fff",
    fontSize: 10,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    flex: 1,
    marginRight: 12,
  },

  heart: {
    color: "#ddd",
    fontSize: 26,
    marginTop: -2,
  },

  heartActive: {
    color: "#ff6fa8",
  },

  infoGrid: {
    marginBottom: 14,
  },

  label: {
    color: "#e7e7e7",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },

  value: {
    color: "#d0d9e7",
    fontSize: 14,
    marginBottom: 10,
  },

  synopsisLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },

  synopsisText: {
    color: "#f1f1f1",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },

  playBtn: {
    width: 180,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#7e5ca8",
    alignItems: "center",
    justifyContent: "center",
  },

  playBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  fullscreenWrap: {
    flex: 1,
    backgroundColor: "#000",
  },

  fullscreenVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  closeBtn: {
    position: "absolute",
    top: 30,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  closeBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
});
