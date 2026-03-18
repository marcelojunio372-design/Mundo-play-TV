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

const FAVORITES_KEY = "mundoplaytv_movie_favorites";
const RECENTS_KEY = "mundoplaytv_movie_recents";

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getMovieStorageId(item = {}) {
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

export default function MoviesScreen({
  session,
  onBack,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onSelectMovie,
}) {
  const movies = session?.data?.movies || [];

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

  const favoriteMovies = useMemo(() => {
    const setFav = new Set(favoriteIds);
    return movies.filter((item) => setFav.has(getMovieStorageId(item)));
  }, [movies, favoriteIds]);

  const recentMovies = useMemo(() => {
    const map = new Map(movies.map((i) => [getMovieStorageId(i), i]));
    return recentIds.map((id) => map.get(id)).filter(Boolean);
  }, [movies, recentIds]);

  const categories = useMemo(() => {
    return buildCategories(movies, favoriteMovies, recentMovies);
  }, [movies, favoriteMovies, recentMovies]);

  const baseMovies = categories[selectedCategory]?.items || movies;

  const visibleMovies = useMemo(() => {
    const term = safeText(search).toLowerCase();
    if (!term) return baseMovies;

    return baseMovies.filter((item) => {
      const name = safeText(item.name).toLowerCase();
      const group = safeText(item.group).toLowerCase();
      const year = safeText(item.year).toLowerCase();
      return name.includes(term) || group.includes(term) || year.includes(term);
    });
  }, [baseMovies, search]);

  const addToRecent = async (movie) => {
    const id = getMovieStorageId(movie);
    if (!id) return;

    const updated = [id, ...recentIds.filter((i) => i !== id)].slice(0, 50);
    setRecentIds(updated);
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  };

  const toggleFavorite = async (movie) => {
    const id = getMovieStorageId(movie);
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

  const handleSelectMovie = async (movie) => {
    await addToRecent(movie);
    onSelectMovie?.(movie);
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
          <Text style={styles.navTextActive}>Filmes</Text>
        </TouchableOpacity>

        <Text style={styles.sep}>|</Text>

        <TouchableOpacity onPress={onOpenSeries}>
          <Text style={styles.navText}>Séries</Text>
        </TouchableOpacity>

        <View style={styles.searchWrap}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar filme..."
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
            data={visibleMovies}
            keyExtractor={(item, i) => item.id || `${item.name}_${i}`}
            
            // 🔥 AQUI FOI CORRIGIDO O ZOOM
            numColumns={isPhone ? 2 : 5}

            columnWrapperStyle={styles.rowWrap}
            renderItem={({ item }) => {
              const favorite = favoriteIds.includes(getMovieStorageId(item));

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

                  <TouchableOpacity onPress={() => handleSelectMovie(item)}>
                    <Image
                      source={item.logo ? { uri: item.logo } : undefined}
                      style={styles.poster}
                    />

                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.name}
                    </Text>

                    <Text style={styles.cardMeta}>
                      {(item.year || "-") + " • " + (item.group || "Filmes")}
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

  // 🔥 AQUI FOI CORRIGIDO O TAMANHO
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
