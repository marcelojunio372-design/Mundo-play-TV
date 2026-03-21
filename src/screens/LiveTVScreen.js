import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  TextInput,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video, ResizeMode } from "expo-av";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

const FAVORITES_KEY = "mundoplaytv_live_favorites";
const RECENTS_KEY = "mundoplaytv_live_recents";
const CATEGORY_ROW_HEIGHT = isPhone ? 34 : 46;
const CHANNEL_ROW_HEIGHT = isPhone ? 38 : 48;

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getChannelStorageId(item = {}) {
  return safeText(item.id || item.url || item.name);
}

function buildCategories(channels = [], favorites = [], recents = []) {
  const groups = {};

  channels.forEach((item) => {
    const key = safeText(item.group || "OUTROS");
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return [
    { name: "Tudo", items: channels },
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

export default function LiveTVScreen({
  session,
  onOpenHome,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
}) {
  const channels = Array.isArray(session?.data?.live) ? session.data.live : [];

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedChannelIndex, setSelectedChannelIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [playerKey, setPlayerKey] = useState(0);
  const videoRef = useRef(null);

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

  const favoriteChannels = useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    return channels.filter((item) => favoriteSet.has(getChannelStorageId(item)));
  }, [channels, favoriteIds]);

  const recentChannels = useMemo(() => {
    const map = new Map(channels.map((item) => [getChannelStorageId(item), item]));
    return recentIds.map((id) => map.get(id)).filter(Boolean);
  }, [channels, recentIds]);

  const categories = useMemo(() => {
    return buildCategories(channels, favoriteChannels, recentChannels);
  }, [channels, favoriteChannels, recentChannels]);

  const baseChannels = categories[selectedCategory]?.items || channels;

  const visibleChannels = useMemo(() => {
    const term = safeText(search).toLowerCase();
    if (!term) return baseChannels;

    return baseChannels.filter((item) => {
      const name = safeText(item.name).toLowerCase();
      const group = safeText(item.group).toLowerCase();
      return name.includes(term) || group.includes(term);
    });
  }, [baseChannels, search]);

  useEffect(() => {
    if (selectedChannelIndex >= visibleChannels.length) {
      setSelectedChannelIndex(0);
    }
  }, [visibleChannels.length, selectedChannelIndex]);

  const selectedChannel =
    visibleChannels[selectedChannelIndex] || visibleChannels[0] || null;

  const selectedChannelId = getChannelStorageId(selectedChannel);

  const isFavorite = useMemo(() => {
    return favoriteIds.includes(selectedChannelId);
  }, [favoriteIds, selectedChannelId]);

  useEffect(() => {
    setPlayerKey((prev) => prev + 1);
  }, [selectedChannel?.url]);

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

  const addToRecent = async (channel) => {
    const id = getChannelStorageId(channel);
    if (!id) return;

    const updated = [id, ...recentIds.filter((item) => item !== id)].slice(0, 50);
    setRecentIds(updated);
    await persistRecents(updated);
  };

  const toggleFavorite = async () => {
    if (!selectedChannelId) return;

    let updated = [];

    if (favoriteIds.includes(selectedChannelId)) {
      updated = favoriteIds.filter((id) => id !== selectedChannelId);
    } else {
      updated = [selectedChannelId, ...favoriteIds];
    }

    setFavoriteIds(updated);
    await persistFavorites(updated);
  };

  const handleSelectCategory = (index) => {
    setSelectedCategory(index);
    setSelectedChannelIndex(0);
    setSearch("");
  };

  const handleSelectChannel = async (index) => {
    setSelectedChannelIndex(index);
    const item = visibleChannels[index];
    if (item) {
      await addToRecent(item);
    }
  };

  const reloadPlayer = async () => {
    try {
      await videoRef.current?.stopAsync?.();
    } catch (e) {}
    setPlayerKey((prev) => prev + 1);
  };

  const renderCategoryRow = ({ item, index }) => {
    const active = index === selectedCategory;

    return (
      <TouchableOpacity
        style={[styles.categoryRow, active && styles.categoryActive]}
        onPress={() => handleSelectCategory(index)}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.categoryText, active && styles.categoryTextActive]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <Text
          style={[styles.categoryCount, active && styles.categoryTextActive]}
        >
          {item.items.length}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChannelRow = ({ item, index }) => {
    const active = index === selectedChannelIndex;
    const rowFavorite = favoriteIds.includes(getChannelStorageId(item));

    return (
      <TouchableOpacity
        style={[styles.channelRow, active && styles.channelRowActive]}
        onPress={() => handleSelectChannel(index)}
        activeOpacity={0.8}
      >
        <View style={styles.channelNumberBox}>
          <Text style={styles.channelNumber}>{index + 1}</Text>
        </View>

        <View style={styles.channelTextWrap}>
          <Text
            style={[styles.channelName, active && styles.channelNameActive]}
            numberOfLines={1}
          >
            {rowFavorite ? "★ " : ""}
            {item.name || "Sem nome"}
          </Text>

          <Text style={styles.channelSub} numberOfLines={1}>
            {item.group || "Canal"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10163a" />

      <View style={styles.topnav}>
        <TouchableOpacity onPress={onOpenHome}>
          <Text style={styles.topLink}>Casa</Text>
        </TouchableOpacity>

        <Text style={styles.topSep}>|</Text>

        <TouchableOpacity onPress={onOpenLive}>
          <Text style={styles.topLinkActive}>TV ao Vivo</Text>
        </TouchableOpacity>

        <Text style={styles.topSep}>|</Text>

        <TouchableOpacity onPress={onOpenMovies}>
          <Text style={styles.topLink}>Filmes</Text>
        </TouchableOpacity>

        <Text style={styles.topSep}>|</Text>

        <TouchableOpacity onPress={onOpenSeries}>
          <Text style={styles.topLink}>Séries</Text>
        </TouchableOpacity>

        <View style={styles.searchWrap}>
          <TextInput
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setSelectedChannelIndex(0);
            }}
            placeholder="Buscar canal..."
            placeholderTextColor="#94a7bb"
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.leftPanel}>
          <FlatList
            data={categories}
            keyExtractor={(item, index) => `${item.name}_${index}`}
            renderItem={renderCategoryRow}
            getItemLayout={(_, index) => ({
              length: CATEGORY_ROW_HEIGHT,
              offset: CATEGORY_ROW_HEIGHT * index,
              index,
            })}
            initialNumToRender={18}
            maxToRenderPerBatch={18}
            windowSize={8}
            removeClippedSubviews
          />
        </View>

        <View style={styles.centerPanel}>
          <FlatList
            data={visibleChannels}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            renderItem={renderChannelRow}
            getItemLayout={(_, index) => ({
              length: CHANNEL_ROW_HEIGHT,
              offset: CHANNEL_ROW_HEIGHT * index,
              index,
            })}
            initialNumToRender={28}
            maxToRenderPerBatch={28}
            windowSize={10}
            removeClippedSubviews
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>Nenhum canal encontrado</Text>
              </View>
            }
          />
        </View>

        <View style={styles.rightPanel}>
          <View style={styles.previewBox}>
            {selectedChannel?.url ? (
              <Video
                key={`${selectedChannel.url}_${playerKey}`}
                ref={videoRef}
                source={{ uri: selectedChannel.url }}
                style={styles.previewVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                useNativeControls={false}
              />
            ) : (
              <View style={styles.previewEmpty}>
                <Text style={styles.previewEmptyText}>Sem sinal</Text>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>LIVE TV</Text>

            <Text style={styles.infoText}>
              Total de canais: {channels.length}
            </Text>

            <Text style={styles.infoText}>
              Categoria: {categories[selectedCategory]?.name || "-"}
            </Text>

            <Text style={styles.infoText}>
              Canal: {safeText(selectedChannel?.name) || "-"}
            </Text>

            <Text style={styles.infoText}>
              Grupo: {safeText(selectedChannel?.group) || "-"}
            </Text>

            <Text style={styles.infoText}>
              URL: {safeText(selectedChannel?.url) || "-"}
            </Text>

            <TouchableOpacity
              style={styles.favoriteBtnBig}
              onPress={toggleFavorite}
              activeOpacity={0.8}
            >
              <Text style={styles.favoriteBtnBigText}>
                {isFavorite ? "REMOVER FAVORITO" : "MARCAR FAVORITO"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={reloadPlayer}
              activeOpacity={0.8}
            >
              <Text style={styles.reloadBtnText}>RECARREGAR PLAYER</Text>
            </TouchableOpacity>

            <Text style={styles.infoDesc}>
              Player quadrado em modo leve só para testar a Live TV sem pesar o aplicativo.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a1031",
  },

  topnav: {
    height: isPhone ? 42 : 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#10163a",
  },

  topLink: {
    color: "#dbdbdb",
    fontSize: isPhone ? 10 : 14,
  },

  topLinkActive: {
    color: "#ffe24f",
    fontSize: isPhone ? 10 : 14,
    fontWeight: "900",
  },

  topSep: {
    color: "#98a5b5",
    marginHorizontal: 8,
    fontSize: isPhone ? 10 : 14,
  },

  searchWrap: {
    marginLeft: "auto",
    width: isPhone ? 100 : 180,
  },

  searchInput: {
    height: isPhone ? 28 : 36,
    borderRadius: 8,
    backgroundColor: "#1a224d",
    color: "#fff",
    paddingHorizontal: 10,
    fontSize: isPhone ? 9 : 12,
  },

  main: {
    flex: 1,
    flexDirection: "row",
  },

  leftPanel: {
    width: isPhone ? 108 : 220,
    backgroundColor: "#2a1530",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  categoryRow: {
    minHeight: isPhone ? 34 : 46,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  categoryActive: {
    backgroundColor: "rgba(255,226,79,0.12)",
  },

  categoryText: {
    color: "#f4f4f4",
    fontSize: isPhone ? 8 : 12,
    flex: 1,
    marginRight: 6,
  },

  categoryTextActive: {
    color: "#ffe24f",
    fontWeight: "900",
  },

  categoryCount: {
    color: "#f4f4f4",
    fontSize: isPhone ? 8 : 12,
  },

  centerPanel: {
    width: isPhone ? 130 : 260,
    backgroundColor: "#11183d",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  channelRow: {
    minHeight: isPhone ? 38 : 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  channelRowActive: {
    backgroundColor: "rgba(115,237,240,0.14)",
  },

  channelNumberBox: {
    width: isPhone ? 24 : 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  channelNumber: {
    color: "#f2f2f2",
    fontSize: isPhone ? 7 : 10,
    fontWeight: "900",
  },

  channelTextWrap: {
    flex: 1,
  },

  channelName: {
    color: "#fff",
    fontSize: isPhone ? 7.5 : 11,
    fontWeight: "800",
  },

  channelNameActive: {
    color: "#9efcff",
  },

  channelSub: {
    color: "#c6d2e8",
    fontSize: isPhone ? 6 : 9,
    marginTop: 1,
  },

  emptyList: {
    flex: 1,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyListText: {
    color: "#cfd7e2",
    fontSize: isPhone ? 9 : 12,
    textAlign: "center",
  },

  rightPanel: {
    flex: 1,
    backgroundColor: "#0b1338",
    padding: isPhone ? 8 : 12,
  },

  previewBox: {
    width: isPhone ? 140 : 260,
    height: isPhone ? 140 : 260,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 10,
    alignSelf: "center",
  },

  previewVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  previewEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },

  previewEmptyText: {
    color: "#c8d4e2",
    fontSize: isPhone ? 9 : 12,
  },

  infoCard: {
    flex: 1,
    backgroundColor: "#10183f",
    borderRadius: 8,
    padding: isPhone ? 10 : 14,
  },

  infoTitle: {
    color: "#38d7ff",
    fontSize: isPhone ? 11 : 16,
    fontWeight: "900",
    marginBottom: 10,
  },

  infoText: {
    color: "#e1e8f0",
    fontSize: isPhone ? 9 : 12,
    marginBottom: 6,
  },

  infoDesc: {
    color: "#c4d1df",
    fontSize: isPhone ? 9 : 12,
    lineHeight: isPhone ? 14 : 18,
    marginTop: 14,
  },

  favoriteBtnBig: {
    height: isPhone ? 38 : 44,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "rgba(56,215,255,0.10)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  favoriteBtnBigText: {
    color: "#38d7ff",
    fontSize: isPhone ? 9 : 12,
    fontWeight: "900",
  },

  reloadBtn: {
    height: isPhone ? 38 : 44,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "rgba(255,224,79,0.10)",
    borderWidth: 1,
    borderColor: "#ffe24f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  reloadBtnText: {
    color: "#ffe24f",
    fontSize: isPhone ? 9 : 12,
    fontWeight: "900",
  },
});
