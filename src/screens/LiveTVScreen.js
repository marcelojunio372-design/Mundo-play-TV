import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ResizeMode, Video } from "expo-av";

const PLAYER_TIMEOUT_MS = 12000;

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

function buildCategories(items = []) {
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
    {
      key: "all",
      name: "Tudo",
      count: items.length,
      items,
    },
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
  const loadingTimerRef = useRef(null);

  const allChannels = useMemo(() => {
    return safeArray(session?.data?.live).filter(
      (item) => item && item.url && item.name
    );
  }, [session]);

  const categories = useMemo(() => buildCategories(allChannels), [allChannels]);

  const [selectedCategoryKey, setSelectedCategoryKey] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [playerUri, setPlayerUri] = useState("");
  const [playerReloadKey, setPlayerReloadKey] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.key === selectedCategoryKey) || categories[0];
  }, [categories, selectedCategoryKey]);

  const visibleChannels = useMemo(() => {
    const source = safeArray(selectedCategory?.items);
    const term = normalizeText(search);

    if (!term) return source;

    return source.filter((item) =>
      normalizeText(item?.name || "").includes(term)
    );
  }, [selectedCategory, search]);

  const selectedChannel = useMemo(() => {
    return (
      visibleChannels.find((item) => item.id === selectedChannelId) ||
      allChannels.find((item) => item.id === selectedChannelId) ||
      null
    );
  }, [visibleChannels, allChannels, selectedChannelId]);

  const epgRows = useMemo(() => getEpgRows(selectedChannel), [selectedChannel]);

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
      setPlayerError("Este canal demorou para abrir. Toque em recarregar.");
    }, PLAYER_TIMEOUT_MS);
  };

  const stopCurrentVideo = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync().catch(() => {});
        await videoRef.current.unloadAsync().catch(() => {});
      }
    } catch (e) {}
  };

  const openChannel = async (channel) => {
    if (!channel?.url) return;

    clearLoadingTimer();
    await stopCurrentVideo();

    setSelectedChannelId(channel.id);
    setPlayerUri(channel.url);
    setPlayerReloadKey((prev) => prev + 1);
    setPlayerError("");
    setHasStartedPlayback(false);
    setIsBuffering(true);
    startLoadingTimer();
  };

  const handleSelectCategory = (category) => {
    setSelectedCategoryKey(category.key);
    setSearch("");
  };

  const handleSelectChannel = async (channel) => {
    await openChannel(channel);
  };

  const handleReload = async () => {
    if (!selectedChannel?.url) return;
    await openChannel(selectedChannel);
  };

  const renderCategoryItem = ({ item }) => {
    const active = item.key === selectedCategoryKey;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, active && styles.categoryItemActive]}
        onPress={() => handleSelectCategory(item)}
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

    return (
      <TouchableOpacity
        style={[styles.channelItem, active && styles.channelItemActive]}
        onPress={() => handleSelectChannel(item)}
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
      </TouchableOpacity>
    );
  };

  return (
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
          />
        </View>

        <View style={styles.middleCol}>
          <FlatList
            data={visibleChannels}
            keyExtractor={(item, index) => String(item?.id || `ch_${index}`)}
            renderItem={renderChannelItem}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
          />
        </View>

        <View style={styles.rightCol}>
          <View style={styles.playerWrap}>
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
                  onPlaybackStatusUpdate={(status) => {
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

                      if (!hasStartedPlayback) {
                        return;
                      }

                      setIsBuffering(false);
                    } else if (status.error) {
                      clearLoadingTimer();
                      setIsBuffering(false);
                      setPlayerError("Erro ao reproduzir este canal.");
                    }
                  }}
                  onError={() => {
                    clearLoadingTimer();
                    setIsBuffering(false);
                    setPlayerError("Erro ao reproduzir este canal.");
                  }}
                />

                {isBuffering && (
                  <View style={styles.playerOverlay}>
                    <ActivityIndicator size="small" color="#35c8ff" />
                    <Text style={styles.playerOverlayText}>Carregando...</Text>
                  </View>
                )}

                {!!playerError && !isBuffering && (
                  <View style={styles.playerOverlay}>
                    <Text style={styles.playerOverlayText}>{playerError}</Text>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.channelInfoTitle}>
              {selectedChannel?.name || "Canal"}
            </Text>

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
              <TouchableOpacity style={styles.actionBtn} onPress={handleReload}>
                <Text style={styles.actionBtnText}>recarregar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>favoritos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>buscar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
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

  playerWrap: {
    height: 130,
    backgroundColor: "#000000",
    margin: 4,
    overflow: "hidden",
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

  channelInfoTitle: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
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
    width: 52,
    height: 22,
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
});
