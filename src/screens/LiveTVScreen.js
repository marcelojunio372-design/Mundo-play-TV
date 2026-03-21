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
  Modal,
  StatusBar,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video, ResizeMode } from "expo-av";
import {
  loadEPG,
  findNowAndNextForChannel,
  formatProgramTime,
  EPG_DEBUG_STATE,
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
  isRefreshingData,
  onRefreshSession,
  onOpenHome,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
}) {
  const channels = session?.data?.live || [];

  const [favoriteIds, setFavoriteIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedChannelIndex, setSelectedChannelIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [epgItems, setEpgItems] = useState([]);
  const [epgLoading, setEpgLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [fullscreenRetryKey, setFullscreenRetryKey] = useState(0);
  const [playerError, setPlayerError] = useState("");
  const [fullscreenError, setFullscreenError] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreenPaused, setIsFullscreenPaused] = useState(false);
  const [showFullscreenUi, setShowFullscreenUi] = useState(true);

  const autoRefreshedRef = useRef(false);
  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const fullscreenReconnectTimerRef = useRef(null);
  const fullscreenUiTimerRef = useRef(null);

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
    if (channels.length > 0) return;
    if (!session?.url) return;
    if (autoRefreshedRef.current) return;

    autoRefreshedRef.current = true;
    onRefreshSession?.();
  }, [channels.length, session?.url, onRefreshSession]);

  useEffect(() => {
    let active = true;

    async function fetchEPG() {
      try {
        setEpgLoading(true);
        const data = await loadEPG(session);

        if (active) {
          setEpgItems(Array.isArray(data) ? data : []);
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

    fetchEPG();

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
      return name.includes(term);
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

  const { nowProgram, nextProgram } = useMemo(() => {
    if (!selectedChannel) {
      return { nowProgram: null, nextProgram: null };
    }

    return findNowAndNextForChannel(
      epgItems,
      safeText(selectedChannel.name),
      safeText(selectedChannel.group),
      safeText(selectedChannel.tvgId),
      safeText(selectedChannel.tvgName)
    );
  }, [epgItems, selectedChannel]);

  const progressPercent = useMemo(() => getProgressPercent(nowProgram), [nowProgram]);

  const epgDebug = useMemo(() => {
    return {
      epgLoadedCount: Array.isArray(epgItems) ? epgItems.length : 0,
      channelName: safeText(selectedChannel?.name),
      channelGroup: safeText(selectedChannel?.group),
      tvgId: safeText(selectedChannel?.tvgId),
      tvgName: safeText(selectedChannel?.tvgName),
      foundNow: !!nowProgram,
      foundNext: !!nextProgram,
      nowTitle: safeText(nowProgram?.title),
      nextTitle: safeText(nextProgram?.title),
      xmltvUrl: safeText(EPG_DEBUG_STATE.xmltvUrl),
      httpStatus: safeText(EPG_DEBUG_STATE.httpStatus),
      startsWithTv: !!EPG_DEBUG_STATE.startsWithTv,
      rawPreview: safeText(EPG_DEBUG_STATE.rawPreview),
      itemsParsed: Number(EPG_DEBUG_STATE.itemsParsed || 0),
      errorText: safeText(EPG_DEBUG_STATE.errorText),
    };
  }, [epgItems, selectedChannel, nowProgram, nextProgram]);

  useEffect(() => {
    setRetryKey((prev) => prev + 1);
    setFullscreenRetryKey((prev) => prev + 1);
    setPlayerError("");
    setFullscreenError("");
    setIsPaused(false);
    setIsFullscreenPaused(false);
  }, [selectedChannel?.url]);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (fullscreenReconnectTimerRef.current) {
        clearTimeout(fullscreenReconnectTimerRef.current);
      }
      if (fullscreenUiTimerRef.current) {
        clearTimeout(fullscreenUiTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showFullscreen) return;

    setShowFullscreenUi(true);

    if (fullscreenUiTimerRef.current) {
      clearTimeout(fullscreenUiTimerRef.current);
    }

    fullscreenUiTimerRef.current = setTimeout(() => {
      setShowFullscreenUi(false);
    }, 2500);
  }, [showFullscreen, fullscreenRetryKey]);

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

  const addToRecent = (channel) => {
    const id = getChannelStorageId(channel);
    if (!id) return;

    const updated = [id, ...recentIds.filter((item) => item !== id)].slice(0, 50);
    setRecentIds(updated);
    persistRecents(updated);
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

  const scheduleReconnect = () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

    reconnectTimerRef.current = setTimeout(() => {
      setRetryKey((prev) => prev + 1);
    }, 1500);
  };

  const scheduleFullscreenReconnect = () => {
    if (fullscreenReconnectTimerRef.current) {
      clearTimeout(fullscreenReconnectTimerRef.current);
    }

    fullscreenReconnectTimerRef.current = setTimeout(() => {
      setFullscreenRetryKey((prev) => prev + 1);
    }, 1500);
  };

  const resetFullscreenUiTimer = () => {
    setShowFullscreenUi(true);

    if (fullscreenUiTimerRef.current) {
      clearTimeout(fullscreenUiTimerRef.current);
    }

    fullscreenUiTimerRef.current = setTimeout(() => {
      setShowFullscreenUi(false);
    }, 2500);
  };

  const toggleFullscreenUi = () => {
    if (showFullscreenUi) {
      setShowFullscreenUi(false);
      if (fullscreenUiTimerRef.current) {
        clearTimeout(fullscreenUiTimerRef.current);
      }
    } else {
      resetFullscreenUiTimer();
    }
  };

  const handleSelectChannel = (index) => {
    setSelectedChannelIndex(index);
    const item = visibleChannels[index];

    if (item) {
      addToRecent(item);
      setPlayerError("");
      setRetryKey((prev) => prev + 1);
      setIsPaused(false);
      setIsFullscreenPaused(false);
    }
  };

  const handleChannelPress = (index) => {
    const sameChannel = index === selectedChannelIndex;
    handleSelectChannel(index);

    if (sameChannel) {
      setTimeout(() => {
        openFullscreen();
      }, 120);
    }
  };

  const openFullscreen = () => {
    if (!selectedChannel?.url) return;
    addToRecent(selectedChannel);
    setFullscreenError("");
    setFullscreenRetryKey((prev) => prev + 1);
    setIsFullscreenPaused(false);
    setShowFullscreen(true);
    resetFullscreenUiTimer();
  };

  const closeFullscreen = async () => {
    try {
      await fullscreenVideoRef.current?.stopAsync?.();
    } catch (e) {}

    if (fullscreenReconnectTimerRef.current) {
      clearTimeout(fullscreenReconnectTimerRef.current);
    }

    if (fullscreenUiTimerRef.current) {
      clearTimeout(fullscreenUiTimerRef.current);
    }

    setShowFullscreen(false);
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
      resetFullscreenUiTimer();
    } catch (e) {}
  };

  const goToPreviousChannel = () => {
    if (!visibleChannels.length) return;
    const nextIndex =
      selectedChannelIndex <= 0 ? visibleChannels.length - 1 : selectedChannelIndex - 1;
    handleSelectChannel(nextIndex);
  };

  const goToNextChannel = () => {
    if (!visibleChannels.length) return;
    const nextIndex =
      selectedChannelIndex >= visibleChannels.length - 1 ? 0 : selectedChannelIndex + 1;
    handleSelectChannel(nextIndex);
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
          style={[
            styles.categoryText,
            active && styles.categoryTextActive,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <Text
          style={[
            styles.categoryCount,
            active && styles.categoryTextActive,
          ]}
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
        onPress={() => handleChannelPress(index)}
        activeOpacity={0.8}
      >
        <View style={styles.channelNumberBox}>
          <Text style={styles.channelNumber}>{index + 1}</Text>
        </View>

        <View style={styles.channelTextWrap}>
          <Text
            style={[
              styles.channelName,
              active && styles.channelNameActive,
            ]}
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
          {channels.length === 0 && isRefreshingData ? (
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>Atualizando canais...</Text>
            </View>
          ) : (
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
          )}
        </View>

        <View style={styles.rightPanel}>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.previewBox}
            onPress={openFullscreen}
          >
            {selectedChannel?.url ? (
              <Video
                key={`${selectedChannel.url}_${retryKey}`}
                ref={videoRef}
                source={{ uri: selectedChannel.url }}
                style={styles.previewVideo}
                resizeMode={ResizeMode.COVER}
                useNativeControls={false}
                shouldPlay={!isPaused}
                isLooping={false}
                onLoadStart={() => setPlayerError("")}
                onReadyForDisplay={() => setPlayerError("")}
                onError={() => {
                  setPlayerError("Reconectando sinal...");
                  scheduleReconnect();
                }}
              />
            ) : (
              <View style={styles.previewEmpty}>
                <Text style={styles.previewEmptyText}>
                  {isRefreshingData ? "Atualizando canais..." : "Selecione um canal"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {!!playerError && (
            <Text style={styles.playerStatusText}>{playerError}</Text>
          )}

          <ScrollView
            style={styles.epgBox}
            contentContainerStyle={styles.epgBoxContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.epgTopRow}>
              <View style={styles.channelInfoWrap}>
                <Text style={styles.channelNumberLarge}>
                  {selectedChannel ? selectedChannelIndex + 1 : "-"}
                </Text>
                <View style={styles.channelMetaWrap}>
                  <Text style={styles.epgHeader} numberOfLines={1}>
                    {selectedChannel?.name || "Sem canal"}
                  </Text>
                  <Text style={styles.epgSub} numberOfLines={1}>
                    {selectedChannel?.group || "Canal"}
                  </Text>
                </View>
              </View>

              <View style={styles.epgActions}>
                <TouchableOpacity
                  style={styles.smallControlBtn}
                  onPress={goToPreviousChannel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.smallControlBtnText}>◀</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallControlBtn}
                  onPress={togglePauseMain}
                  activeOpacity={0.8}
                >
                  <Text style={styles.smallControlBtnText}>
                    {isPaused ? "PLAY" : "PAUSE"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallControlBtn}
                  onPress={goToNextChannel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.smallControlBtnText}>▶</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.favoriteBtn}
                  onPress={toggleFavorite}
                  activeOpacity={0.8}
                >
                  <Text style={styles.favoriteBtnText}>
                    {isFavorite ? "★" : "☆"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {epgLoading ? (
              <Text style={styles.epgDesc}>Carregando programação...</Text>
            ) : (
              <>
                <Text style={styles.epgTime}>
                  {nowProgram ? formatProgramTime(nowProgram) : "Ao vivo agora"}
                </Text>

                <Text style={styles.epgTitle} numberOfLines={2}>
                  {nowProgram?.title || selectedChannel?.name || "Sem canal selecionado"}
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progressPercent}%` }]}
                  />
                </View>

                <Text style={styles.epgDesc} numberOfLines={3}>
                  {nowProgram?.desc ||
                    "Programação atual não encontrada para este canal."}
                </Text>

                <View style={styles.nextProgramBox}>
                  <Text style={styles.nextProgramLabel}>Próximo</Text>

                  <Text style={styles.nextProgramTitle} numberOfLines={2}>
                    {nextProgram?.title || "Sem próximo programa"}
                  </Text>

                  <Text style={styles.nextProgramTime} numberOfLines={1}>
                    {nextProgram ? formatProgramTime(nextProgram) : ""}
                  </Text>
                </View>

                <View style={styles.debugBox}>
                  <Text style={styles.debugTitle}>TESTE VISÍVEL EPG</Text>
                  <Text style={styles.debugText}>
                    EPG carregado: {epgLoading ? "carregando" : "sim"}
                  </Text>
                  <Text style={styles.debugText}>
                    Quantidade de itens EPG: {epgDebug.epgLoadedCount}
                  </Text>
                  <Text style={styles.debugText}>
                    Canal: {epgDebug.channelName || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    Grupo: {epgDebug.channelGroup || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    tvgId: {epgDebug.tvgId || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    tvgName: {epgDebug.tvgName || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    Achou agora: {epgDebug.foundNow ? "SIM" : "NÃO"}
                  </Text>
                  <Text style={styles.debugText}>
                    Achou próximo: {epgDebug.foundNext ? "SIM" : "NÃO"}
                  </Text>
                  <Text style={styles.debugText}>
                    Título agora: {epgDebug.nowTitle || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    Título próximo: {epgDebug.nextTitle || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    URL XMLTV: {epgDebug.xmltvUrl || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    HTTP status: {epgDebug.httpStatus || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    Começa com &lt;tv: {epgDebug.startsWithTv ? "SIM" : "NÃO"}
                  </Text>
                  <Text style={styles.debugText}>
                    Programas extraídos: {epgDebug.itemsParsed}
                  </Text>
                  <Text style={styles.debugText}>
                    Erro: {epgDebug.errorText || "-"}
                  </Text>
                  <Text style={styles.debugText}>
                    Retorno bruto: {epgDebug.rawPreview || "-"}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={showFullscreen}
        animationType="fade"
        transparent={false}
        onRequestClose={closeFullscreen}
        statusBarTranslucent
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.fullscreenContainer}
          onPress={toggleFullscreenUi}
        >
          {selectedChannel?.url ? (
            <Video
              key={`${selectedChannel.url}_${fullscreenRetryKey}_fullscreen`}
              ref={fullscreenVideoRef}
              source={{ uri: selectedChannel.url }}
              style={styles.fullscreenVideoAbsolute}
              resizeMode={ResizeMode.COVER}
              shouldPlay={!isFullscreenPaused}
              useNativeControls={false}
              onLoadStart={() => setFullscreenError("")}
              onReadyForDisplay={() => setFullscreenError("")}
              onError={() => {
                setFullscreenError("Reconectando sinal...");
                scheduleFullscreenReconnect();
              }}
            />
          ) : (
            <View style={styles.previewEmpty}>
              <Text style={styles.previewEmptyText}>Sem sinal</Text>
            </View>
          )}

          {showFullscreenUi && (
            <>
              <View style={styles.fullscreenTopOverlay}>
                <TouchableOpacity
                  onPress={closeFullscreen}
                  style={styles.fullscreenBackBtn}
                >
                  <Text style={styles.fullscreenBackText}>VOLTAR</Text>
                </TouchableOpacity>
              </View>

              {!!fullscreenError && (
                <Text style={styles.fullscreenStatusText}>{fullscreenError}</Text>
              )}

              <View style={styles.fullscreenEpgOverlay}>
                <Text style={styles.overlayNowLine} numberOfLines={1}>
                  {nowProgram
                    ? `Agora: ${formatProgramTime(nowProgram)}  ${nowProgram.title || selectedChannel?.name || ""}`
                    : `Agora: ${selectedChannel?.name || "Sem canal"}`}
                </Text>

                <View style={styles.progressTrackFullscreen}>
                  <View
                    style={[styles.progressFill, { width: `${progressPercent}%` }]}
                  />
                </View>

                <Text style={styles.overlayNextLine} numberOfLines={1}>
                  {nextProgram
                    ? `Próximo: ${formatProgramTime(nextProgram)}  ${nextProgram.title || ""}`
                    : "Próximo: Sem próximo programa"}
                </Text>

                <View style={styles.fullscreenBottomControls}>
                  <TouchableOpacity style={styles.pauseBtn} onPress={goToPreviousChannel}>
                    <Text style={styles.pauseBtnText}>◀</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.pauseBtn} onPress={togglePauseFullscreen}>
                    <Text style={styles.pauseBtnText}>
                      {isFullscreenPaused ? "PLAY" : "PAUSE"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.pauseBtn} onPress={goToNextChannel}>
                    <Text style={styles.pauseBtnText}>▶</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </TouchableOpacity>
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
    width: "100%",
    height: isPhone ? 118 : 220,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 8,
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

  playerStatusText: {
    color: "#ffd94d",
    fontSize: isPhone ? 8 : 11,
    marginBottom: 8,
    textAlign: "center",
  },

  epgBox: {
    flex: 1,
    backgroundColor: "#10183f",
    borderRadius: 8,
  },

  epgBoxContent: {
    padding: isPhone ? 10 : 14,
  },

  epgTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  channelInfoWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },

  channelNumberLarge: {
    color: "#38d7ff",
    fontSize: isPhone ? 16 : 22,
    fontWeight: "900",
    marginRight: 10,
  },

  channelMetaWrap: {
    flex: 1,
  },

  epgActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  smallControlBtn: {
    minWidth: isPhone ? 40 : 52,
    height: isPhone ? 28 : 34,
    borderRadius: 8,
    backgroundColor: "rgba(7,20,35,0.85)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginRight: 8,
  },

  smallControlBtnText: {
    color: "#38d7ff",
    fontSize: isPhone ? 8 : 10,
    fontWeight: "900",
  },

  pauseBtn: {
    minWidth: isPhone ? 58 : 74,
    height: isPhone ? 30 : 34,
    borderRadius: 8,
    backgroundColor: "rgba(7,20,35,0.85)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginRight: 8,
  },

  pauseBtnText: {
    color: "#38d7ff",
    fontSize: isPhone ? 8 : 10,
    fontWeight: "900",
  },

  favoriteBtn: {
    minWidth: isPhone ? 40 : 44,
    height: isPhone ? 28 : 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#38d7ff",
    backgroundColor: "rgba(56,215,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  favoriteBtnText: {
    color: "#38d7ff",
    fontSize: isPhone ? 12 : 14,
    fontWeight: "900",
  },

  epgHeader: {
    color: "#38d7ff",
    fontSize: isPhone ? 10 : 14,
    fontWeight: "900",
  },

  epgTime: {
    color: "#ffd94d",
    fontSize: isPhone ? 8.5 : 11,
    fontWeight: "900",
    marginBottom: 4,
  },

  epgTitle: {
    color: "#fff",
    fontSize: isPhone ? 10.5 : 15,
    fontWeight: "900",
    marginBottom: 6,
  },

  epgSub: {
    color: "#c4d1df",
    fontSize: isPhone ? 8.5 : 11,
  },

  epgDesc: {
    color: "#d7e1ec",
    fontSize: isPhone ? 8.5 : 11,
    lineHeight: isPhone ? 13 : 17,
  },

  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginBottom: 8,
  },

  progressTrackFullscreen: {
    width: "100%",
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
    overflow: "hidden",
    marginBottom: 6,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#38d7ff",
  },

  nextProgramBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  nextProgramLabel: {
    color: "#38d7ff",
    fontSize: isPhone ? 8.5 : 10,
    fontWeight: "900",
    marginBottom: 4,
  },

  nextProgramTitle: {
    color: "#fff",
    fontSize: isPhone ? 9.5 : 12,
    fontWeight: "700",
  },

  nextProgramTime: {
    color: "#c4d1df",
    fontSize: isPhone ? 8 : 10,
    marginTop: 4,
  },

  debugBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(56,215,255,0.25)",
  },

  debugTitle: {
    color: "#38d7ff",
    fontSize: isPhone ? 9 : 11,
    fontWeight: "900",
    marginBottom: 6,
  },

  debugText: {
    color: "#d7e1ec",
    fontSize: isPhone ? 8 : 10,
    marginBottom: 2,
  },

  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  fullscreenVideoAbsolute: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },

  fullscreenTopOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: isPhone ? 18 : 24,
    paddingHorizontal: 10,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  fullscreenBackBtn: {
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

  fullscreenStatusText: {
    position: "absolute",
    top: isPhone ? 70 : 80,
    alignSelf: "center",
    color: "#ffd94d",
    fontSize: isPhone ? 8 : 11,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  fullscreenEpgOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "rgba(5,7,13,0.30)",
  },

  overlayNowLine: {
    color: "#ffffff",
    fontSize: isPhone ? 8 : 11,
    fontWeight: "700",
    marginBottom: 4,
  },

  overlayNextLine: {
    color: "#d8e5f0",
    fontSize: isPhone ? 7.5 : 10,
    fontWeight: "600",
  },

  fullscreenBottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});
