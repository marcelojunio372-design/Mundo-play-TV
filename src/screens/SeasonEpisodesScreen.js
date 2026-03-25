import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ResizeMode, Video } from "expo-av";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function SeasonEpisodesScreen({
  series,
  season,
  onBack,
}) {
  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);

  const episodes = useMemo(() => safeArray(season?.episodes), [season]);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const selectedEpisode =
    selectedIndex === null ? null : episodes[selectedIndex] || null;

  const sourceUri = selectedEpisode?.url || "";

  const openEpisode = (index, fullscreen = false) => {
    setSelectedIndex(index);
    setIsPlaying(true);
    setIsFullscreen(fullscreen);
  };

  const handleStatus = (status) => {
    if (!status || !status.isLoaded) return;

    if (status.didJustFinish && !status.isLooping) {
      const nextIndex = (selectedIndex ?? -1) + 1;
      if (nextIndex < episodes.length) {
        setSelectedIndex(nextIndex);
        setIsPlaying(true);
      }
    }

    setIsBuffering(!!status.isBuffering);
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
          <View style={styles.playerArea}>
            <Text style={styles.title}>{series?.name || "Série"}</Text>
            <Text style={styles.meta}>{season?.name || "Temporada"}</Text>

            <TouchableOpacity
              activeOpacity={0.95}
              style={styles.playerWrap}
              onPress={() => {
                if (selectedIndex !== null && sourceUri) {
                  setIsPlaying(true);
                  setIsFullscreen(true);
                }
              }}
            >
              {isPlaying && sourceUri ? (
                <>
                  <Video
                    ref={videoRef}
                    key={`episode_${selectedIndex}`}
                    style={styles.video}
                    source={{ uri: sourceUri }}
                    shouldPlay
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    onLoadStart={() => setIsBuffering(true)}
                    onReadyForDisplay={() => setIsBuffering(false)}
                    onPlaybackStatusUpdate={handleStatus}
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
                  <Text style={styles.emptyPlayerText}>Selecione um episódio</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.episodeDesc}>
              {selectedEpisode?.description ||
                selectedEpisode?.plot ||
                selectedEpisode?.desc ||
                "Toque no player para abrir em tela cheia."}
            </Text>
          </View>

          <View style={styles.listArea}>
            <FlatList
              data={episodes}
              keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
              renderItem={({ item, index }) => {
                const active = index === selectedIndex;

                return (
                  <TouchableOpacity
                    style={[styles.episodeRow, active && styles.episodeRowActive]}
                    onPress={() => openEpisode(index)}
                  >
                    <Text
                      style={[styles.episodeName, active && styles.episodeNameActive]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
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
              key={`episode_full_${selectedIndex}`}
              style={styles.fullscreenVideo}
              source={{ uri: sourceUri }}
              shouldPlay
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={handleStatus}
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
  },

  playerArea: {
    flex: 1,
    padding: 12,
  },

  listArea: {
    width: 170,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.08)",
    padding: 10,
  },

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
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

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPlayer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPlayerText: {
    color: "#fff",
  },

  episodeDesc: {
    color: "#d6dce5",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  episodeRow: {
    minHeight: 56,
    borderRadius: 10,
    backgroundColor: "#162033",
    marginBottom: 8,
    paddingHorizontal: 10,
    justifyContent: "center",
  },

  episodeRowActive: {
    backgroundColor: "#2a3550",
  },

  episodeName: {
    color: "#fff",
    fontSize: 12,
  },

  episodeNameActive: {
    color: "#ffe04f",
    fontWeight: "800",
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
