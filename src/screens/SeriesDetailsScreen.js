import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const isPhone = width < 900;
const FAVORITES_KEY = "mundoplaytv_series_favorites";

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getSeriesStorageId(item = {}) {
  return safeText(item.id || item.url || item.name);
}

function normalizeEpisodes(rawEpisodes = {}, series = {}) {
  const seasons = [];

  Object.keys(rawEpisodes || {}).forEach((seasonKey) => {
    const episodes = Array.isArray(rawEpisodes[seasonKey]) ? rawEpisodes[seasonKey] : [];

    const parsedEpisodes = episodes.map((episode, index) => {
      const episodeId = safeText(episode?.id);
      const ext = safeText(episode?.container_extension || "mp4");
      const server = safeText(series?.server);
      const username = safeText(series?.username);
      const password = safeText(series?.password);

      const url =
        server && username && password && episodeId
          ? `${server.replace(/\/+$/, "")}/series/${username}/${password}/${episodeId}.${ext}`
          : "";

      return {
        id: episodeId || `ep_${seasonKey}_${index + 1}`,
        title:
          safeText(episode?.title) ||
          `${series?.name || "Série"} - S${String(seasonKey).padStart(2, "0")}E${String(
            episode?.episode_num || index + 1
          ).padStart(2, "0")}`,
        description:
          safeText(episode?.info?.plot) ||
          safeText(episode?.plot) ||
          safeText(series?.description) ||
          "Descrição do episódio.",
        logo:
          safeText(episode?.info?.movie_image) ||
          safeText(episode?.movie_image) ||
          safeText(series?.logo),
        url,
        season: Number(seasonKey) || 1,
        episodeNumber: Number(episode?.episode_num || index + 1),
      };
    });

    seasons.push({
      id: `season_${seasonKey}`,
      name: `Temporada ${seasonKey}`,
      seasonNumber: Number(seasonKey) || 1,
      episodes: parsedEpisodes,
    });
  });

  return seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
}

export default function SeriesDetailsScreen({ series, onBack, onOpenSeason }) {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [remoteDescription, setRemoteDescription] = useState("");
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    async function loadSavedFavorites() {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        setFavoriteIds(Array.isArray(parsed) ? parsed : []);
      } catch (e) {}
    }

    loadSavedFavorites();
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchSeriesInfo() {
      if (!series?.url) {
        setSeasons([]);
        setRemoteDescription("");
        return;
      }

      try {
        setLoadingDetails(true);

        const response = await fetch(series.url);
        const json = await response.json();

        if (!active) return;

        const desc =
          safeText(json?.info?.plot) ||
          safeText(json?.info?.description) ||
          safeText(series?.description);

        setRemoteDescription(desc);
        setSeasons(normalizeEpisodes(json?.episodes || {}, series));
      } catch (e) {
        if (!active) return;
        setRemoteDescription(safeText(series?.description));
        setSeasons([]);
      } finally {
        if (active) {
          setLoadingDetails(false);
        }
      }
    }

    fetchSeriesInfo();

    return () => {
      active = false;
    };
  }, [series]);

  const favoriteId = getSeriesStorageId(series);
  const isFavorite = useMemo(() => favoriteIds.includes(favoriteId), [favoriteIds, favoriteId]);

  const toggleFavorite = async () => {
    if (!favoriteId) return;

    let updated = [];

    if (favoriteIds.includes(favoriteId)) {
      updated = favoriteIds.filter((item) => item !== favoriteId);
    } else {
      updated = [favoriteId, ...favoriteIds];
    }

    setFavoriteIds(updated);

    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  if (!series) return null;

  const description =
    remoteDescription ||
    safeText(series?.description) ||
    "Sem descrição na lista.";

  const firstSeason = seasons[0] || null;
  const totalEpisodes = seasons.reduce(
    (acc, seasonItem) => acc + (seasonItem?.episodes?.length || 0),
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={series.logo ? { uri: series.logo } : undefined}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.overlay}>
          <Image
            source={series.logo ? { uri: series.logo } : undefined}
            style={styles.poster}
          />

          <View style={styles.infoWrap}>
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => firstSeason && onOpenSeason(firstSeason)}
                disabled={!firstSeason}
              >
                <Text style={styles.actionBtnText}>
                  {loadingDetails ? "carregando..." : "▶ assistir a temporada"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn} onPress={toggleFavorite}>
                <Text style={styles.iconBtnText}>{isFavorite ? "★" : "☆"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {series.name}
            </Text>

            <Text style={styles.meta} numberOfLines={1}>
              {(series.year || "-") + " • " + (series.group || "Séries")}
            </Text>

            {loadingDetails ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#38d7ff" />
                <Text style={styles.loadingText}>Carregando dados da série...</Text>
              </View>
            ) : null}

            <Text style={styles.desc} numberOfLines={7}>
              {description}
            </Text>

            <Text style={styles.episodesInfo}>
              Temporadas: {seasons.length || 0} • Episódios: {totalEpisodes || 0}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080b12",
  },

  bg: {
    flex: 1,
  },

  bgImage: {
    opacity: 0.22,
  },

  backBtn: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 10,
  },

  backText: {
    color: "#fff",
    fontSize: isPhone ? 22 : 30,
    fontWeight: "900",
  },

  overlay: {
    flex: 1,
    flexDirection: isPhone ? "column" : "row",
    alignItems: isPhone ? "flex-start" : "center",
    paddingHorizontal: isPhone ? 20 : 70,
    paddingTop: isPhone ? 70 : 0,
    backgroundColor: "rgba(10,8,16,0.58)",
  },

  poster: {
    width: isPhone ? 140 : 200,
    height: isPhone ? 210 : 300,
    borderRadius: 12,
    backgroundColor: "#26354b",
  },

  infoWrap: {
    flex: 1,
    marginLeft: isPhone ? 0 : 28,
    marginTop: isPhone ? 20 : 0,
    width: "100%",
    backgroundColor: "rgba(60,36,72,0.55)",
    padding: 20,
    borderRadius: 14,
  },

  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  actionBtn: {
    height: 42,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    marginRight: 12,
    borderRadius: 10,
  },

  actionBtnText: {
    color: "#fff",
    fontSize: isPhone ? 12 : 16,
    fontWeight: "700",
  },

  iconBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },

  iconBtnText: {
    color: "#fff",
    fontSize: 20,
  },

  title: {
    color: "#fff",
    fontSize: isPhone ? 24 : 36,
    fontWeight: "900",
  },

  meta: {
    color: "#d9d0de",
    fontSize: isPhone ? 12 : 16,
    marginTop: 8,
  },

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  loadingText: {
    color: "#38d7ff",
    marginLeft: 10,
    fontSize: isPhone ? 11 : 14,
    fontWeight: "700",
  },

  desc: {
    color: "#f1edf4",
    fontSize: isPhone ? 12 : 16,
    marginTop: 18,
    lineHeight: isPhone ? 18 : 25,
  },

  episodesInfo: {
    color: "#38d7ff",
    fontSize: isPhone ? 12 : 15,
    marginTop: 18,
    fontWeight: "700",
  },
});
