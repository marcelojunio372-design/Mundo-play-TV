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
import { Video, ResizeMode } from "expo-av";
import {
  buildLiveStreamUrl,
  loadM3UAll,
  loadShortEpg,
  loadXtreamContent,
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

export default function LiveTVScreen({ route, navigation }) {
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);
  const [epgList, setEpgList] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    loadLive();
  }, []);

  async function refreshFavorites() {
    const favs = await getFavorites();
    const ids = favs
      .filter((x) => x?.section === "live")
      .map((x) => `live:${x?.id}`);
    setFavoriteIds(ids);
  }

  async function loadLive() {
    try {
      setLoading(true);

      let loaded = [];
      if (loginType === "xtream") {
        loaded = await loadXtreamPreview(server, username, password, "live", 150);
      } else {
        const all = await loadM3UAll(m3uUrl);
        loaded = filterM3UBySection(all, "live").slice(0, 150);
      }

      setSourceItems(loaded);
      setItems(loaded);
      await refreshFavorites();
    } catch (e) {
      Alert.alert("Erro", e?.message || "Falha ao carregar Live TV.");
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
        setItems(favs.filter((x) => x?.section === "live"));
      } else if (nextMode === "recent") {
        const history = await getHistory();
        setItems(getRecentItemsBySection(history, "live"));
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

  async function openMiniPlayer(item) {
    setSelectedItem(item);
    setMiniPlayerVisible(true);
    await addToHistory(item, "live");

    if (loginType === "xtream" && item?.raw?.stream_id) {
      try {
        const epg = await loadShortEpg(
          server,
          username,
          password,
          item.raw.stream_id
        );
        setEpgList(epg);
      } catch {
        setEpgList([]);
      }
    } else {
      setEpgList([]);
    }
  }

  async function handleToggleFavorite(item) {
    await toggleFavorite(item, "live");
    await refreshFavorites();
  }

  function isFavorite(item) {
    return favoriteIds.includes(`live:${item?.id}`);
  }

  function fullScreen() {
    if (!selectedItem) return;

    navigation.navigate("Player", {
      ...params,
      item: selectedItem,
      section: "live",
      autoPlay: true,
    });
  }

  function renderItem({ item }) {
    const fav = isFavorite(item);

    return (
      <TouchableOpacity style={styles.card} onPress={() => openMiniPlayer(item)}>
        {item?.logo ? (
          <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="cover" />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Text style={styles.logoFallbackText}>TV</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item?.name || "Canal"}
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

  const miniUrl = selectedItem
    ? loginType === "xtream"
      ? buildLiveStreamUrl(server, username, password, selectedItem)
      : selectedItem?.url || ""
    : "";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live TV</Text>
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
        placeholder="Buscar canal"
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

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#18e7a1" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item?.id || index}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 220 }}
        />
      )}

      {miniPlayerVisible && selectedItem && !!miniUrl && (
        <View style={styles.miniPlayer}>
          <View style={styles.miniHeader}>
            <Text style={styles.miniTitle} numberOfLines={1}>
              {selectedItem?.name || "Canal"}
            </Text>

            <TouchableOpacity onPress={() => setMiniPlayerVisible(false)}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.videoWrap}>
            <Video
              source={{ uri: miniUrl }}
              style={styles.video}
              shouldPlay
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
          </View>

          <View style={styles.epgBox}>
            <Text style={styles.epgTitle}>EPG</Text>
            {epgList.length > 0 ? (
              epgList.slice(0, 3).map((epg, idx) => (
                <Text key={idx} style={styles.epgText} numberOfLines={1}>
                  {epg?.title || epg?.programme_title || "Programa"}
                </Text>
              ))
            ) : (
              <Text style={styles.epgText}>Sem EPG disponível</Text>
            )}
          </View>

          <TouchableOpacity style={styles.fullBtn} onPress={fullScreen}>
            <Text style={styles.fullBtnText}>Tela cheia</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = {
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
    height: 58,
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
  miniPlayer: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: "#1d0b2f",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  miniHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  miniTitle: {
    flex: 1,
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  closeText: {
    color: "#18e7a1",
    fontWeight: "800",
  },
  videoWrap: {
    height: 170,
    backgroundColor: "#000",
    borderRadius: 14,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  epgBox: {
    marginTop: 10,
  },
  epgTitle: {
    color: "#fff",
    fontWeight: "800",
    marginBottom: 4,
  },
  epgText: {
    color: "#d6d6d6",
    marginBottom: 3,
  },
  fullBtn: {
    backgroundColor: "#18e7a1",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  fullBtnText: {
    color: "#111",
    fontWeight: "800",
  },
};
