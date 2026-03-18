import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

const FAVORITES_KEY = "mundoplaytv_series_favorites";
const RECENTS_KEY = "mundoplaytv_series_recents";

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getSeriesStorageId(item = {}) {
  return safeText(item.id || item.url || item.name);
}

function buildCategories(items = [], favorites = [], recents = []) {
  const groups = {};

  items.forEach((item) => {
    const key = safeText(item.group || "OUTROS");
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return [
    { name: "Tudo", items },
    { name: "Favoritos", items: favorites },
    { name: "Visto por último", items: recents },
    ...Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((group) => ({
        name: group,
        items: groups[group],
      })),
  ];
}

export default function SeriesScreen({
  session,
  onBack,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onSelectSeries,
}) {
  const series = session?.data?.series || [];

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadSavedData() {
      try {
        const [savedFavorites, savedRecents] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(RECENTS_KEY),
        ]);

        if (savedFavorites) setFavoriteIds(JSON.parse(savedFavorites));
        if (savedRecents) setRecentIds(JSON.parse(savedRecents));
      } catch (e) {}
    }

    loadSavedData();
  }, []);

  const favoriteSeries = useMemo(() => {
    const setFav = new Set(favoriteIds);
    return series.filter((item) =>
      setFav.has(getSeriesStorageId(item))
    );
  }, [series, favoriteIds]);

  const recentSeries = useMemo(() => {
    const map = new Map(series.map((i) => [getSeriesStorageId(i), i]));
    return recentIds.map((id) => map.get(id)).filter(Boolean);
  }, [series, recentIds]);

  const categories = useMemo(() => {
    return buildCategories(series, favoriteSeries, recentSeries);
  }, [series, favoriteSeries, recentSeries]);

  const baseSeries = categories[selectedCategory]?.items || series;

  const visibleSeries = useMemo(() => {
    const term = safeText(search).toLowerCase();
    if (!term) return baseSeries;

    return baseSeries.filter((item) => {
      const name = safeText(item.name).toLowerCase();
      const group = safeText(item.group).toLowerCase();
      return name.includes(term) || group.includes(term);
    });
  }, [baseSeries, search]);

  const addToRecent = async (item) => {
    const id = getSeriesStorageId(item);
    if (!id) return;

    const updated = [id, ...recentIds.filter((i) => i !== id)].slice(0, 50);
    setRecentIds(updated);
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  };

  const toggleFavorite = async (item) => {
    const id = getSeriesStorageId(item);
    if (!id) return;

    let updated = [];

    if (favoriteIds.includes(id)) {
      updated = favoriteIds.filter((i) => i !== id);
    } else {
      updated = [id, ...favoriteIds];
    }

    setFavoriteIds(updated);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const handleSelect = async (item) => {
    await addToRecent(item);
    onSelectSeries?.(item);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topnav}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.navText}>Casa</Text>
        </TouchableOpacity>

        <Text style={styles.sep}>|</Text>

        <TouchableOpacity onPress={onOpenLive}>
          <Text style={styles.navText}>TV ao Vivo</Text>
        </TouchableOpacity>

        <Text style={styles.sep}>|</Text>

        <TouchableOpacity onPress={onOpenMovies}>
          <Text style={styles.navText}>Filmes</Text>
        </TouchableOpacity>

        <Text style={styles.sep}>|</Text>

        <TouchableOpacity onPress={onOpenSeries}>
          <Text style={styles.navTextActive}>Séries</Text>
        </TouchableOpacity>

        <View style={styles.searchWrap}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar série..."
            placeholderTextColor="#9aa7b8"
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <FlatList
            data={categories}
            keyExtractor={(item, i) => `${item.name}_${i}`}
            renderItem={({ item, index }) => {
              const active = index === selectedCategory;

              return (
                <TouchableOpacity
                  style={[styles.categoryRow, active && styles.categoryActive]}
                  onPress={() => setSelectedCategory(index)}
                >
                  <Text style={styles.categoryText}>{item.name}</Text>
                  <Text style={styles.categoryCount}>{item.items.length}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.rightPanel}>
          <FlatList
            data={visibleSeries}

            // 🔥 ZOOM CORRIGIDO
            numColumns={isPhone ? 2 : 5}

            keyExtractor={(item, i) => item.id || `${item.name}_${i}`}
            columnWrapperStyle={styles.rowWrap}
            renderItem={({ item }) => {
              const favorite = favoriteIds.includes(getSeriesStorageId(item));

              return (
                <View style={styles.card}>
                  <TouchableOpacity
                    style={styles.favoriteBtn}
                    onPress={() => toggleFavorite(item)}
                  >
                    <Text style={styles.favoriteBtnText}>
                      {favorite ? "★" : "☆"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleSelect(item)}>
                    <Image
                      source={item.logo ? { uri: item.logo } : undefined}
                      style={styles.poster}
                    />

                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.name}
                    </Text>

                    <Text style={styles.cardMeta}>
                      {item.group || "Séries"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040914" },

  topnav: {
    height: isPhone ? 42 : 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  navText: { color: "#d7d7d7", fontSize: isPhone ? 11 : 16 },

  navTextActive: {
    color: "#ffe04f",
    fontSize: isPhone ? 11 : 16,
    fontWeight: "900",
  },

  sep: { color: "#ccc", marginHorizontal: 12 },

  searchWrap: { marginLeft: "auto", width: isPhone ? 100 : 190 },

  searchInput: {
    height: 30,
    backgroundColor: "#151d3d",
    color: "#fff",
    paddingHorizontal: 10,
  },

  content: { flex: 1, flexDirection: "row" },

  leftPanel: { width: isPhone ? 120 : 260, backgroundColor: "#261425" },

  categoryRow: {
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  categoryActive: { backgroundColor: "rgba(255,224,79,0.12)" },

  categoryText: { color: "#fff" },
  categoryCount: { color: "#fff" },

  rightPanel: { flex: 1, padding: 10 },

  rowWrap: { justifyContent: "space-between" },

  // 🔥 TAMANHO MAIOR
  card: {
    width: isPhone ? "48%" : "18.6%",
    marginBottom: 10,
  },

  favoriteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 5,
  },

  favoriteBtnText: { color: "#ffe04f", fontSize: 16 },

  poster: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 8,
    marginBottom: 6,
  },

  cardTitle: { color: "#fff", fontSize: 12 },

  cardMeta: { color: "#aaa", fontSize: 10 },
});
