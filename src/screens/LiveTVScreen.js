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
import {
  loadEPG,
  findNowAndNextForChannel,
  formatProgramTime,
} from "../services/epgService";

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
  const [epgItems, setEpgItems] = useState([]);
  const [epgLoading, setEpgLoading] = useState(false);

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

  useEffect(() => {
    let active = true;

    async function fetchEpgData() {
      try {
        setEpgLoading(true);
        const items = await loadEPG(session);
        if (active) {
          setEpgItems(Array.isArray(items) ? items : []);
        }
      } catch (e) {
        if (active) {
          setEpgItems([]);
        }
      } finally {
        if (active) {
          setEpgLoading(false);
        }
      }
    }

    fetchEpgData();

    return () => {
      active = false;
    };
  }, [session]);

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

  const { nowProgram, nextProgram } = useMemo(() => {
    if (!selectedChannel) {
      return { nowProgram: null, nextProgram: null };
    }

    return findNowAndNextForChannel(
      epgItems,
      safeText(selectedChannel.name),
      safeText(selectedChannel.group),
      safeText(selectedChannel.tvgId),
      safeText(selectedChannel.tvgName || selectedChannel.name)
    );
  }, [epgItems, selectedChannel]);

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
        <Text style={styles.channelNumber}>{index + 1}</Text>

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
      <StatusBar barStyle="light-content" backgroundColor="#090c18" />

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
            placeholderTextColor="#c2c6d2"
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
          </TouchableOpacity>

          <View style={styles.infoPanel}>
            <Text style={styles.channelTitle}>
              {safeText(selectedChannel?.name) || "Sem canal"}
            </Text>

            <Text style={styles.epgTime}>
              {nowProgram ? formatProgramTime(nowProgram) : "Sem horário atual"}
            </Text>

            <Text style={styles.epgCurrent} numberOfLines={2}>
              {nowProgram?.title ||
                (epgLoading
                  ? "Carregando EPG..."
                  : "Programação atual não encontrada")}
            </Text>

            <Text style={styles.epgNextLabel}>Próximo</Text>

            <Text style={styles.epgNext} numberOfLines={2}>
              {nextProgram?.title || "Sem próximo programa"}
            </Text>

            <Text style={styles.epgNextTime}>
              {nextProgram ? formatProgramTime(nextProgram) : ""}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={openFullscreen}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>ABRIR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={toggleFavorite}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>
                  {isFavorite ? "FAVORITO ✓" : "FAVORITO"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={togglePauseMain}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>
                  {isPaused ? "PLAY" : "PAUSE"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.smallButtonRow}>
              <TouchableOpacity
                style={styles.smallActionBtn}
                onPress={goToPreviousChannel}
                activeOpacity={0.8}
              >
                <Text style={styles.smallActionBtnText}>◀</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallActionBtn}
                onPress={goToNextChannel}
                activeOpacity={0.8}
              >
                <Text style={styles.smallActionBtnText}>▶</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallActionBtn}
                onPress={onOpenHome}
                activeOpacity={0.8}
              >
                <Text style={styles.smallActionBtnText}>VOLTAR</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: "#050814",
  },

  topnav: {
    height: isPhone ? 42 : 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#050814",
  },

  topLink: {
    color: "#d7d7d7",
    fontSize: isPhone ? 10 : 14,
  },

  topLinkActive: {
    color: "#f3df58",
    fontSize: isPhone ? 10 : 14,
    fontWeight: "900",
  },

  topSep: {
    color: "#c8c8c8",
    marginHorizontal: 8,
    fontSize: isPhone ? 10 : 14,
  },

  searchWrap: {
    marginLeft: "auto",
    width: isPhone ? 120 : 220,
  },

  searchInput: {
    height: isPhone ? 30 : 38,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.25)",
    color: "#fff",
    paddingHorizontal: 14,
    fontSize: isPhone ? 10 : 13,
  },

  main: {
    flex: 1,
    flexDirection: "row",
  },

  leftPanel: {
    width: isPhone ? 108 : 220,
    backgroundColor: "#301f2d",
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
    backgroundColor: "rgba(243,223,88,0.18)",
  },

  categoryText: {
    color: "#f4f4f4",
    fontSize: isPhone ? 8 : 12,
    flex: 1,
    marginRight: 6,
  },

  categoryTextActive: {
    color: "#f3df58",
    fontWeight: "900",
  },

  categoryCount: {
    color: "#f4f4f4",
    fontSize: isPhone ? 8 : 12,
  },

  centerPanel: {
    width: isPhone ? 130 : 260,
    backgroundColor: "#1a1730",
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
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  channelNumber: {
    width: isPhone ? 26 : 34,
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
    color: "#f3df58",
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
    padding: isPhone ? 8 : 12,
    backgroundColor: "#07112b",
  },

  previewBox: {
    width: "100%",
    height: isPhone ? 145 : 250,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 10,
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

  infoPanel: {
    flex: 1,
    backgroundColor: "#07112b",
    paddingHorizontal: 2,
  },

  channelTitle: {
    color: "#ffffff",
    fontSize: isPhone ? 16 : 24,
    fontWeight: "900",
    marginBottom: 8,
  },

  epgTime: {
    color: "#f3df58",
    fontSize: isPhone ? 10 : 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  epgCurrent: {
    color: "#ffffff",
    fontSize: isPhone ? 11 : 16,
    marginBottom: 14,
  },

  epgNextLabel: {
    color: "#f3df58",
    fontSize: isPhone ? 10 : 13,
    fontWeight: "900",
    marginBottom: 4,
  },

  epgNext: {
    color: "#ffffff",
    fontSize: isPhone ? 10 : 14,
    marginBottom: 4,
  },

  epgNextTime: {
    color: "#cfd7e2",
    fontSize: isPhone ? 9 : 12,
    marginBottom: 16,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  actionBtn: {
    flex: 1,
    minHeight: isPhone ? 34 : 42,
    borderRadius: 8,
    backgroundColor: "#6f5aa3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    paddingHorizontal: 8,
  },

  actionBtnText: {
    color: "#fff",
    fontSize: isPhone ? 9 : 12,
    fontWeight: "900",
  },

  smallButtonRow: {
    flexDirection: "row",
    marginTop: 10,
  },

  smallActionBtn: {
    minHeight: isPhone ? 32 : 38,
    borderRadius: 8,
    backgroundColor: "rgba(111,90,163,0.75)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    paddingHorizontal: 12,
  },

  smallActionBtnText: {
    color: "#fff",
    fontSize: isPhone ? 8.5 : 11,
    fontWeight: "900",
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
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  fullscreenBackBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(20,26,45,0.90)",
  },

  fullscreenBackText: {
    color: "#fff",
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
    backgroundColor: "rgba(30,30,45,0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },

  fullscreenBtnText: {
    color: "#fff",
    fontSize: isPhone ? 8 : 10,
    fontWeight: "900",
  },
});
