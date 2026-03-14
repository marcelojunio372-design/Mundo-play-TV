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
import { Video, ResizeMode } from "expo-av";
import {
  buildLiveStreamUrl,
  loadM3UAll,
  loadShortEpg,
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

export default function LiveTVScreen({ route, navigation }) {
  const params = route?.params || {};
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const m3uUrl = params?.m3uUrl || "";

  const [allItems, setAllItems] = useState([]);
  const [leftMode, setLeftMode] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState("TODOS OS CANAIS");
  const [search, setSearch] = useState("");
  const [channelList, setChannelList] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [epgList, setEpgList] = useState([]);
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
        loaded = await loadXtreamContent(server, username, password, "live");
      } else {
        const all = await loadM3UAll(m3uUrl);
        loaded = filterM3UBySection(all, "live");
      }

      setAllItems(loaded);

      const favs = await getFavorites();
      setFavoriteIds(favs.filter((x) => x?.section === "live").map((x) => `live:${x?.id}`));
    } finally {
      setLoading(false);
    }
  }

  async function refreshFavorites() {
    const favs = await getFavorites();
    setFavoriteIds(favs.filter((x) => x?.section === "live").map((x) => `live:${x?.id}`));
  }

  async function applyFilter() {
    let base = allItems;

    if (leftMode === "favorites") {
      const favs = await getFavorites();
      base = favs.filter((x) => x?.section === "live");
    } else if (leftMode === "recent") {
      const hist = await getHistory();
      base = getRecentItemsBySection(hist, "live");
    } else if (selectedCategory !== "TODOS OS CANAIS") {
      base = allItems.filter((x) => (x?.category || "").toUpperCase() === selectedCategory);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      base = base.filter((x) => String(x?.name || "").toLowerCase().includes(q));
    }

    setChannelList(base);
    if (base.length && !selectedChannel) {
      pickChannel(base[0]);
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

  async function pickChannel(item) {
    setSelectedChannel(item);
    await addToHistory(item, "live");

    if (loginType === "xtream" && item?.raw?.stream_id) {
      try {
        const epg = await loadShortEpg(server, username, password, item.raw.stream_id);
        setEpgList(epg);
      } catch {
        setEpgList([]);
      }
    } else {
      setEpgList([]);
    }
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
    await toggleFavorite(item, "live");
    await refreshFavorites();
  }

  function isFavorite(item) {
    return favoriteIds.includes(`live:${item?.id}`);
  }

  function openFullPlayer() {
    if (!selectedChannel) return;

    navigation.navigate("Player", {
      ...params,
      item: selectedChannel,
      section: "live",
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

  function renderChannel({ item }) {
    const active = selectedChannel?.id === item?.id;
    return (
      <TouchableOpacity style={[styles.midItem, active && styles.midItemActive]} onPress={() => pickChannel(item)}>
        {item?.logo ? (
          <Image source={{ uri: item.logo }} style={styles.midLogo} resizeMode="contain" />
        ) : (
          <View style={[styles.midLogo, styles.midLogoFallback]}>
            <Text style={styles.midLogoText}>TV</Text>
          </View>
        )}

        <View style={styles.midInfo}>
          <Text style={styles.midName} numberOfLines={1}>
            {item?.name || "Canal"}
          </Text>
          <Text style={styles.midSubtitle} numberOfLines={1}>
            {epgList[0]?.title || epgList[0]?.programme_title || item?.category || "Sem programa"}
          </Text>
        </View>

        <TouchableOpacity onPress={() => onToggleFavorite(item)}>
          <Text style={styles.star}>{isFavorite(item) ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  const previewUrl =
    selectedChannel &&
    (loginType === "xtream"
      ? buildLiveStreamUrl(server, username, password, selectedChannel)
      : selectedChannel?.url || "");

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

        <Text style={styles.headerTitle}>Ao vivo</Text>
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

          <View style={styles.middlePane}>
            <FlatList
              data={channelList}
              keyExtractor={(item, index) => `${item?.id || index}`}
              renderItem={renderChannel}
            />
          </View>

          <View style={styles.rightPane}>
            <View style={styles.previewBox}>
              {previewUrl ? (
                <Video
                  source={{ uri: previewUrl }}
                  style={styles.previewVideo}
                  shouldPlay
                  isMuted
                  resizeMode={ResizeMode.CONTAIN}
                />
              ) : (
                <View style={styles.previewFallback}>
                  <Text style={styles.previewFallbackText}>Pressione "OK" para jogar</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.playBtn} onPress={openFullPlayer}>
              <Text style={styles.playBtnText}>OK / Tela cheia</Text>
            </TouchableOpacity>

            <View style={styles.epgPanel}>
              {(epgList.length ? epgList : [{ title: "Nenhum programa encontrado" }]).slice(0, 5).map((epg, idx) => (
                <Text key={idx} style={styles.epgText}>
                  {(epg?.start || "") + (epg?.start ? " - " : "")}
                  {epg?.title || epg?.programme_title || "Programa"}
                </Text>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const leftWidth = Math.max(240, width * 0.27);
const midWidth = Math.max(300, width * 0.34);

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
    width: leftWidth - 30,
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
    color: "#c9f7ff",
    fontSize: 22,
    fontWeight: "800",
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
    width: leftWidth,
    paddingHorizontal: 10,
    paddingBottom: 14,
  },
  middlePane: {
    width: midWidth,
    paddingRight: 10,
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
  midItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  midItemActive: {
    backgroundColor: "rgba(140,247,240,0.22)",
    borderRadius: 10,
  },
  midLogo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  midLogoFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 8,
  },
  midLogoText: {
    color: "#fff",
    fontWeight: "900",
  },
  midInfo: {
    flex: 1,
  },
  midName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  midSubtitle: {
    color: "#d6e0ff",
    fontSize: 16,
    marginTop: 2,
  },
  star: {
    color: "#fff",
    fontSize: 24,
    marginLeft: 8,
  },
  previewBox: {
    height: 250,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
  },
  previewVideo: {
    width: "100%",
    height: "100%",
  },
  previewFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewFallbackText: {
    color: "#dbe7ff",
    fontSize: 18,
  },
  playBtn: {
    backgroundColor: "#8cf7f0",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  playBtnText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 18,
  },
  epgPanel: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
  },
  epgText: {
    color: "#dbe7ff",
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
});
