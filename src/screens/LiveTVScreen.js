import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from "expo-av";
import { loadEPG, findNowAndNextForChannel } from "../services/epgService";

const PLAYER_TIMEOUT_MS = 12000;
const LIVE_FAVORITES_KEY = "mundoplaytv_live_favorites";
const LIVE_RECENTS_KEY = "mundoplaytv_live_recents";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeText(value = "") {
  return safeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getLiveStorageId(item = {}) {
  return safeText(item.id || item.url || item.name);
}

function buildCategories(items = [], favorites = [], recents = []) {
  const grouped = {};

  items.forEach((item) => {
    const group = safeText(item?.group || "OUTROS");
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  const categories = Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      key: `group_${name}`,
      name,
      count: grouped[name].length,
      items: grouped[name],
    }));

  return [
    { key: "all", name: "Tudo", count: items.length, items },
    { key: "favorites", name: "Favoritos", count: favorites.length, items: favorites },
    { key: "recents", name: "Visto por último", count: recents.length, items: recents },
    ...categories,
  ];
}

function formatClock(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  return value.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEpgRows(channel) {
  const nowProgram = channel?.nowProgram || null;
  const nextProgram = channel?.nextProgram || null;

  if (nowProgram || nextProgram) {
    const rows = [];
    if (nowProgram) {
      rows.push({
        key: "now",
        time: `${formatClock(nowProgram.start)} ~ ${formatClock(nowProgram.stop)}`,
        title: safeText(nowProgram.title || "Agora"),
      });
    }
    if (nextProgram) {
      rows.push({
        key: "next",
        time: `${formatClock(nextProgram.start)} ~ ${formatClock(nextProgram.stop)}`,
        title: safeText(nextProgram.title || "Próximo"),
      });
    }
    return rows;
  }

  return [
    { key: "f1", time: "--:-- ~ --:--", title: "EPG ainda não carregado" },
    { key: "f2", time: "--:-- ~ --:--", title: "Selecione um canal para reproduzir" },
  ];
}

export default function LiveTVScreen({
  session,
  onOpenHome,
  onOpenMovies,
  onOpenSeries,
}) {
  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const loadingTimerRef = useRef(null);

  const allChannels = useMemo(() => {
    return safeArray(session?.data?.live).filter(
      (item) => item && item.url && item.name
    );
  }, [session]);

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);
  const [epgItems, setEpgItems] = useState([]);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [playerUri, setPlayerUri] = useState("");
  const [playerReloadKey, setPlayerReloadKey] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function loadSavedData() {
      try {
        const [savedFavorites, savedRecents] = await Promise.all([
          AsyncStorage.getItem(LIVE_FAVORITES_KEY),
          AsyncStorage.getItem(LIVE_RECENTS_KEY),
        ]);

        if (savedFavorites) setFavoriteIds(JSON.parse(savedFavorites));
        if (savedRecents) setRecentIds(JSON.parse(savedRecents));
      } catch (e) {}
    }

    loadSavedData();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRealEPG() {
      try {
        const items = await loadEPG(session);
        if (mounted) {
          setEpgItems(Array.isArray(items) ? items : []);
        }
      } catch (e) {
        if (mounted) {
          setEpgItems([]);
        }
      }
    }

    loadRealEPG();

    return () => {
      mounted = false;
    };
  }, [session]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  const favoriteChannels = useMemo(() => {
    const set = new Set(favoriteIds);
    return allChannels.filter((item) => set.has(getLiveStorageId(item)));
  }, [allChannels, favoriteIds]);

  const recentChannels = useMemo(() => {
    const map = new Map(allChannels.map((item) => [getLiveStorageId(item), item]));
    return recentIds.map((id) => map.get(id)).filter(Boolean);
  }, [allChannels, recentIds]);

  const categories = useMemo(() => {
    return buildCategories(allChannels, favoriteChannels, recentChannels);
  }, [allChannels, favoriteChannels, recentChannels]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.key === selectedCategoryKey) || categories[0];
  }, [categories, selectedCategoryKey]);

  const selectedCategoryItems = useMemo(() => {
    return safeArray(selectedCategory?.items).map((item) => {
      const { nowProgram, nextProgram } = findNowAndNextForChannel(
        epgItems,
        item?.name || "",
        item?.group || "",
        item?.tvgId || "",
        item?.tvgName || ""
      );

      return {
        ...item,
        nowProgram,
        nextProgram,
      };
    });
  }, [selectedCategory, epgItems]);

  const visibleChannels = useMemo(() => {
    const source = selectedCategoryItems;
    const term = normalizeText(search);

    if (!term) return source;

    return source.filter((item) => {
      const name = normalizeText(item?.name || "");
      const tvgName = normalizeText(item?.tvgName || "");
      const group = normalizeText(item?.group || "");
      return (
        name.includes(term) ||
        tvgName.includes(term) ||
        group.includes(term)
      );
    });
  }, [selectedCategoryItems, search]);

  const selectedChannel = useMemo(() => {
    return (
      visibleChannels.find((item) => item.id === selectedChannelId) ||
      selectedCategoryItems.find((item) => item.id === selectedChannelId) ||
      allChannels.find((item) => item.id === selectedChannelId) ||
      null
    );
  }, [visibleChannels, selectedCategoryItems, allChannels, selectedChannelId]);

  const epgRows = useMemo(() => getEpgRows(selectedChannel), [selectedChannel]);

  const persistFavorites = async (ids) => {
    try {
      await AsyncStorage.setItem(LIVE_FAVORITES_KEY, JSON.stringify(ids));
    } catch (e) {}
  };

  const persistRecents = async (ids) => {
    try {
      await AsyncStorage.setItem(LIVE_RECENTS_KEY, JSON.stringify(ids));
    } catch (e) {}
  };

  const addToRecent = async (channel) => {
    const id = getLiveStorageId(channel);
    if (!id) return;

    const updated = [id, ...recentIds.filter((item) => item !== id)].slice(0, 60);
    setRecentIds(updated);
    await persistRecents(updated);
  };

  const toggleFavorite = async (channel) => {
    if (!channel) return;

    const id = getLiveStorageId(channel);
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

  const clearLoadingTimer = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  };

  const startLoadingTimer = () => {
    clearLoadingTimer();
    loadingTimerRef.current = setTimeout(() => {
      setIsBuffering(false);
      setPlayerError("Este canal demorou para abrir.");
    }, PLAYER_TIMEOUT_MS);
  };

  const stopCurrentVideo = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync().catch(() => {});
        await videoRef.current.unloadAsync().catch(() => {});
      }
    } catch (e) {}

    try {
      if (fullscreenVideoRef.current) {
        await fullscreenVideoRef.current.stopAsync().catch(() => {});
        await fullscreenVideoRef.current.unloadAsync().catch(() => {});
      }
    } catch (e) {}
  };

  const openChannel = async (channel) => {
    if (!channel?.url) return;

    clearLoadingTimer();
    await stopCurrentVideo();
    await addToRecent(channel);

    setSelectedChannelId(channel.id);
    setPlayerUri(channel.url);
    setPlayerReloadKey((prev) => prev + 1);
    setPlayerError("");
    setHasStartedPlayback(false);
    setIsBuffering(true);
    startLoadingTimer();
  };

  const handlePlaybackStatus = (status) => {
    if (!status) return;

    if (status.isLoaded) {
      if (status.isPlaying || status.positionMillis > 0) {
        clearLoadingTimer();
        setHasStartedPlayback(true);
        setIsBuffering(false);
        setPlayerError("");
        return;
      }

      if (status.isBuffering) {
        setIsBuffering(true);
        return;
      }

      if (!hasStartedPlayback) return;

      setIsBuffering(false);
    } else if (status.error) {
      clearLoadingTimer();
      setIsBuffering(false);
      setPlayerError("Erro ao reproduzir este canal.");
    }
  };

  const renderCategoryItem = ({ item }) => {
    const active = item.key === selectedCategoryKey;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, active && styles.categoryItemActive]}
        onPress={() => {
          setSelectedCategoryKey(item.key);
          setSearch("");
        }}
      >
        <Text
          style={[styles.categoryName, active && styles.categoryNameActive]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.categoryCount, active && styles.categoryCountActive]}
        >
          {item.count}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChannelItem = ({ item, index }) => {
    const active = item.id === selectedChannelId;
    const favorite = favoriteIds.includes(getLiveStorageId(item));

    return (
      <TouchableOpacity
        style={[styles.channelItem, active && styles.channelItemActive]}
        onPress={() => openChannel(item)}
      >
        <Text style={styles.channelNumber}>{index + 1}</Text>

        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.channelLogo} />
        ) : (
          <View style={styles.channelLogoFallback} />
        )}

        <Text
          style={[styles.channelName, active && styles.channelNameActive]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <TouchableOpacity
          style={styles.starBtn}
          onPress={() => toggleFavorite(item)}
        >
          <Text style={[styles.starText, favorite && styles.starTextActive]}>
            ★
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={onOpenHome}>
            <Text style={styles.topNavText}>Casa</Text>
          </TouchableOpacity>

          <Text style={styles.topSeparator}>|</Text>

          <Text style={styles.topNavTextActive}>TV ao Vivo</Text>

          <Text style={styles.topSeparator}>|</Text>

          <TouchableOpacity onPress={onOpenMovies}>
            <Text style={styles.topNavText}>Filmes</Text>
          </TouchableOpacity>

          <Text style={styles.topSeparator}>|</Text>

          <TouchableOpacity onPress={onOpenSeries}>
            <Text style={styles.topNavText}>Séries</Text>
          </TouchableOpacity>

          <View style={styles.searchWrap}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar canal..."
              placeholderTextColor="#9bb1c8"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.layout}>
          <View style={styles.leftCol}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.key}
              renderItem={renderCategoryItem}
              showsVerticalScrollIndicator={false}
              initialNumToRender={16}
              removeClippedSubviews
            />
          </View>

          <View style={styles.middleCol}>
            <FlatList
              data={visibleChannels}
              keyExtractor={(item, index) => String(item?.id || `ch_${index}`)}
              renderItem={renderChannelItem}
              showsVerticalScrollIndicator={false}
              initialNumToRender={20}
              removeClippedSubviews
            />
          </View>

          <View style={styles.rightCol}>
            <TouchableOpacity
              activeOpacity={0.95}
              style={styles.playerWrap}
              onPress={() => {
                if (playerUri) setIsFullscreen(true);
              }}
            >
              {!playerUri ? (
                <View style={styles.emptyPlayer}>
                  <Text style={styles.emptyPlayerText}>Selecione um canal.</Text>
                </View>
              ) : (
                <>
                  <Video
                    key={`live_${playerReloadKey}`}
                    ref={videoRef}
                    style={styles.video}
                    source={{
                      uri: playerUri,
                      headers: {
                        "User-Agent": "Mozilla/5.0",
                        Accept: "*/*",
                        Connection: "keep-alive",
                      },
                    }}
                    shouldPlay
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    onLoadStart={() => {
                      setIsBuffering(true);
                      setPlayerError("");
                      setHasStartedPlayback(false);
                      startLoadingTimer();
                    }}
                    onReadyForDisplay={() => {
                      clearLoadingTimer();
                      setIsBuffering(false);
                      setPlayerError("");
                      setHasStartedPlayback(true);
                    }}
                    onPlaybackStatusUpdate={handlePlaybackStatus}
                    onError={() => {
                      clearLoadingTimer();
                      setIsBuffering(false);
                      setPlayerError("Erro ao reproduzir este canal.");
                    }}
                  />

                  {isBuffering && (
                    <View style={styles.playerOverlay} pointerEvents="none">
                      <ActivityIndicator size="small" color="#35c8ff" />
                      <Text style={styles.playerOverlayText}>Carregando...</Text>
                    </View>
                  )}

                  {!!playerError && !isBuffering && (
                    <View style={styles.playerOverlay} pointerEvents="none">
                      <Text style={styles.playerOverlayText}>{playerError}</Text>
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>

            <View style={styles.infoBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.channelInfoTitle}>
                  {selectedChannel?.name || "Canal"}
                </Text>

                {selectedChannel ? (
                  <TouchableOpacity onPress={() => toggleFavorite(selectedChannel)}>
                    <Text
                      style={[
                        styles.titleStar,
                        favoriteIds.includes(getLiveStorageId(selectedChannel)) &&
                          styles.titleStarActive,
                      ]}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.channelInfoGroup}>
                {selectedChannel?.group || "TV ao Vivo"}
              </Text>

              <View style={styles.epgWrap}>
                {epgRows.map((item) => (
                  <View key={item.key} style={styles.epgRow}>
                    <Text style={styles.epgTime}>{item.time}</Text>
                    <Text style={styles.epgTitle}>{item.title}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => search && setSearch("")}>
                  <Text style={styles.actionBtnText}>limpar busca</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedCategoryKey("recents")}>
                  <Text style={styles.actionBtnText}>visto por último</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => selectedChannel && openChannel(selectedChannel)}>
                  <Text style={styles.actionBtnText}>recarregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={isFullscreen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenWrap}>
          {playerUri ? (
            <Video
              key={`live_full_${playerReloadKey}`}
              ref={fullscreenVideoRef}
              style={styles.fullscreenVideo}
              source={{
                uri: playerUri,
                headers: {
                  "User-Agent": "Mozilla/5.0",
                  Accept: "*/*",
                  Connection: "keep-alive",
                },
              }}
              shouldPlay
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={handlePlaybackStatus}
            />
          ) : null}

          <TouchableOpacity
            style={styles.closeFullscreenBtn}
            onPress={() => setIsFullscreen(false)}
          >
            <Text style={styles.closeFullscreenText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050d18",
  },

  topbar: {
    height: 36,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#050915",
  },

  topNavText: {
    color: "#e6e6e6",
    fontSize: 9,
  },

  topNavTextActive: {
    color: "#f0c63c",
    fontSize: 9,
    fontWeight: "800",
  },

  topSeparator: {
    color: "#b2b2b2",
    marginHorizontal: 6,
  },

  searchWrap: {
    marginLeft: 8,
    width: 130,
    height: 26,
    borderWidth: 2,
    borderColor: "#ececec",
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  searchInput: {
    color: "#ffffff",
    padding: 0,
    fontSize: 10,
  },

  layout: {
    flex: 1,
    flexDirection: "row",
  },

  leftCol: {
    width: 110,
    backgroundColor: "#2a1124",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  middleCol: {
    width: 130,
    backgroundColor: "#15111f",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  rightCol: {
    flex: 1,
    backgroundColor: "#071122",
  },

  categoryItem: {
    minHeight: 32,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  categoryItemActive: {
    backgroundColor: "#5a4233",
  },

  categoryName: {
    color: "#f0f0f0",
    fontSize: 9,
    flex: 1,
    marginRight: 6,
  },

  categoryNameActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  categoryCount: {
    color: "#d4d4d4",
    fontSize: 9,
  },

  categoryCountActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  channelItem: {
    minHeight: 32,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  channelItemActive: {
    backgroundColor: "#3f3848",
  },

  channelNumber: {
    width: 16,
    color: "#d9d9d9",
    fontSize: 8,
    textAlign: "center",
  },

  channelLogo: {
    width: 12,
    height: 12,
    resizeMode: "contain",
    marginHorizontal: 4,
  },

  channelLogoFallback: {
    width: 12,
    height: 12,
    marginHorizontal: 4,
    borderRadius: 2,
    backgroundColor: "#39465c",
  },

  channelName: {
    flex: 1,
    color: "#f3f3f3",
    fontSize: 8,
  },

  channelNameActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  starBtn: {
    width: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  starText: {
    color: "#777",
    fontSize: 10,
  },

  starTextActive: {
    color: "#ffe04f",
  },

  playerWrap: {
    height: 130,
    backgroundColor: "#000000",
    margin: 4,
    overflow: "hidden",
    borderRadius: 4,
  },

  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  playerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.40)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  playerOverlayText: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyPlayer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  emptyPlayerText: {
    color: "#ffffff",
    fontSize: 8,
    textAlign: "center",
  },

  infoBlock: {
    flex: 1,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },

  channelInfoTitle: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    flex: 1,
    marginRight: 8,
  },

  titleStar: {
    color: "#666",
    fontSize: 14,
  },

  titleStarActive: {
    color: "#ffe04f",
  },

  channelInfoGroup: {
    color: "#d2d2d2",
    fontSize: 8,
    marginTop: 2,
    marginBottom: 6,
  },

  epgWrap: {
    marginTop: 2,
  },

  epgRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  epgTime: {
    width: 56,
    color: "#f0d24c",
    fontSize: 8,
  },

  epgTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 8,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  actionBtn: {
    width: 78,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#7e5ca8",
    alignItems: "center",
    justifyContent: "center",
  },

  actionBtnText: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "700",
    textTransform: "lowercase",
  },

  fullscreenWrap: {
    flex: 1,
    backgroundColor: "#000",
  },

  fullscreenVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  closeFullscreenBtn: {
    position: "absolute",
    top: 30,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  closeFullscreenText: {
    color: "#fff",
    fontWeight: "800",
  },
});
