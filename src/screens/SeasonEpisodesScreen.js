import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function extractEpisodeNumber(name = "") {
  const text = safeText(name);
  const match = text.match(/S\d{1,2}E(\d{1,3})/i);
  if (match?.[1]) return Number(match[1]);

  const matchPt = text.match(/epis[oó]dio\s*(\d{1,3})/i);
  if (matchPt?.[1]) return Number(matchPt[1]);

  return 0;
}

export default function SeasonEpisodesScreen({
  series,
  season,
  onBack,
}) {
  const fullscreenVideoRef = useRef(null);

  const episodes = useMemo(() => {
    return safeArray(season?.episodes).slice().sort((a, b) => {
      const aEp = extractEpisodeNumber(a?.name || "");
      const bEp = extractEpisodeNumber(b?.name || "");
      if (aEp !== bEp) return aEp - bEp;
      return safeText(a?.name).localeCompare(safeText(b?.name));
    });
  }, [season]);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const selectedEpisode =
    selectedIndex === null ? null : episodes[selectedIndex] || null;

  const sourceUri = selectedEpisode?.url || "";

  const openEpisode = (index) => {
    setSelectedIndex(index);
    setIsBuffering(true);
    setIsFullscreen(true);
  };

  const handleStatus = (status) => {
    if (!status) return;

    if (status.isLoaded) {
      setIsBuffering(!!status.isBuffering);

      if (status.didJustFinish && !status.isLooping) {
        const nextIndex = (selectedIndex ?? -1) + 1;
        if (nextIndex < episodes.length) {
          setSelectedIndex(nextIndex);
        }
      }
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {series?.logo ? <Image source={{ uri: series.logo }} style={styles.backdrop} /> : null}
        <View style={styles.backdropOverlay} />

        <View style={styles.topbar}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.leftPanel}>
            <Text style={styles.seriesTitle}>{series?.name || "Série"}</Text>
            <Text style={styles.seasonTitle}>{season?.name || "Temporada"}</Text>

            <Text style={styles.counterText}>
              {episodes.length} episódio{episodes.length === 1 ? "" : "s"}
            </Text>

            <Text style={styles.helpText}>
              Toque em um episódio para abrir direto em tela cheia.
            </Text>

            {selectedEpisode ? (
              <View style={styles.selectedBox}>
                <Text style={styles.selectedLabel}>Selecionado</Text>
                <Text style={styles.selectedName} numberOfLines={3}>
                  {selectedEpisode?.name || "-"}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.rightPanel}>
            <FlatList
              data={episodes}
              keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
              renderItem={({ item, index }) => {
                const active = index === selectedIndex;
                const episodeNumber = extractEpisodeNumber(item?.name || "");

                return (
                  <TouchableOpacity
                    style={[styles.episodeRow, active && styles.episodeRowActive]}
                    onPress={() => openEpisode(index)}
                  >
                    <View style={styles.episodeThumbWrap}>
                      {item?.logo ? (
                        <Image source={{ uri: item.logo }} style={styles.episodeThumb} />
                      ) : (
                        <View style={styles.episodeThumbFallback} />
                      )}
                    </View>

                    <View style={styles.episodeInfo}>
                      <Text
                        style={[
                          styles.episodeName,
                          active && styles.episodeNameActive,
                        ]}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>

                      <Text style={styles.episodeMeta}>
                        {episodeNumber > 0 ? `Episódio ${episodeNumber}` : `Item ${index + 1}`}
                      </Text>

                      <Text style={styles.episodeDesc} numberOfLines={3}>
                        {item?.description ||
                          item?.plot ||
                          item?.desc ||
                          "Toque para reproduzir."}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={6}
              removeClippedSubviews
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
    backgroundColor: "#120b24",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
    opacity: 0.18,
  },

  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18,11,36,0.84)",
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

  leftPanel: {
    flex: 1,
    padding: 14,
  },

  rightPanel: {
    width: 420,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.08)",
    padding: 10,
  },

  seriesTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },

  seasonTitle: {
    color: "#d4c8f8",
    fontSize: 16,
    marginBottom: 14,
  },

  counterText: {
    color: "#ffe04f",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },

  helpText: {
    color: "#f0f0f0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },

  selectedBox: {
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
  },

  selectedLabel: {
    color: "#35c8ff",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
  },

  selectedName: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },

  episodeRow: {
    minHeight: 118,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
    padding: 10,
    flexDirection: "row",
  },

  episodeRowActive: {
    backgroundColor: "rgba(126,92,168,0.45)",
  },

  episodeThumbWrap: {
    width: 150,
    marginRight: 12,
  },

  episodeThumb: {
    width: 150,
    height: 84,
    borderRadius: 8,
    resizeMode: "cover",
  },

  episodeThumbFallback: {
    width: 150,
    height: 84,
    borderRadius: 8,
    backgroundColor: "#23304a",
  },

  episodeInfo: {
    flex: 1,
    justifyContent: "center",
  },

  episodeName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },

  episodeNameActive: {
    color: "#ffe04f",
  },

  episodeMeta: {
    color: "#d8cdfd",
    fontSize: 13,
    marginBottom: 6,
  },

  episodeDesc: {
    color: "#f3f3f3",
    fontSize: 13,
    lineHeight: 18,
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
