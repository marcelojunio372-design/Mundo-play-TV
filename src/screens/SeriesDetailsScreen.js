import React, { useMemo } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function extractSeasonNumber(name = "") {
  const match = safeText(name).match(/S(\d{1,2})E\d{1,3}/i);
  if (match?.[1]) return Number(match[1]);
  return 1;
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
      episodes: grouped[season].sort((a, b) =>
        safeText(a?.name).localeCompare(safeText(b?.name))
      ),
    }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

export default function SeriesDetailsScreen({
  series,
  onBack,
  onOpenSeason,
}) {
  const seasons = useMemo(() => buildSeasons(series), [series]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{series?.name || "Série"}</Text>
        <Text style={styles.meta}>{series?.group || "Séries"}</Text>

        <FlatList
          data={seasons}
          keyExtractor={(item) => `season_${item.seasonNumber}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.seasonRow}
              onPress={() => onOpenSeason?.(item)}
            >
              <Text style={styles.seasonName}>{item.name}</Text>
              <Text style={styles.seasonCount}>{item.episodes.length} eps</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nenhuma temporada encontrada</Text>
            </View>
          }
        />
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
    padding: 14,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },

  meta: {
    color: "#b7c6d6",
    marginBottom: 16,
  },

  seasonRow: {
    minHeight: 56,
    borderRadius: 10,
    backgroundColor: "#162033",
    marginBottom: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  seasonName: {
    color: "#fff",
    fontWeight: "800",
  },

  seasonCount: {
    color: "#ffe04f",
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
