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
  Dimensions,
} from "react-native";
import {
  loadM3UAll,
  loadXtreamContent,
  getRecentItemsBySection,
  filterM3UBySection,
} from "../utils/iptv";
import {
  addToHistory,
  getFavorites,
  getHistory,
  toggleFavorite,
} from "../utils/storage";

const { width } = Dimensions.get("window");
const LEFT_W = Math.max(250, width * 0.27);
const GRID_COLS = width > 900 ? 4 : 3;

export default function SeriesScreen({ route, navigation }) {
  const params = route?.params || {};
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const m3uUrl = params?.m3uUrl || "";

  const [allItems, setAllItems] = useState([]);
  const [gridItems, setGridItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("TODOS OS CANAIS");
  const [leftMode, setLeftMode] = useState("categories");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [allItems, selectedCategory, search, leftMode]);

  async function init() {
    try {
      setLoading(true);

      let loaded = [];
      if (loginType === "xtream") {
        loaded = await loadXtreamContent(server, username, password, "series");
      } else {
        const all = await loadM3UAll(m3uUrl);
        loaded = filterM3UBySection(all, "series");
      }

      setAllItems(loaded);

      const favs = await getFavorites();
      setFavoriteIds(favs.filter((x) => x?.section === "series").map((x) => `series:${x?.id}`));
    } finally {
      setLoading(false);
    }
  }

  async function refreshFavorites() {
    const favs = await getFavorites();
    setFavoriteIds(favs.filter((x) => x?.section === "series").map((x) => `series:${x?.id}`));
  }

  async function applyFilter() {
    let base = allItems;

    if (leftMode === "favorites") {
      const favs = await getFavorites();
      base = favs.filter((x) => x?.section === "series");
    } else if (leftMode === "recent") {
      const hist = await getHistory();
      base = getRecentItemsBySection(hist, "series");
    } else if (selectedCategory !== "TODOS OS CANAIS") {
      base = allItems.filter((x) => (x?.category || "").toUpperCase() === selectedCategory);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      base = base.filter((x) => String(x?.name || "").toLowerCase().includes(q));
    }

    setGridItems(base);
    if (base.length && !selectedSeries) {
      pickSeries(base[0]);
    }
  }

  const categories = useMemo(() => {
    const map = {};
    allItems.forEach((item) => {
      const key = String(item?.category || "GERAL").toUpperCase();
      map[key] = (map[key] || 0) + 1;
    });

    const arr = Object.keys(map)
      .sort()
      .map((name) => ({ name, count: map[name] }));

    return [
      { name: "TODOS OS CANAIS", count: allItems.length },
      { name: "FAVORITOS", count: favoriteIds.length },
      { name: "RECENTEMENTE VISTO", count: 0 },
      ...arr,
    ];
  }, [allItems, favoriteIds]);

  async function pickSeries(item) {
    setSelectedSeries(item);
    await addToHistory(item, "series");
  }

  async function onCategoryPress(cat) {
    if (cat === "FAVORITOS") {
      setLeftMode("favorites");
      setSelectedCategory("FAVORITOS");
      return;
    }

    if (cat === "RECENTEMENTE VISTO") {
      setLeftMode("recent");
      setSelectedCategory("RECENTEMENTE VISTO");
      return;
    }

    setLeftMode("categories");
    setSelectedCategory(cat);
  }

  async function onToggleFavorite(item) {
    await toggleFavorite(item, "series");
    await refreshFavorites();
  }

  function isFavorite(item) {
    return favoriteIds.includes(`series:${item?.id}`);
  }

  function openSeries(item) {
    navigation.navigate("Player", {
      ...params,
      item,
      section: "series",
    });
  }

  function renderCategory({ item }) {
    const active = selectedCategory === item.name;
    return (
      <TouchableOpacity
        style={[styles.leftItem, active && styles.leftItemActive]}
        onPress={() => onCategoryPress(item.name)}
      >
        <Text style={[styles.leftItemText, active && styles.leftItemTextActive]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.leftCount, active && styles.leftItemTextActive]}>
          {item.count}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderPoster({ item }) {
    const active = selectedSeries?.id === item?.id;
    return (
      <TouchableOpacity
        style={[styles.posterCard, active && styles.posterCardActive]}
        onPress={() => pickSeries(item)}
        onLongPress={() => openSeries(item)}
      >
        {item?.logo ? (
          <Image source={{ uri: item.logo }} style={styles.posterImage} resizeMode="cover" />
        ) : (
          <View style={[styles.posterImage, styles.posterFallback]}>
            <Text style={styles.posterFallbackText}>SÉRIE</Text>
          </View>
        )}

        <View style={styles.posterOverlay}>
          <Text style={styles.posterTitle} numberOfLines={2}>
            {item?.name || "Série"}
          </Text>
        </View>

        <TouchableOpacity style={styles.posterStar} onPress={() => onToggleFavorite(item)}>
          <Text style={styles.posterStarText}>{isFavorite(item) ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.searchWrap}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisa em categorias"
            placeholderTextColor="#bfc6ff"
            style={styles.searchInput}
          />
        </View>

        <Text style={styles.headerTitle}>Séries</Text>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#7ef7ef" />
        </View>
      ) : (
        <View style={styles.layout}>
          <View style={styles.leftPane}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.name}
              renderItem={renderCategory}
            />
          </View>

          <View style={styles.rightPane}>
            {selectedSeries && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>{selectedSeries?.name}</Text>
                <Text style={styles.summarySub}>{selectedSeries?.category || "GERAL"}</Text>
                <Text style={styles.summaryText} numberOfLines={3}>
                  {selectedSeries?.plot || "Sem resumo disponível."}
                </Text>

                <TouchableOpacity style={styles.watchBtn} onPress={() => openSeries(selectedSeries)}>
                  <Text style={styles.watchBtnText}>TEMPORADAS</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={gridItems}
              keyExtractor={(item, index) => `${item?.id || index}`}
              renderItem={renderPoster}
              numColumns={GRID_COLS}
              contentContainerStyle={{ paddingBottom: 30 }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const posterGap = 10;
const posterWidth = ((width - LEFT_W - 44) / GRID_COLS) - posterGap;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#151d63",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#c9f7ff",
    fontSize: 34,
    fontWeight: "300",
  },
  searchWrap: {
    width: LEFT_W - 30,
    marginRight: 12,
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
  },
  headerTitle: {
    color: "#d8e2ff",
    fontSize: 28,
    fontWeight: "900",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  layout: {
    flex: 1,
    flexDirection: "row",
  },
  leftPane: {
    width: LEFT_W,
    paddingHorizontal: 10,
    paddingBottom: 14,
  },
  rightPane: {
    flex: 1,
    paddingRight: 12,
    paddingBottom: 14,
  },
  leftItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  leftItemActive: {
    backgroundColor: "#8cf7f0",
    borderRadius: 8,
  },
  leftItemText: {
    flex: 1,
    color: "#d7e7ff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  leftItemTextActive: {
    color: "#111",
  },
  leftCount: {
    color: "#d7e7ff",
    fontSize: 18,
    fontWeight: "800",
  },
  summaryBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  summarySub: {
    color: "#8cf7f0",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryText: {
    color: "#dbe7ff",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  watchBtn: {
    backgroundColor: "#8cf7f0",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  watchBtnText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 18,
  },
  posterCard: {
    width: posterWidth,
    marginRight: 10,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  posterCardActive: {
    borderWidth: 2,
    borderColor: "#8cf7f0",
  },
  posterImage: {
    width: "100%",
    height: posterWidth * 1.45,
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2b2b2b",
  },
  posterFallbackText: {
    color: "#fff",
    fontWeight: "900",
  },
  posterOverlay: {
    padding: 8,
  },
  posterTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  posterStar: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  posterStarText: {
    color: "#fff",
    fontSize: 16,
  },
});
