import React, { useEffect, useMemo, useRef, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from "expo-av";

const FAVORITES_KEY = "mundoplaytv_series_favorites";
const RECENTS_KEY = "mundoplaytv_series_recents";

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getSeriesStorageId(item = {}) {
  return safeText(item.id || item.url || item.name);
}

function extractSeasonEpisode(name = "") {
  const match = String(name || "").match(/S(\d{1,2})E(\d{1,3})/i);
  if (match) {
    return {
      season: Number(match[1]),
      episode: Number(match[2]),
    };
  }
  return { season: 1, episode: 0 };
}

function buildSeasons(series) {
  const items = Array.isArray(series?.episodes) ? series.episodes : [];
  const grouped = {};

  items.forEach((ep) => {
    const { season } = extractSeasonEpisode(ep.name || "");
    if (!grouped[season]) grouped[season] = [];
    grouped[season].push(ep);
  });

  return Object.keys(grouped)
    .map((season) => ({
      seasonNumber: Number(season),
      name: `Temporada ${season}`,
      episodes: grouped[season],
    }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

export default function SeriesDetailsScreen({ series, onBack }) {
  const videoRef = useRef(null);

  const seasons = useMemo(() => buildSeasons(series), [series]);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const currentSeason = seasons.find((s) => s.seasonNumber === selectedSeason);
  const episodes = currentSeason?.episodes || [];

  const selectedEpisode =
    selectedEpisodeIndex !== null ? episodes[selectedEpisodeIndex] : null;

  const sourceUri = selectedEpisode?.url || "";

  useEffect(() => {
    async function loadFavorite() {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        setIsFavorite(ids.includes(getSeriesStorageId(series)));
      } catch (e) {}
    }

    loadFavorite();
  }, [series]);

  useEffect(() => {
    async function addRecent() {
      try {
        const raw = await AsyncStorage.getItem(RECENTS_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        const id = getSeriesStorageId(series);
        const updated = [id, ...ids.filter((i) => i !== id)].slice(0, 30);
        await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
      } catch (e) {}
    }

    if (series) addRecent();
  }, [series]);

  const toggleFavorite = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const id = getSeriesStorageId(series);

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

  const handleStatus = (status) => {
    if (!status || !status.isLoaded) return;

    if (status.didJustFinish && !status.isLooping) {
      const next = (selectedEpisodeIndex ?? -1) + 1;
      if (next < episodes.length) {
        setSelectedEpisodeIndex(next);
      }
    }

    setIsBuffering(!!status.isBuffering);
  };

  const openEpisode = (index) => {
    setSelectedEpisodeIndex(index);
    setIsFullscreen(true);
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
          <View style={styles.header}>
            <Image source={{ uri: series?.logo }} style={styles.poster} />

            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{series?.name}</Text>

                <TouchableOpacity onPress={toggleFavorite}>
                  <Text style={[styles.heart, isFavorite && styles.heartActive]}>♥</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.meta}>
                {(series?.year || "N/A")} • {series?.group || "Séries"}
              </Text>

              <Text style={styles.meta}>Diretor: {series?.director || "N/A"}</Text>
              <Text style={styles.meta}>Duração: {series?.duration || "N/A"}</Text>
              <Text style={styles.meta}>Gênero: {series?.genre || series?.group || "N/A"}</Text>
              <Text style={styles.meta}>Elenco: {series?.cast || "N/A"}</Text>

              <Text style={styles.description}>
                {series?.description || series?.desc || series?.plot || "Descrição não disponível."}
              </Text>
            </View>
          </View>

          <View style={styles.seasonRow}>
            {seasons.map((s) => {
              const active = s.seasonNumber === selectedSeason;
              return (
                <TouchableOpacity
                  key={s.seasonNumber}
                  style={[styles.seasonBtn, active && styles.seasonBtnActive]}
                  onPress={() => setSelectedSeason(s.seasonNumber)}
                >
                  <Text style={styles.seasonText}>{s.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FlatList
            data={episodes}
            keyExtractor={(item, index) => item.id || `${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.episodeCard}
                onPress={() => openEpisode(index)}
              >
                <Image source={{ uri: item.logo }} style={styles.thumb} />

                <View style={styles.episodeInfo}>
                  <Text style={styles.epTitle}>{item.name}</Text>
                  <Text style={styles.epSub}>
                    {item?.description || item?.desc || item?.plot || "Toque para reproduzir"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>

      <Modal visible={isFullscreen} animationType="fade" transparent={false}>
        <View style={styles.fullscreen}>
          {sourceUri ? (
            <>
              <Video
                ref={videoRef}
                key={`ep_${selectedEpisodeIndex}`}
                source={{ uri: sourceUri }}
                style={styles.video}
                shouldPlay
                resizeMode={ResizeMode.COVER}
                useNativeControls
                onPlaybackStatusUpdate={handleStatus}
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
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050915" },

  topbar: {
    height: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  backText: { color: "#fff", fontWeight: "800" },

  content: { flex: 1, padding: 10 },

  header: { flexDirection: "row", marginBottom: 10 },

  poster: {
    width: 90,
    height: 130,
    borderRadius: 8,
  },

  info: { flex: 1, marginLeft: 10 },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 2,
  },

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
    marginRight: 8,
  },

  heart: {
    color: "#bbb",
    fontSize: 18,
  },

  heartActive: {
    color: "#ff6fa8",
  },

  meta: { color: "#aaa", fontSize: 11, marginTop: 2 },

  description: {
    color: "#ccc",
    fontSize: 11,
    marginTop: 6,
  },

  seasonRow: {
    flexDirection: "row",
    marginVertical: 10,
    flexWrap: "wrap",
  },

  seasonBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#222",
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },

  seasonBtnActive: { backgroundColor: "#7e5ca8" },

  seasonText: { color: "#fff", fontSize: 11 },

  episodeCard: {
    flexDirection: "row",
    backgroundColor: "#162033",
    marginBottom: 6,
    borderRadius: 8,
    padding: 6,
  },

  thumb: {
    width: 80,
    height: 50,
    borderRadius: 6,
    marginRight: 8,
  },

  episodeInfo: {
    flex: 1,
    justifyContent: "center",
  },

  epTitle: { color: "#fff", fontSize: 11, marginBottom: 2 },

  epSub: { color: "#aaa", fontSize: 9 },

  fullscreen: { flex: 1, backgroundColor: "#000" },

  video: { width: "100%", height: "100%" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  closeBtn: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  closeText: { color: "#fff", fontWeight: "800" },
});
