import React, { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

export default function SeasonEpisodesScreen({ series, season, onBack }) {
  const episodes = useMemo(() => {
    return Array.isArray(season?.episodes) ? season.episodes : [];
  }, [season]);

  const videoRef = useRef(null);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(-1);
  const [loadingText, setLoadingText] = useState("");
  const [playerError, setPlayerError] = useState("");

  const selectedEpisode =
    selectedEpisodeIndex >= 0 ? episodes[selectedEpisodeIndex] || null : null;

  const openEpisode = (item, index) => {
    if (!item?.url) return;
    setPlayerError("");
    setLoadingText("Carregando episódio...");
    setSelectedEpisodeIndex(index);
  };

  const closePlayer = async () => {
    try {
      await videoRef.current?.stopAsync?.();
    } catch (e) {}

    setSelectedEpisodeIndex(-1);
    setLoadingText("");
    setPlayerError("");
  };

  const playNextEpisode = async () => {
    const nextIndex = selectedEpisodeIndex + 1;

    if (nextIndex >= episodes.length) {
      return;
    }

    try {
      await videoRef.current?.stopAsync?.();
    } catch (e) {}

    setPlayerError("");
    setLoadingText("Abrindo próximo episódio...");
    setSelectedEpisodeIndex(nextIndex);
  };

  const playPreviousEpisode = async () => {
    const prevIndex = selectedEpisodeIndex - 1;

    if (prevIndex < 0) {
      return;
    }

    try {
      await videoRef.current?.stopAsync?.();
    } catch (e) {}

    setPlayerError("");
    setLoadingText("Abrindo episódio anterior...");
    setSelectedEpisodeIndex(prevIndex);
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (!status) return;

    if (status.isLoaded === false) {
      return;
    }

    if (status.didJustFinish) {
      playNextEpisode();
      return;
    }

    if (status.isBuffering) {
      setLoadingText("Carregando episódio...");
    } else {
      setLoadingText("");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.leftPanel}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap}>
          <Text style={styles.backText}>↩</Text>
        </TouchableOpacity>

        <Text style={styles.seasonTitle}>
          {season?.name || "Temporada 1"}
        </Text>

        <Text style={styles.seasonCount}>
          Episódios: {episodes.length}
        </Text>
      </View>

      <View style={styles.rightPanel}>
        <Text style={styles.mainTitle}>{series?.name || "Série"}</Text>

        <FlatList
          data={episodes}
          keyExtractor={(item, index) => item.id || `ep_${index}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.epRow}
              onPress={() => openEpisode(item, index)}
            >
              <Image
                source={item.logo ? { uri: item.logo } : undefined}
                style={styles.epThumb}
              />

              <View style={styles.epInfo}>
                <Text style={styles.epNumber}>{index + 1}</Text>

                <Text style={styles.epTitle} numberOfLines={2}>
                  {item.title ||
                    `${series?.name || "Série"} - Episódio ${index + 1}`}
                </Text>

                <Text style={styles.epDesc} numberOfLines={3}>
                  {item.description || "Descrição do episódio."}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nenhum episódio encontrado</Text>
            </View>
          }
        />
      </View>

      <Modal
        visible={!!selectedEpisode}
        animationType="fade"
        transparent={false}
        onRequestClose={closePlayer}
        statusBarTranslucent
      >
        <View style={styles.playerScreen}>
          {selectedEpisode?.url ? (
            <Video
              ref={videoRef}
              source={{ uri: selectedEpisode.url }}
              style={styles.fullscreenVideo}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              onLoadStart={() => {
                setPlayerError("");
                setLoadingText("Carregando episódio...");
              }}
              onLoad={() => {
                setPlayerError("");
                setLoadingText("");
              }}
              onReadyForDisplay={() => {
                setPlayerError("");
                setLoadingText("");
              }}
              onError={() => {
                setLoadingText("");
                setPlayerError("Falha ao reproduzir episódio.");
              }}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
          ) : (
            <View style={styles.playerEmpty}>
              <Text style={styles.playerEmptyText}>
                URL do episódio não encontrada
              </Text>
            </View>
          )}

          <View style={styles.playerTopOverlay}>
            <TouchableOpacity onPress={closePlayer} style={styles.playerBackBtn}>
              <Text style={styles.playerBackText}>VOLTAR</Text>
            </TouchableOpacity>
          </View>

          {!!loadingText && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          )}

          {!!playerError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{playerError}</Text>
            </View>
          )}

          <View style={styles.playerBottomOverlay}>
            <Text style={styles.playerTitle} numberOfLines={1}>
              {selectedEpisode?.title || "Episódio"}
            </Text>

            <Text style={styles.playerMeta} numberOfLines={1}>
              {season?.name || "Temporada"} • {series?.name || "Série"}
            </Text>

            <View style={styles.playerButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.playerActionBtn,
                  selectedEpisodeIndex <= 0 && styles.playerActionBtnDisabled,
                ]}
                onPress={playPreviousEpisode}
                disabled={selectedEpisodeIndex <= 0}
              >
                <Text style={styles.playerActionBtnText}>◀ ANTERIOR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.playerActionBtn,
                  selectedEpisodeIndex >= episodes.length - 1 &&
                    styles.playerActionBtnDisabled,
                ]}
                onPress={playNextEpisode}
                disabled={selectedEpisodeIndex >= episodes.length - 1}
              >
                <Text style={styles.playerActionBtnText}>PRÓXIMO ▶</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.autoNextInfo}>
              Ao terminar o episódio, o próximo abre automaticamente.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#121018",
  },

  leftPanel: {
    width: isPhone ? 120 : 230,
    backgroundColor: "#10202f",
    padding: 16,
  },

  backWrap: {
    marginBottom: 30,
  },

  backText: {
    color: "#fff",
    fontSize: isPhone ? 22 : 30,
    fontWeight: "900",
  },

  seasonTitle: {
    color: "#ffe04f",
    fontSize: isPhone ? 14 : 22,
    fontWeight: "900",
    marginBottom: 12,
  },

  seasonCount: {
    color: "#cdd8e6",
    fontSize: isPhone ? 10 : 14,
  },

  rightPanel: {
    flex: 1,
    padding: 18,
  },

  mainTitle: {
    color: "#fff",
    fontSize: isPhone ? 18 : 30,
    textAlign: "right",
    marginBottom: 16,
    fontWeight: "900",
  },

  epRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
    minHeight: isPhone ? 90 : 120,
    borderRadius: 10,
    overflow: "hidden",
  },

  epThumb: {
    width: isPhone ? 120 : 180,
    height: "100%",
    backgroundColor: "#3b425a",
  },

  epInfo: {
    flex: 1,
    padding: 10,
  },

  epNumber: {
    color: "#ff4c4c",
    fontSize: isPhone ? 10 : 14,
    fontWeight: "900",
  },

  epTitle: {
    color: "#fff",
    fontSize: isPhone ? 12 : 18,
    fontWeight: "700",
    marginTop: 2,
  },

  epDesc: {
    color: "#e6e6e6",
    fontSize: isPhone ? 10 : 14,
    marginTop: 6,
    lineHeight: isPhone ? 14 : 20,
  },

  emptyWrap: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#cfd7e2",
    fontSize: isPhone ? 10 : 13,
    textAlign: "center",
  },

  playerScreen: {
    flex: 1,
    backgroundColor: "#000",
  },

  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },

  playerTopOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: isPhone ? 18 : 24,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  playerBackBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#102033",
    borderRadius: 8,
  },

  playerBackText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: 12,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 20,
  },

  loadingText: {
    color: "#fff",
    fontSize: isPhone ? 11 : 14,
    textAlign: "center",
  },

  errorOverlay: {
    position: "absolute",
    top: isPhone ? 70 : 85,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  errorText: {
    color: "#ffb3b3",
    fontSize: isPhone ? 11 : 14,
    textAlign: "center",
  },

  playerBottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  playerTitle: {
    color: "#fff",
    fontSize: isPhone ? 15 : 20,
    fontWeight: "900",
  },

  playerMeta: {
    color: "#d7e2ee",
    fontSize: isPhone ? 10 : 13,
    marginTop: 4,
  },

  playerButtonsRow: {
    flexDirection: "row",
    marginTop: 12,
  },

  playerActionBtn: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,32,51,0.92)",
    marginRight: 10,
  },

  playerActionBtnDisabled: {
    opacity: 0.45,
  },

  playerActionBtnText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: isPhone ? 11 : 13,
  },

  autoNextInfo: {
    color: "#d7e2ee",
    marginTop: 10,
    fontSize: isPhone ? 10 : 12,
  },

  playerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },

  playerEmptyText: {
    color: "#fff",
    fontSize: 14,
  },
});
