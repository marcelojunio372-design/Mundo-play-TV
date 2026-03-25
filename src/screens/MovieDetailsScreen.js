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

export default function MovieDetailsScreen({ movie, onBack }) {
  const fullscreenVideoRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const sourceUri = movie?.url || "";

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
                <Text style={[styles.star, isFavorite && styles.starActive]}>★</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.metaLine}>
              {(movie?.year || "-") + " • " + (movie?.group || "Filmes")}
            </Text>

            <Text style={styles.description}>
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
    padding: 12,
  },

  left: {
    width: 140,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  right: {
    flex: 1,
    paddingLeft: 12,
  },

  poster: {
    width: 110,
    height: 160,
    borderRadius: 10,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 110,
    height: 160,
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
    marginRight: 10,
  },

  star: {
    color: "#666",
    fontSize: 18,
  },

  starActive: {
    color: "#ffe04f",
  },

  metaLine: {
    color: "#b7c6d6",
    marginBottom: 10,
  },

  description: {
    color: "#d6dce5",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },

  playBtn: {
    width: 140,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#7e5ca8",
    alignItems: "center",
    justifyContent: "center",
  },

  playBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
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
