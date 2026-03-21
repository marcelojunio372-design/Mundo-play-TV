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

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function buildSeasonPlaylist(series, currentSeason) {
  const seasonsFromSeries = Array.isArray(series?.seasons) ? series.seasons : [];

  if (seasonsFromSeries.length > 0) {
    const flat = [];

    seasonsFromSeries.forEach((seasonItem, seasonIndex) => {
      const seasonEpisodes = Array.isArray(seasonItem?.episodes)
        ? seasonItem.episodes
        : [];

      seasonEpisodes.forEach((episode, episodeIndex) => {
        flat.push({
          ...episode,
          __seasonName:
            safeText(seasonItem?.name) || `Temporada ${seasonIndex + 1}`,
          __seasonIndex: seasonIndex,
          __episodeIndex: episodeIndex,
        });
      });
    });

    return flat;
  }

  const fallbackEpisodes = Array.isArray(currentSeason?.episodes)
    ? currentSeason.episodes
    : [];

  return fallbackEpisodes.map((episode, episodeIndex) => ({
    ...episode,
    __seasonName: safeText(currentSeason?.name) || "Temporada 1",
    __seasonIndex: 0,
    __episodeIndex: episodeIndex,
  }));
}

function findStartIndex(playlist, episode) {
  if (!playlist.length || !episode) return -1;

  const targetId = safeText(episode.id);
  const targetUrl = safeText(episode.url);
  const targetTitle = safeText(episode.title);

  const byId = playlist.findIndex((item) => safeText(item.id) === targetId);
  if (byId >= 0 && targetId) return byId;

  const byUrl = playlist.findIndex((item) => safeText(item.url) === targetUrl);
  if (byUrl >= 0 && targetUrl) return byUrl;

  const byTitle = playlist.findIndex(
    (item) => safeText(item.title) === targetTitle
  );
  if (byTitle >= 0 && targetTitle) return byTitle;

  return -1;
}

export default function SeasonEpisodesScreen({ series, season, onBack }) {
  const seasonEpisodes = Array.isArray(season?.episodes) ? season.episodes : [];

  const playlist = useMemo(() => {
    return buildSeasonPlaylist(series, season);
  }, [series, season]);

  const videoRef = useRef(null);

  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedPlaylistIndex, setSelectedPlaylistIndex] = useState(-1);
  const [statusText, setStatusText] = useState("");

  const openEpisode = (item) => {
    if (!item?.url) return;

    const startIndex = findStartIndex(playlist, item);

    setSelectedEpisode(item);
    setSelectedPlaylistIndex(startIndex);
    setStatusText("");
  };

  const closePlayer = async () => {
    try {
      await videoRef.current?.stopAsync?.();
    } catch (e) {}

    setSelectedEpisode(null);
    setSelectedPlaylistIndex(-1);
    setStatusText("");
  };

  const playNextAutomatically = async () => {
    const nextIndex = selectedPlaylistIndex + 1;

    if (nextIndex < 0 || nextIndex >= playlist.length) {
      return;
    }

    const nextEpisode = playlist[nextIndex];
    if (!nextEpisode?.url) return;

    try {
      await videoRef.current?.stopAsync?.();
    } catch (e) {}

    setStatusText("");
    setSelectedPlaylistIndex(nextIndex);
    setSelectedEpisode(nextEpisode);
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (!status) return;
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      playNextAutomatically();
      return;
    }

    if (status.isBuffering) {
      setStatusText("Carregando episódio...");
      return;
    }

    setStatusText("");
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
          Episódios: {seasonEpisodes.length}
        </Text>
      </View>

      <View style={styles.rightPanel}>
        <Text style={styles.mainTitle}>{series?.name || "Série"}</Text>

        <FlatList
          data={seasonEpisodes}
          keyExtractor={(item, index) => item.id || `ep_${index}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.epRow}
              onPress={() => openEpisode(item)}
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
        <SafeAreaView style={styles.playerScreen}>
          <View style={styles.playerTop}>
            <TouchableOpacity onPress={closePlayer} style={styles.playerBackBtn}>
              <Text style={styles.playerBackText}>VOLTAR</Text>
            </TouchableOpacity>

            <Text style={styles.playerTitle} numberOfLines={1}>
              {selectedEpisode?.title || "Episódio"}
            </Text>
          </View>

          <View style={styles.playerBox}>
            {selectedEpisode?.url ? (
              <Video
                ref={videoRef}
                source={{ uri: selectedEpisode.url }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
                isLooping={false}
                onLoadStart={() => setStatusText("Carregando episódio...")}
                onLoad={() => setStatusText("")}
                onReadyForDisplay={() => setStatusText("")}
                onError={() => setStatusText("Falha ao reproduzir episódio.")}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
            ) : (
              <View style={styles.playerEmpty}>
                <Text style={styles.playerEmptyText}>
                  URL do episódio não encontrada
                </Text>
              </View>
            )}

            {!!statusText && (
              <View style={styles.statusOverlay}>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
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
    backgroundColor: "#05070d",
  },

  playerTop: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  playerBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#102033",
  },

  playerBackText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: 12,
  },

  playerTitle: {
    flex: 1,
    color: "#fff",
    marginLeft: 12,
    fontSize: isPhone ? 12 : 16,
    fontWeight: "800",
  },

  playerBox: {
    flex: 1,
    backgroundColor: "#000",
  },

  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 20,
  },

  statusText: {
    color: "#fff",
    textAlign: "center",
    fontSize: isPhone ? 11 : 14,
  },

  playerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  playerEmptyText: {
    color: "#fff",
    fontSize: 14,
  },
});
