import React, { useEffect, useMemo, useRef, useState } from "react";
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
  isRefreshingData,
  onRefreshSession,
  onBack,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onSelectMovie,
}) {
  const movies = session?.data?.movies || [];
  const autoRefreshedRef = useRef(false);

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

        if (savedFavorites) {
          setFavoriteIds(JSON.parse(savedFavorites));
        }

        if (savedRecents) {
          setRecentIds(JSON.parse(savedRecents));
        }
      } catch (e) {}
    }

    loadSavedData();
  }, []);

  useEffect(() => {
    if (movies.length > 0) return;
    if (!session?.url) return;
    if (autoRefreshedRef.current) return;

    autoRefreshedRef.current = true;
    onRefreshSession?.();
  }, [movies.length, session?.url, onRefreshSession]);

  const favoriteMovies = useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    return movies.filter((item) => favoriteSet.has(getMovieStorageId(item)));
  }, [movies, favoriteIds]);

  const recentMovies = useMemo(() => {
    const map = new Map(movies.map((item) => [getMovieStorageId(item), item]));
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

  const persistFavorites = async (ids) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    } catch (e) {}
  };

  const persistRecents = async (ids) => {
    try {
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(ids));
    } catch (e) {}
  };

  const addToRecent = async (movie) => {
    const id = getMovieStorageId(movie);
    if (!id) return;

    const updated = [id, ...recentIds.filter((item) => item !== id)].slice(0, 50);
    setRecentIds(updated);
    await persistRecents(updated);
  };

  const toggleFavorite = async (movie) => {
    const id = getMovieStorageId(movie);
    if (!id) return;

    let updated = [];

    if (favoriteIds.includes(id)) {
      updated = favoriteIds.filter((item) => item !== id);
    } else {
      updated = [id, ...favoriteIds];
    }

    setFavoriteIds(updated);
    await persistFavorites(updated);
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
          <View style={styles.leftHeader}>
            <Text style={styles.leftIcon}>◁</Text>
            <Text style={styles.leftTitle}>voltar</Text>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item, index) => `${item.name}_${index}`}
            renderItem={({ item, index }) => {
              const active = index === selectedCategory;

              return (
                <TouchableOpacity
                  style={[styles.categoryRow, active && styles.categoryActive]}
                  onPress={() => {
                    setSelectedCategory(index);
                    setSearch("");
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={[
                      styles.categoryCount,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {item.items.length}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.rightPanel}>
          <Text style={styles.totalLabel}>
            {categories[selectedCategory]?.name || "Tudo"} ({visibleMovies.length})
          </Text>

          {movies.length === 0 && isRefreshingData ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Atualizando filmes...</Text>
            </View>
          ) : (
            <FlatList
              data={visibleMovies}
              keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
              numColumns={isPhone ? 4 : 6}
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

                    <TouchableOpacity
                      style={styles.cardTouch}
                      onPress={() => handleSelectMovie(item)}
                    >
                      <Image
                        source={item.logo ? { uri: item.logo } : undefined}
                        style={styles.poster}
                      />

                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.name}
                      </Text>

                      <Text style={styles.cardMeta} numberOfLines={2}>
                        {(item.year || "-") + " • " + (item.group || "Filmes")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>Nenhum filme encontrado</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040914",
  },

  topnav: {
    height: isPhone ? 42 : 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  navText: {
    color: "#d7d7d7",
    fontSize: isPhone ? 11 : 16,
  },

  navTextActive: {
    color: "#ffe04f",
    fontSize: isPhone ? 11 : 16,
    fontWeight: "900",
  },

  sep: {
    color: "#ccc",
    marginHorizontal: 12,
  },

  searchWrap: {
    marginLeft: "auto",
    width: isPhone ? 100 : 190,
  },

  searchInput: {
    height: isPhone ? 30 : 36,
    borderRadius: 8,
    backgroundColor: "#151d3d",
    color: "#fff",
    paddingHorizontal: 10,
    fontSize: isPhone ? 9 : 12,
  },

  content: {
    flex: 1,
    flexDirection: "row",
  },

  leftPanel: {
    width: isPhone ? 120 : 260,
    backgroundColor: "#261425",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
  },

  leftHeader: {
    height: isPhone ? 70 : 110,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  leftIcon: {
    color: "#fff",
    fontSize: isPhone ? 30 : 54,
    marginBottom: 6,
  },

  leftTitle: {
    color: "#fff",
    fontSize: isPhone ? 10 : 14,
  },

  categoryRow: {
    minHeight: isPhone ? 34 : 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  categoryActive: {
    backgroundColor: "rgba(255,224,79,0.12)",
  },

  categoryText: {
    color: "#f4f4f4",
    fontSize: isPhone ? 9 : 13,
    flex: 1,
    marginRight: 8,
  },

  categoryTextActive: {
    color: "#ffe04f",
    fontWeight: "900",
  },

  categoryCount: {
    color: "#f4f4f4",
    fontSize: isPhone ? 9 : 13,
  },

  rightPanel: {
    flex: 1,
    padding: isPhone ? 8 : 10,
  },

  totalLabel: {
    color: "#d9d9d9",
    textAlign: "right",
    fontSize: isPhone ? 11 : 18,
    marginBottom: 8,
  },

  rowWrap: {
    justifyContent: "space-between",
    marginBottom: isPhone ? 8 : 10,
  },

  card: {
    width: isPhone ? "23.5%" : "15.8%",
    position: "relative",
    marginBottom: isPhone ? 8 : 12,
  },

  cardTouch: {
    width: "100%",
  },

  favoriteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 5,
    width: isPhone ? 22 : 28,
    height: isPhone ? 22 : 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  favoriteBtnText: {
    color: "#ffe04f",
    fontSize: isPhone ? 12 : 16,
    fontWeight: "900",
  },

  poster: {
    width: "100%",
    aspectRatio: 0.67,
    borderRadius: 8,
    backgroundColor: "#2a3550",
    marginBottom: 5,
  },

  cardTitle: {
    color: "#f0f0f0",
    fontSize: isPhone ? 7.5 : 11,
    fontWeight: "700",
    lineHeight: isPhone ? 10 : 15,
  },

  cardMeta: {
    color: "#adb9ca",
    fontSize: isPhone ? 6.5 : 9,
    marginTop: 2,
    lineHeight: isPhone ? 9 : 13,
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
});
