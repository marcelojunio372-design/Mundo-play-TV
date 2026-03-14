import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import {
  loadM3UAll,
  loadXtreamPreview,
  getRecentItemsBySection,
  filterM3UBySection,
} from "../utils/iptv";
import {
  addToHistory,
  getFavorites,
  getHistory,
  toggleFavorite,
} from "../utils/storage";

export default function MoviesScreen({ route, navigation }) {
  const params = route?.params || {};
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const m3uUrl = params?.m3uUrl || "";

  const [items, setItems] = useState([]);
  const [sourceItems, setSourceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [mode, setMode] = useState("all");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    loadMovies();
  }, []);

  async function refreshFavorites() {
    const favs = await getFavorites();
    const ids = favs
      .filter((x) => x?.section === "vod")
      .map((x) => `vod:${x?.id}`);
    setFavoriteIds(ids);
  }

  async function loadMovies() {
    try {
      setLoading(true);

      let loaded = [];
      if (loginType === "xtream") {
        loaded = await loadXtreamPreview(server, username, password, "vod", 150);
      } else {
        const all = await loadM3UAll(m3uUrl);
        loaded = filterM3UBySection(all, "vod").slice(0, 150);
      }

      setSourceItems(loaded);
      setItems(loaded);
      setSelectedMovie(loaded[0] || null);
      await refreshFavorites();
    } catch (e) {
      Alert.alert("Erro", e?.message || "Falha ao carregar filmes.");
    } finally {
      setLoading(false);
    }
  }

  async function applyMode(nextMode) {
    try {
      setLoading(true);
      setMode(nextMode);
      setSelectedCategory("Todas");

      if (nextMode === "all") {
        setItems(sourceItems);
      } else if (nextMode === "favorites") {
        const favs = await getFavorites();
        const filtered = favs.filter((x) => x?.section === "vod");
        setItems(filtered);
        setSelectedMovie(filtered[0] || null);
      } else if (nextMode === "recent") {
        const history = await getHistory();
        const filtered = getRecentItemsBySection(history, "vod");
        setItems(filtered);
        setSelectedMovie(filtered[0] || null);
      }
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set(["Todas"]);
    items.forEach((item) => {
      if (item?.category) set.add(String(item.category));
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedCategory !== "Todas") {
      result = result.filter(
        (item) => String(item?.category || "") === selectedCategory
      );
    }

    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter((item) =>
      String(item?.name || "").toLowerCase().includes(q)
    );
  }, [items, search, selectedCategory]);

  async function selectMovie(item) {
    setSelectedMovie(item);
    await addToHistory(item, "vod");
  }

  async function handleToggleFavorite(item) {
    await toggleFavorite(item, "vod");
    await refreshFavorites();
  }

  function isFavorite(item) {
    return favoriteIds.includes(`vod:${item?.id}`);
  }

  function playMovie() {
    if (!selectedMovie) return;

    navigation.navigate("Player", {
      ...params,
      item: selectedMovie,
      section: "vod",
      autoPlay: true,
    });
  }

  function renderItem({ item }) {
    const fav = isFavorite(item);

    return (
      <TouchableOpacity style={styles.card} onPress={() => selectMovie(item)}>
        {item?.logo ? (
          <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="cover" />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Text style={styles.logoFallbackText}>FILME</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item?.name || "Filme"}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {item?.category || "Geral"}
          </Text>
        </View>

        <TouchableOpacity style={styles.favButton} onPress={() => handleToggleFavorite(item)}>
          <Text style={styles.favButtonText}>{fav ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Filmes</Text>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "all" && styles.modeBtnActive]}
          onPress={() => applyMode("all")}
        >
          <Text style={[styles.modeBtnText, mode === "all" && styles.modeBtnTextActive]}>
            Categorias
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, mode === "favorites" && styles.modeBtnActive]}
          onPress={() => applyMode("favorites")}
        >
          <Text style={[styles.modeBtnText, mode === "favorites" && styles.modeBtnTextActive]}>
            Favoritos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, mode === "recent" && styles.modeBtnActive]}
          onPress={() => applyMode("recent")}
        >
          <Text style={[styles.modeBtnText, mode === "recent" && styles.modeBtnTextActive]}>
            Visto por último
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar filme"
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryBar}
        contentContainerStyle={styles.categoryBarContent}
      >
        {categories.map((cat) => {
          const active = cat === selectedCategory;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  active && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedMovie && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{selectedMovie?.name || "Filme"}</Text>
          <Text style={styles.summaryCategory}>
            {selectedMovie?.category || "Geral"}
          </Text>
          <Text style={styles.summaryText}>
            {selectedMovie?.plot || "Sem resumo disponível para este filme."}
          </Text>

          <TouchableOpacity style={styles.playBtn} onPress={playMovie}>
            <Text style={styles.playBtnText}>Assistir</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#18e7a1" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item?.id || index}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
    paddingHorizontal: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    backgroundColor: "#18e7a1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#111",
    fontWeight: "800",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginLeft: 12,
  },
  modeRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  modeBtn: {
    backgroundColor: "#291041",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  modeBtnActive: {
    backgroundColor: "#18e7a1",
  },
  modeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  modeBtnTextActive: {
    color: "#111",
  },
  search: {
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  categoryBar: {
    marginBottom: 10,
  },
  categoryBarContent: {
    paddingRight: 20,
  },
  categoryChip: {
    backgroundColor: "#291041",
    marginRight: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: "#18e7a1",
  },
  categoryChipText: {
    color: "#fff",
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: "#111",
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  summaryCategory: {
    color: "#18e7a1",
    marginTop: 4,
    fontWeight: "700",
  },
  summaryText: {
    color: "#d8d8d8",
    marginTop: 10,
    lineHeight: 22,
  },
  playBtn: {
    backgroundColor: "#18e7a1",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },
  playBtnText: {
    color: "#111",
    fontWeight: "800",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  logo: {
    width: 58,
    height: 82,
    borderRadius: 10,
    backgroundColor: "#2b2b2b",
  },
  logoFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 10,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  category: {
    color: "#bdbdbd",
    marginTop: 4,
  },
  favButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#2a1141",
    alignItems: "center",
    justifyContent: "center",
  },
  favButtonText: {
    color: "#fff",
    fontSize: 22,
  },
});
