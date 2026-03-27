import React, { useEffect, useState } from "react";
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

export default function MovieDetailsScreen({ movie, onBack }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const sourceUri = movie?.url || "";
  const description = safeText(movie?.description || movie?.desc || movie?.plot);

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
        {movie?.logo ? <Image source={{ uri: movie.logo }} style={styles.backdrop} /> : null}
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

            <Text style={styles.meta}>Dirigido por: {movie?.director || "N/A"}</Text>
            <Text style={styles.meta}>Data de lançamento: {movie?.year || "N/A"}</Text>
            <Text style={styles.meta}>Duração: {movie?.duration || "N/A"}</Text>
            <Text style={styles.meta}>Gênero: {movie?.genre || movie?.group || "N/A"}</Text>
            <Text style={styles.meta}>Elenco: {movie?.cast || "N/A"}</Text>

            <Text style={styles.synopsisLabel}>Sinopse:</Text>
            <Text style={styles.synopsisText}>
              {description || "Descrição não disponível."}
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
    opacity: 0.14,
  },

  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,9,21,0.86)",
  },

  topbar: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  backText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  content: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },

  left: {
    width: 94,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  right: {
    flex: 1,
    paddingLeft: 8,
  },

  poster: {
    width: 72,
    height: 104,
    borderRadius: 8,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 72,
    height: 104,
    borderRadius: 8,
    backgroundColor: "#203148",
    alignItems: "center",
    justifyContent: "center",
  },

  posterFallbackText: {
    color: "#fff",
    fontSize: 8,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    flex: 1,
    marginRight: 8,
  },

  heart: {
    color: "#ddd",
    fontSize: 18,
    marginTop: -1,
  },

  heartActive: {
    color: "#ff6fa8",
  },

  meta: {
    color: "#d0d9e7",
    fontSize: 10,
    marginBottom: 5,
  },

  synopsisLabel: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 3,
    marginTop: 4,
  },

  synopsisText: {
    color: "#f1f1f1",
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 10,
  },

  playBtn: {
    width: 108,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#7e5ca8",
    alignItems: "center",
    justifyContent: "center",
  },

  playBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
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
