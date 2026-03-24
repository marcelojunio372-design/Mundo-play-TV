import React, { useEffect, useMemo, useRef, useState } from "react";
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

function getFakeEpg(channelName = "") {
  const name = safeText(channelName || "Canal");
  return [
    { time: "12:00 PM ~ 04:00 PM", title: `Programa ao vivo - ${name}` },
    { time: "04:00 PM ~ 08:00 PM", title: "Programação contínua" },
    { time: "08:00 PM ~ 12:00 AM", title: "Faixa principal" },
    { time: "12:00 AM ~ 12:30 AM", title: "Conteúdo da madrugada" },
  ];
}

export default function LiveTVScreen({
  session,
  onOpenHome,
  onOpenMovies,
  onOpenSeries,
}) {
  const videoRef = useRef(null);

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
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [playerReloadKey, setPlayerReloadKey] = useState(1);

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

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategoryKey(categories[0].key);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!selectedChannel && visibleChannels.length > 0) {
      const first = visibleChannels[0];
      setSelectedChannelId(first.id);
      setPlayerUri(first.url);
      setPlayerReloadKey((prev) => prev + 1);
      setPlayerError("");
      setIsBuffering(true);
    }
  }, [visibleChannels, selectedChannel]);

  const handleSelectCategory = (category) => {
    setSelectedCategoryKey(category.key);
    setSearch("");

    const first = safeArray(category.items)[0];
    if (first) {
      setSelectedChannelId(first.id);
      setPlayerUri(first.url);
      setPlayerReloadKey((prev) => prev + 1);
      setPlayerError("");
      setIsBuffering(true);
    }
  };

  const handleSelectChannel = async (channel) => {
    if (!channel?.url) return;

    setSelectedChannelId(channel.id);
    setPlayerUri(channel.url);
    setPlayerReloadKey((prev) => prev + 1);
    setPlayerError("");
    setIsBuffering(true);

    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync().catch(() => {});
      }
    } catch (e) {}
  };

  const handleReload = async () => {
    if (!selectedChannel?.url) return;

    setPlayerUri(selectedChannel.url);
    setPlayerReloadKey((prev) => prev + 1);
    setPlayerError("");
    setIsBuffering(true);

    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync().catch(() => {});
      }
    } catch (e) {}
  };

  const epgItems = useMemo(() => {
    return getFakeEpg(selectedChannel?.name || "");
  }, [selectedChannel]);

  const renderCategoryItem = ({ item }) => {
    const active = item.key === selectedCategoryKey;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, active && styles.categoryItemActive]}
        onPress={() => handleSelectCategory(item)}
      >
        <Text style={[styles.categoryName, active && styles.categoryNameActive]}>
          {item.name}
        </Text>
        <Text style={[styles.categoryCount, active && styles.categoryCountActive]}>
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
            initialNumToRender={18}
            maxToRenderPerBatch={24}
            windowSize={8}
          />
        </View>

        <View style={styles.middleCol}>
          <FlatList
            data={visibleChannels}
            keyExtractor={(item, index) => String(item?.id || `ch_${index}`)}
            renderItem={renderChannelItem}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={30}
            windowSize={10}
          />
        </View>

        <View style={styles.rightCol}>
          <View style={styles.playerWrap}>
            {playerUri ? (
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
                  }}
                  onReadyForDisplay={() => {
                    setIsBuffering(false);
                  }}
                  onPlaybackStatusUpdate={(status) => {
                    if (!status) return;

                    if (status.isLoaded) {
                      if (status.isBuffering) {
                        setIsBuffering(true);
                      } else {
                        setIsBuffering(false);
                      }
                    } else if (status.error) {
                      setIsBuffering(false);
                      setPlayerError("Erro ao reproduzir este canal.");
                    }
                  }}
                  onError={() => {
                    setIsBuffering(false);
                    setPlayerError("Erro ao reproduzir este canal.");
                  }}
                />

                {isBuffering && (
                  <View style={styles.playerOverlay}>
                    <ActivityIndicator size="large" color="#35c8ff" />
                    <Text style={styles.playerOverlayText}>
                      Carregando transmissão...
                    </Text>
                  </View>
                )}

                {!!playerError && !isBuffering && (
                  <View style={styles.playerOverlay}>
                    <Text style={styles.playerOverlayText}>{playerError}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyPlayer}>
                <Text style={styles.emptyPlayerText}>
                  Selecione um canal para reproduzir.
                </Text>
              </View>
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
              {epgItems.map((item, index) => (
                <View key={`${item.time}_${index}`} style={styles.epgRow}>
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
                <Text style={styles.actionBtnText}>procurar</Text>
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
    height: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#050915",
  },

  topNavText: {
    color: "#e6e6e6",
    fontSize: 14,
  },

  topNavTextActive: {
    color: "#f0c63c",
    fontSize: 14,
    fontWeight: "800",
  },

  topSeparator: {
    color: "#b2b2b2",
    marginHorizontal: 14,
  },

  searchWrap: {
    marginLeft: 18,
    width: 220,
    height: 40,
    borderWidth: 2,
    borderColor: "#ececec",
    borderRadius: 20,
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  searchInput: {
    color: "#ffffff",
    padding: 0,
  },

  layout: {
    flex: 1,
    flexDirection: "row",
  },

  leftCol: {
    width: 300,
    backgroundColor: "#2a1124",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  middleCol: {
    width: 360,
    backgroundColor: "#15111f",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  rightCol: {
    flex: 1,
    backgroundColor: "#071122",
  },

  categoryItem: {
    minHeight: 56,
    paddingHorizontal: 18,
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
    fontSize: 13,
  },

  categoryNameActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  categoryCount: {
    color: "#d4d4d4",
    fontSize: 13,
  },

  categoryCountActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  channelItem: {
    minHeight: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  channelItemActive: {
    backgroundColor: "#3f3848",
  },

  channelNumber: {
    width: 28,
    color: "#d9d9d9",
    fontSize: 13,
    textAlign: "center",
  },

  channelLogo: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    marginHorizontal: 10,
  },

  channelLogoFallback: {
    width: 24,
    height: 24,
    marginHorizontal: 10,
    borderRadius: 4,
    backgroundColor: "#39465c",
  },

  channelName: {
    flex: 1,
    color: "#f3f3f3",
    fontSize: 14,
  },

  channelNameActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  playerWrap: {
    height: 320,
    backgroundColor: "#000000",
    margin: 8,
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
  },

  playerOverlayText: {
    marginTop: 12,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  emptyPlayer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPlayerText: {
    color: "#ffffff",
    fontSize: 16,
  },

  infoBlock: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  channelInfoTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },

  channelInfoGroup: {
    color: "#d2d2d2",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 14,
  },

  epgWrap: {
    marginTop: 4,
  },

  epgRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  epgTime: {
    width: 180,
    color: "#f0d24c",
    fontSize: 14,
  },

  epgTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },

  actionBtn: {
    width: 150,
    height: 42,
    borderRadius: 4,
    backgroundColor: "#7e5ca8",
    alignItems: "center",
    justifyContent: "center",
  },

  actionBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "lowercase",
  },
});
