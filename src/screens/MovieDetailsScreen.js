import React, { useRef, useState } from "react";
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
import { ResizeMode, Video } from "expo-av";

export default function MovieDetailsScreen({ movie, onBack }) {
  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const sourceUri = movie?.url || "";

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
            <Text style={styles.title}>{movie?.name || "Filme"}</Text>
            <Text style={styles.meta}>{movie?.group || "Filmes"}</Text>

            <View style={styles.playerWrap}>
              {isPlaying && sourceUri ? (
                <>
                  <Video
                    ref={videoRef}
                    style={styles.video}
                    source={{ uri: sourceUri }}
                    shouldPlay
                    resizeMode={ResizeMode.CONTAIN}
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
              ) : (
                <View style={styles.emptyPlayer}>
                  <Text style={styles.emptyPlayerText}>Toque em reproduzir</Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => setIsPlaying(true)}
              >
                <Text style={styles.btnText}>reproduzir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  if (sourceUri) {
                    setIsPlaying(true);
                    setIsFullscreen(true);
                  }
                }}
              >
                <Text style={styles.btnText}>tela cheia</Text>
              </TouchableOpacity>
            </View>
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
            <Video
              ref={fullscreenVideoRef}
              style={styles.fullscreenVideo}
              source={{ uri: sourceUri }}
              shouldPlay
              resizeMode={ResizeMode.CONTAIN}
            />
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
    justifyContent: "center",
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

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },

  meta: {
    color: "#b7c6d6",
    marginBottom: 12,
  },

  playerWrap: {
    flex: 1,
    minHeight: 220,
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
  },

  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  emptyPlayer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPlayerText: {
    color: "#fff",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  actions: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },

  btn: {
    width: 120,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#7e5ca8",
    alignItems: "center",
    justifyContent: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "800",
    textTransform: "lowercase",
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
