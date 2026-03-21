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

function getProgressPercent(program) {
  if (!program?.start || !program?.stop) return 0;

  const now = Date.now();
  const start = program.start.getTime();
  const stop = program.stop.getTime();

  if (stop <= start) return 0;
  if (now <= start) return 0;
  if (now >= stop) return 100;

  return Math.max(0, Math.min(100, ((now - start) / (stop - start)) * 100));
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
  const [showPlayerUi, setShowPlayerUi] = useState(true);

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
    setShowPlayerUi(true);
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

  const progressPercent = useMemo(() => getProgressPercent(nowProgram), [nowProgram]);

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

  const togglePlayerUi = () => {
    setShowPlayerUi((prev) => !prev);
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

  const epgRows = useMemo(() => {
    const rows = [];

    if (nowProgram) {
      rows.push({
        key: "now",
        time: formatProgramTime(nowProgram),
        title: nowProgram.title || "Programação atual",
      });
    }

    if (nextProgram) {
      rows.push({
        key: "next",
        time: formatProgramTime(nextProgram),
        title: nextProgram.title || "Próximo programa",
      });
    }

    return rows;
  }, [nowProgram, nextProgram]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050814" />

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
            activeOpacity={1}
            onPress={togglePlayerUi}
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

          {showPlayerUi && (
            <View style={styles.infoPanel}>
              <Text style={styles.channelTitle}>
                {safeText(selectedChannel?.name) || "Sem canal"}
              </Text>

              <Text style={styles.epgTimeMain}>
                {nowProgram ? formatProgramTime(nowProgram) : "Sem horário atual"}
              </Text>

              <Text style={styles.epgCurrentMain} numberOfLines={2}>
                {nowProgram?.title ||
                  (epgLoading
                    ? "Carregando EPG..."
                    : "Programação atual não encontrada")}
              </Text>

              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>

              <View style={styles.scheduleBox}>
                {epgRows.length > 0 ? (
                  epgRows.map((item) => (
                    <View key={item.key} style={styles.scheduleRow}>
                      <Text style={styles.scheduleTime}>{item.time}</Text>
                      <Text style={styles.scheduleTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleTime}>--:--</Text>
                    <Text style={styles.scheduleTitle} numberOfLines={1}>
                      Sem programação disponível
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={goToPreviousChannel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>◀</Text>
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

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={goToNextChannel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>▶</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={toggleFavorite}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>
                    {isFavorite ? "★" : "☆"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={openFullscreen}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>ABRIR</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.smallButtonRow}>
                <TouchableOpacity
                  style={styles.smallActionBtn}
                  onPress={onOpenHome}
                  activeOpacity={0.8}
                >
                  <Text style={styles.smallActionBtnText}>voltar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
              resizeMode={ResizeMode.COVER}
              shouldPlay={!isFullscreenPaused}
              isLooping
              useNativeControls={false}
            />
          ) : (
            <View style={styles.previewEmpty}>
              <Text style={styles.previewEmptyText}>Sem sinal</Text>
            </View>
          )}

          <View style={styles.fullscreenOverlay}>
            <View style={styles.fullscreenTopRow}>
              <TouchableOpacity
                style={styles.fullscreenIconBtn}
                onPress={closeFullscreen}
                activeOpacity={0.8}
              >
                <Text style={styles.fullscreenIconText}>↩</Text>
              </TouchableOpacity>

              <View style={styles.fullscreenTopIcons}>
                <TouchableOpacity
                  style={styles.fullscreenIconBtn}
                  onPress={toggleFavorite}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fullscreenIconText}>
                    {isFavorite ? "♥" : "♡"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fullscreenIconBtn}
                  onPress={togglePauseFullscreen}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fullscreenIconText}>
                    {isFullscreenPaused ? "▶" : "❚❚"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fullscreenCenterControls}>
              <TouchableOpacity
                style={styles.fullscreenCenterBtn}
                onPress={goToPreviousChannel}
                activeOpacity={0.8}
              >
                <Text style={styles.fullscreenCenterText}>◀◀</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fullscreenCenterBtnPlay}
                onPress={togglePauseFullscreen}
                activeOpacity={0.8}
              >
                <Text style={styles.fullscreenCenterText}>
                  {isFullscreenPaused ? "▶" : "❚❚"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fullscreenCenterBtn}
                onPress={goToNextChannel}
                activeOpacity={0.8}
              >
                <Text style={styles.fullscreenCenterText}>▶▶</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fullscreenBottomInfo}>
              <Text style={styles.fullscreenChannelText}>
                {selectedChannelIndex + 1} {safeText(selectedChannel?.name) || "Sem canal"}
              </Text>

              <Text style={styles.fullscreenProgramText} numberOfLines={1}>
                {nowProgram?.title || "Programação atual não encontrada"}
              </Text>

              <Text style={styles.fullscreenTimesText} numberOfLines={1}>
                {nowProgram ? formatProgramTime(nowProgram) : "--:--"}{" "}
                {nextProgram?.title ? `• ${nextProgram.title}` : ""}
              </Text>

              <View style={styles.fullscreenProgressTrack}>
                <View
                  style={[
                    styles.fullscreenProgressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>

              <View style={styles.fullscreenLiveBadge}>
                <Text style={styles.fullscreenLiveBadgeText}>LIVE</Text>
              </View>
            </View>
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
    height: isPhone ? 160 : 255,
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
  },

  channelTitle: {
    color: "#ffffff",
    fontSize: isPhone ? 16 : 24,
    fontWeight: "900",
    marginBottom: 8,
  },

  epgTimeMain: {
    color: "#f3df58",
    fontSize: isPhone ? 10 : 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  epgCurrentMain: {
    color: "#ffffff",
    fontSize: isPhone ? 11 : 16,
    marginBottom: 10,
  },

  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    marginBottom: 12,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#29a3ff",
  },

  scheduleBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 14,
  },

  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  scheduleTime: {
    width: isPhone ? 82 : 120,
    color: "#f3df58",
    fontSize: isPhone ? 9 : 12,
    fontWeight: "800",
  },

  scheduleTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: isPhone ? 9 : 12,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },

  actionBtn: {
    width: "18.8%",
    minHeight: isPhone ? 36 : 46,
    borderRadius: 8,
    backgroundColor: "#7561a6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  actionBtnText: {
    color: "#fff",
    fontSize: isPhone ? 8 : 11,
    fontWeight: "900",
    textAlign: "center",
  },

  smallButtonRow: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
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

  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingTop: isPhone ? 18 : 24,
    paddingBottom: isPhone ? 16 : 24,
    paddingHorizontal: isPhone ? 10 : 16,
  },

  fullscreenTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fullscreenTopIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  fullscreenIconBtn: {
    width: isPhone ? 40 : 48,
    height: isPhone ? 40 : 48,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    marginLeft: 8,
  },

  fullscreenIconText: {
    color: "#fff",
    fontSize: isPhone ? 18 : 22,
    fontWeight: "900",
  },

  fullscreenCenterControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 40,
  },

  fullscreenCenterBtn: {
    width: isPhone ? 56 : 70,
    height: isPhone ? 56 : 70,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    marginHorizontal: 18,
  },

  fullscreenCenterBtnPlay: {
    width: isPhone ? 72 : 88,
    height: isPhone ? 72 : 88,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    marginHorizontal: 18,
  },

  fullscreenCenterText: {
    color: "#fff",
    fontSize: isPhone ? 22 : 30,
    fontWeight: "900",
  },

  fullscreenBottomInfo: {
    width: "100%",
    marginTop: "auto",
  },

  fullscreenChannelText: {
    color: "#fff",
    fontSize: isPhone ? 18 : 28,
    fontWeight: "300",
    marginBottom: 4,
  },

  fullscreenProgramText: {
    color: "#f1f1f1",
    fontSize: isPhone ? 10 : 14,
    marginBottom: 4,
  },

  fullscreenTimesText: {
    color: "#d7d7d7",
    fontSize: isPhone ? 10 : 13,
    marginBottom: 10,
  },

  fullscreenProgressTrack: {
    width: "100%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    marginBottom: 10,
  },

  fullscreenProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#1ea0ff",
  },

  fullscreenLiveBadge: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(30,30,30,0.72)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },

  fullscreenLiveBadgeText: {
    color: "#ff4a4a",
    fontSize: isPhone ? 10 : 13,
    fontWeight: "900",
  },
});
