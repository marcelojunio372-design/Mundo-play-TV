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
  const fullscreenVideoRef = useRef(null);

  const episodes = useMemo(() => safeArray(season?.episodes), [season]);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const selectedEpisode =
    selectedIndex === null ? null : episodes[selectedIndex] || null;

  const sourceUri = selectedEpisode?.url || "";

  const openEpisode = (index) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
  };

  const handleStatus = (status) => {
    if (!status || !status.isLoaded) return;

    if (status.didJustFinish && !status.isLooping) {
      const nextIndex = (selectedIndex ?? -1) + 1;
      if (nextIndex < episodes.length) {
        setSelectedIndex(nextIndex);
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
          <View style={styles.infoArea}>
            <Text style={styles.title}>{series?.name || "Série"}</Text>
            <Text style={styles.meta}>{season?.name || "Temporada"}</Text>
            <Text style={styles.countText}>
              {episodes.length} episódios
            </Text>

            <Text style={styles.helpText}>
              Toque em um episódio para abrir direto em tela cheia.
            </Text>

            {selectedEpisode ? (
              <Text style={styles.selectedText}>
                Último selecionado: {selectedEpisode?.name || "-"}
              </Text>
            ) : null}
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
            <>
              <Video
                ref={fullscreenVideoRef}
                key={`episode_full_${selectedIndex}`}
                style={styles.fullscreenVideo}
                source={{ uri: sourceUri }}
                shouldPlay
                useNativeControls
                resizeMode={ResizeMode.COVER}
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

  infoArea: {
    flex: 1,
    padding: 12,
  },

  listArea: {
    width: 190,
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

  countText: {
    color: "#ffe04f",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },

  helpText: {
    color: "#d6dce5",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },

  selectedText: {
    color: "#9eb4c9",
    fontSize: 12,
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
