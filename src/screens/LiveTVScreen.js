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
  Modal,
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
  const [fullscreenKey, setFullscreenKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreenPaused, setIsFullscreenPaused] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);

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
    setFullscreenKey((prev) => prev + 1);
    setIsPaused(false);
    setIsFullscreenPaused(false);
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
    setIsPaused(false);
  };

  const togglePauseMain = async () => {
    try {
      if (isPaused) {
        await videoRef.current?.playAsync?.();
        setIsPaused(false);
      } else {
        await videoRef.current?.pauseAsync?.();
        setIsPaused(true);
      }
    } catch (e) {}
  };

  const togglePauseFullscreen = async () => {
    try {
      if (isFullscreenPaused) {
        await fullscreenVideoRef.current?.playAsync?.();
        setIsFullscreenPaused(false);
      } else {
        await fullscreenVideoRef.current?.pauseAsync?.();
        setIsFullscreenPaused(true);
      }
    } catch (e) {}
  };

  const goToPreviousChannel = async () => {
    if (!visibleChannels.length) return;
    const nextIndex =
      selectedChannelIndex <= 0 ? visibleChannels.length - 1 : selectedChannelIndex - 1;
    await handleSelectChannel(nextIndex);
  };

  const goToNextChannel = async () => {
    if (!visibleChannels.length) return;
    const nextIndex =
      selectedChannelIndex >= visibleChannels.length - 1 ? 0 : selectedChannelIndex + 1;
    await handleSelectChannel(nextIndex);
  };

  const openFullscreen = async () => {
    if (!selectedChannel?.url) return;
    await addToRecent(selectedChannel);
    setFullscreenKey((prev) => prev + 1);
    setIsFullscreenPaused(false);
    setShowFullscreen(true);
  };

  const closeFullscreen = async () => {
    try {
      await fullscreenVideoRef.current?.stopAsync?.();
    } catch (e) {}
    setShowFullscreen(false);
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
          <TouchableOpacity
            style={styles.previewBox}
            activeOpacity={0.92}
            onPress={openFullscreen}
          >
            {selectedChannel?.url ? (
              <Video
                key={`${selectedChannel.url}_${playerKey}`}
                ref={videoRef}
                source={{ uri: selectedChannel.url }}
                style={styles.previewVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay={!isPaused}
                isLooping
                useNativeControls={false}
              />
            ) : (
              <View style={styles.previewEmpty}>
                <Text style={styles.previewEmptyText}>Sem sinal</Text>
              </View>
            )}

            <View style={styles.previewOverlay}>
              <View style={styles.previewTopRow}>
                <TouchableOpacity
                  style={styles.overlayBtnTop}
                  onPress={onOpenHome}
                  activeOpacity={0.8}
                >
                  <Text style={styles.overlayBtnText}>VOLTAR</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.previewBottomRow}>
                <TouchableOpacity
                  style={styles.overlayBtn}
                  onPress={goToPreviousChannel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.overlayBtnText}>◀</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.overlayBtn}
                  onPress={togglePauseMain}
                  activeOpacity={0.8}
                >
                  <Text style={styles.overlayBtnText}>
                    {isPaused ? "PLAY" : "PAUSE"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.overlayBtn}
                  onPress={goToNextChannel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.overlayBtnText}>▶</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.overlayBtn}
                  onPress={toggleFavorite}
                  activeOpacity={0.8}
                >
                  <Text style={styles.overlayBtnText}>
                    {isFavorite ? "★" : "☆"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.overlayBtn}
                  onPress={reloadPlayer}
                  activeOpacity={0.8}
                >
                  <Text style={styles.overlayBtnText}>↻</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.overlayBtn}
                  onPress={openFullscreen}
                  activeOpacity={0.8}
                >
                  <Text style={styles.overlayBtnText}>⛶</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

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

            <Text style={styles.infoDesc}>
              Botão voltar em cima e os demais controles embaixo, como você pediu.
            </Text>
          </View>
        </View>
      </View>

      <Modal
        visible={showFullscreen}
        animationType="fade"
        transparent={false}
        onRequestClose={closeFullscreen}
      >
        <SafeAreaView style={styles.fullscreenContainer}>
          {selectedChannel?.url ? (
            <Video
              key={`${selectedChannel.url}_${fullscreenKey}_fullscreen`}
              ref={fullscreenVideoRef}
              source={{ uri: selectedChannel.url }}
              style={styles.fullscreenVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={!isFullscreenPaused}
              isLooping
              useNativeControls={false}
            />
          ) : (
            <View style={styles.previewEmpty}>
              <Text style={styles.previewEmptyText}>Sem sinal</Text>
            </View>
          )}

          <View style={styles.fullscreenTopBar}>
            <TouchableOpacity
              style={styles.fullscreenBackBtn}
              onPress={closeFullscreen}
              activeOpacity={0.8}
            >
              <Text style={styles.fullscreenBackText}>VOLTAR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fullscreenBottomBar}>
            <TouchableOpacity
              style={styles.fullscreenBtn}
              onPress={goToPreviousChannel}
              activeOpacity={0.8}
            >
              <Text style={styles.fullscreenBtnText}>◀</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fullscreenBtn}
              onPress={togglePauseFullscreen}
              activeOpacity={0.8}
            >
              <Text style={styles.fullscreenBtnText}>
                {isFullscreenPaused ? "PLAY" : "PAUSE"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fullscreenBtn}
              onPress={goToNextChannel}
              activeOpacity={0.8}
            >
              <Text style={styles.fullscreenBtnText}>▶</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fullscreenBtn}
              onPress={toggleFavorite}
              activeOpacity={0.8}
            >
              <Text style={styles.fullscreenBtnText}>
                {isFavorite ? "★" : "☆"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
    width: isPhone ? 240 : 320,
    height: isPhone ? 240 : 320,
    borderRadius: 12,
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

  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 8,
  },

  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  previewBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    padding: 6,
  },

  overlayBtnTop: {
    minWidth: isPhone ? 70 : 86,
    height: isPhone ? 32 : 36,
    borderRadius: 8,
    backgroundColor: "rgba(16,24,63,0.88)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  overlayBtn: {
    minWidth: isPhone ? 38 : 46,
    height: isPhone ? 32 : 36,
    borderRadius: 8,
    backgroundColor: "rgba(16,24,63,0.88)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginHorizontal: 2,
  },

  overlayBtnText: {
    color: "#38d7ff",
    fontSize: isPhone ? 8 : 10,
    fontWeight: "900",
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

  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },

  fullscreenTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: isPhone ? 18 : 24,
    paddingHorizontal: 10,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  fullscreenBackBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(16,32,51,0.88)",
  },

  fullscreenBackText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: 12,
  },

  fullscreenBottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  fullscreenBtn: {
    minWidth: isPhone ? 58 : 74,
    height: isPhone ? 34 : 38,
    borderRadius: 8,
    backgroundColor: "rgba(7,20,35,0.90)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },

  fullscreenBtnText: {
    color: "#38d7ff",
    fontSize: isPhone ? 8 : 10,
    fontWeight: "900",
  },
});
