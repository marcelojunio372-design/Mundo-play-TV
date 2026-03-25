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
      name: `Temporada - ${season}`,
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
  const selectedSeason = seasons[0] || null;

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
      {series?.logo ? <Image source={{ uri: series.logo }} style={styles.backdrop} /> : null}
      <View style={styles.backdropOverlay} />

      <View style={styles.topbar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.posterCol}>
          {series?.logo ? (
            <Image source={{ uri: series.logo }} style={styles.poster} />
          ) : (
            <View style={styles.posterFallback}>
              <Text style={styles.posterFallbackText}>SEM CAPA</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{series?.name || "Série"}</Text>
            <TouchableOpacity onPress={toggleFavorite}>
              <Text style={[styles.heart, isFavorite && styles.heartActive]}>♥</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoGrid}>
            <Text style={styles.label}>Dirigido por:</Text>
            <Text style={styles.value}>{series?.director || "N/A"}</Text>

            <Text style={styles.label}>Data de lançamento:</Text>
            <Text style={styles.value}>{series?.year || "N/A"}</Text>

            <Text style={styles.label}>Gênero:</Text>
            <Text style={styles.value}>{series?.group || "Séries"}</Text>

            <Text style={styles.label}>Sinopse:</Text>
            <Text style={styles.synopsisInline}>
              {series?.description ||
                series?.plot ||
                series?.desc ||
                "Descrição não disponível."}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => {
                if (selectedSeason) onOpenSeason?.(selectedSeason);
              }}
            >
              <Text style={styles.playBtnText}>Abrir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.seasonSelector}
              onPress={() => {
                if (selectedSeason) onOpenSeason?.(selectedSeason);
              }}
            >
              <Text style={styles.seasonSelectorText}>
                {selectedSeason?.name || "Temporada - 1"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabsRow}>
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>
                EPISÓDIOS ({selectedSeason?.episodes?.length || 0})
              </Text>
            </View>

            <View style={styles.tabInactive}>
              <Text style={styles.tabInactiveText}>Elenco</Text>
            </View>
          </View>

          <FlatList
            data={safeArray(selectedSeason?.episodes).slice(0, 8)}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.episodePreviewRow}
                onPress={() => {
                  if (selectedSeason) onOpenSeason?.(selectedSeason);
                }}
              >
                <View style={styles.episodeThumbWrap}>
                  {item?.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.episodeThumb} />
                  ) : (
                    <View style={styles.episodeThumbFallback} />
                  )}
                </View>

                <View style={styles.episodeInfo}>
                  <Text style={styles.episodeTitle} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <Text style={styles.episodeMeta}>
                    {extractEpisodeNumber(item.name || "") > 0
                      ? `Episódio ${extractEpisodeNumber(item.name || "")}`
                      : `Item ${index + 1}`}
                  </Text>

                  <Text style={styles.episodeDesc} numberOfLines={3}>
                    {item?.description ||
                      item?.plot ||
                      item?.desc ||
                      "Toque para abrir a temporada e reproduzir."}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
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
    backgroundColor: "#120b24",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
    opacity: 0.22,
  },

  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18,11,36,0.82)",
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

  posterCol: {
    width: 170,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  infoCol: {
    flex: 1,
    paddingLeft: 14,
  },

  poster: {
    width: 140,
    height: 200,
    borderRadius: 10,
    resizeMode: "cover",
  },

  posterFallback: {
    width: 140,
    height: 200,
    borderRadius: 10,
    backgroundColor: "#2a3550",
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
    marginBottom: 10,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    flex: 1,
    marginRight: 12,
  },

  heart: {
    color: "#ddd",
    fontSize: 26,
  },

  heartActive: {
    color: "#ff6fa8",
  },

  infoGrid: {
    marginBottom: 16,
  },

  label: {
    color: "#f1f1f1",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },

  value: {
    color: "#e7e1ff",
    fontSize: 15,
    marginBottom: 10,
  },

  synopsisInline: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  playBtn: {
    width: 160,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#86f0ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  playBtnText: {
    color: "#101010",
    fontWeight: "900",
    fontSize: 15,
  },

  seasonSelector: {
    width: 190,
    height: 42,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  seasonSelectorText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  tabsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  tabActive: {
    minWidth: 170,
    height: 38,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  tabInactive: {
    minWidth: 120,
    height: 38,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  tabActiveText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },

  tabInactiveText: {
    color: "#ddd",
    fontWeight: "700",
    fontSize: 14,
  },

  episodePreviewRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  episodeThumbWrap: {
    width: 160,
    marginRight: 12,
  },

  episodeThumb: {
    width: 160,
    height: 90,
    borderRadius: 8,
    resizeMode: "cover",
  },

  episodeThumbFallback: {
    width: 160,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#23304a",
  },

  episodeInfo: {
    flex: 1,
    justifyContent: "center",
  },

  episodeTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },

  episodeMeta: {
    color: "#d8cdfd",
    fontSize: 13,
    marginBottom: 6,
  },

  episodeDesc: {
    color: "#f0f0f0",
    fontSize: 13,
    lineHeight: 18,
  },
});
