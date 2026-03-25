import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "mundoplaytv_series_favorites";
const RECENTS_KEY = "mundoplaytv_series_recents";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getSeriesStorageId(item = {}) {
  return safeText(item.id || item.url || item.name);
}

function extractSeasonNumber(name = "") {
  const text = safeText(name);
  const match = text.match(/S(\d{1,2})E\d{1,3}/i);
  if (match?.[1]) return Number(match[1]);

  const matchPt = text.match(/temporada\s*(\d{1,2})/i);
  if (matchPt?.[1]) return Number(matchPt[1]);

  return 1;
}

function extractEpisodeNumber(name = "") {
  const text = safeText(name);
  const match = text.match(/S\d{1,2}E(\d{1,3})/i);
  if (match?.[1]) return Number(match[1]);

  const matchPt = text.match(/epis[oó]dio\s*(\d{1,3})/i);
  if (matchPt?.[1]) return Number(matchPt[1]);

  return 0;
}

function buildSeasons(series) {
  const episodes = safeArray(series?.seasons || series?.episodes || []);
  const grouped = {};

  episodes.forEach((episode) => {
    const season = extractSeasonNumber(episode?.name || episode?.tvgName || "");
    if (!grouped[season]) grouped[season] = [];
    grouped[season].push(episode);
  });

  return Object.keys(grouped)
    .map((season) => ({
      seasonNumber: Number(season),
      name: `Temporada ${season}`,
      episodes: grouped[season].sort((a, b) => {
        const aEp = extractEpisodeNumber(a?.name || "");
        const bEp = extractEpisodeNumber(b?.name || "");
        if (aEp !== bEp) return aEp - bEp;
        return safeText(a?.name).localeCompare(safeText(b?.name));
      }),
    }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

export default function SeriesDetailsScreen({
  series,
  onBack,
  onOpenSeason,
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const seasons = useMemo(() => buildSeasons(series), [series]);

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
        const updated = [id, ...ids.filter((item) => item !== id)].slice(0, 30);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.left}>
          {series?.logo ? (
            <Image source={{ uri: series.logo }} style={styles.poster} />
          ) : (
            <View style={styles.posterFallback}>
              <Text style={styles.posterFallbackText}>SEM CAPA</Text>
            </View>
          )}
        </View>

        <View style={styles.right}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{series?.name || "Série"}</Text>

            <TouchableOpacity onPress={toggleFavorite}>
              <Text style={[styles.star, isFavorite && styles.starActive]}>★</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.meta}>
            {(series?.year || "-") + " • " + (series?.group || "Séries")}
          </Text>

          <Text style={styles.description}>
            {series?.description ||
              series?.plot ||
              series?.desc ||
              "Descrição não disponível."}
          </Text>

          <View style={styles.seasonsHeader}>
            <Text style={styles.seasonsHeaderText}>
              {seasons.length} temporada{seasons.length === 1 ? "" : "s"}
            </Text>
          </View>

          <FlatList
            data={seasons}
            keyExtractor={(item) => `season_${item.seasonNumber}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.seasonRow}
                onPress={() => onOpenSeason?.(item)}
              >
                <View>
                  <Text style={styles.seasonName}>{item.name}</Text>
                  <Text style={styles.seasonSub}>
                    {item.episodes.length} episódio{item.episodes.length === 1 ? "" : "s"}
                  </Text>
                </View>

                <Text style={styles.seasonArrow}>›</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Nenhuma temporada encontrada</Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </SafeAreaView>
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
    padding: 14,
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
    marginRight: 10,
  },

  star: {
    color: "#666",
    fontSize: 18,
    marginTop: 2,
  },

  starActive: {
    color: "#ffe04f",
  },

  meta: {
    color: "#b7c6d6",
    marginBottom: 10,
  },

  description: {
    color: "#d6dce5",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },

  seasonsHeader: {
    marginBottom: 10,
  },

  seasonsHeaderText: {
    color: "#35c8ff",
    fontSize: 13,
    fontWeight: "800",
  },

  seasonRow: {
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: "#162033",
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  seasonName: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 4,
  },

  seasonSub: {
    color: "#ffe04f",
    fontSize: 12,
    fontWeight: "700",
  },

  seasonArrow: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },

  emptyWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },

  emptyText: {
    color: "#fff",
  },
});
