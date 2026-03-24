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
    { time: "12:00 ~ 16:00", title: `${name} - ao vivo` },
    { time: "16:00 ~ 20:00", title: "Programação contínua" },
    { time: "20:00 ~ 00:00", title: "Faixa principal" },
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

  const epgItems = useMemo(() => getFakeEpg(selectedChannel?.name || ""), [selectedChannel]);

  const renderCategoryItem = ({ item }) => {
    const active = item.key === selectedCategoryKey;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, active && styles.categoryItemActive]}
        onPress={() => handleSelectCategory(item)}
      >
        <Text style={[styles.categoryName, active && styles.categoryNameActive]} numberOfLines={1}>
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
                      setIsBuffering(!!status.isBuffering);
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
                    <Text style={styles.playerOverlayText}>Carregando transmissão...</Text>
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
                <Text style={styles.emptyPlayerText}>Selecione um canal para reproduzir.</Text>
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
    height: 42,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#050915",
  },

  topNavText: {
    color: "#e6e6e6",
    fontSize: 10,
  },

  topNavTextActive: {
    color: "#f0c63c",
    fontSize: 10,
    fontWeight: "800",
  },

  topSeparator: {
    color: "#b2b2b2",
    marginHorizontal: 8,
  },

  searchWrap: {
    marginLeft: 10,
    width: 150,
    height: 30,
    borderWidth: 2,
    borderColor: "#ececec",
    borderRadius: 15,
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  searchInput: {
    color: "#ffffff",
    padding: 0,
    fontSize: 11,
  },

  layout: {
    flex: 1,
    flexDirection: "row",
  },

  leftCol: {
    width: 150,
    backgroundColor: "#2a1124",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  middleCol: {
    width: 180,
    backgroundColor: "#15111f",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },

  rightCol: {
    flex: 1,
    backgroundColor: "#071122",
  },

  categoryItem: {
    minHeight: 40,
    paddingHorizontal: 10,
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
    fontSize: 10,
    flex: 1,
    marginRight: 8,
  },

  categoryNameActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  categoryCount: {
    color: "#d4d4d4",
    fontSize: 10,
  },

  categoryCountActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  channelItem: {
    minHeight: 40,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  channelItemActive: {
    backgroundColor: "#3f3848",
  },

  channelNumber: {
    width: 20,
    color: "#d9d9d9",
    fontSize: 10,
    textAlign: "center",
  },

  channelLogo: {
    width: 14,
    height: 14,
    resizeMode: "contain",
    marginHorizontal: 5,
  },

  channelLogoFallback: {
    width: 14,
    height: 14,
    marginHorizontal: 5,
    borderRadius: 3,
    backgroundColor: "#39465c",
  },

  channelName: {
    flex: 1,
    color: "#f3f3f3",
    fontSize: 10,
  },

  channelNameActive: {
    color: "#f0d24c",
    fontWeight: "800",
  },

  playerWrap: {
    height: 180,
    backgroundColor: "#000000",
    margin: 6,
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
    paddingHorizontal: 10,
  },

  playerOverlayText: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyPlayer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },

  emptyPlayerText: {
    color: "#ffffff",
    fontSize: 10,
    textAlign: "center",
  },

  infoBlock: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  channelInfoTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },

  channelInfoGroup: {
    color: "#d2d2d2",
    fontSize: 10,
    marginTop: 3,
    marginBottom: 8,
  },

  epgWrap: {
    marginTop: 2,
  },

  epgRow: {
    flexDirection: "row",
    marginBottom: 6,
  },

  epgTime: {
    width: 72,
    color: "#f0d24c",
    fontSize: 10,
  },

  epgTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 10,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  actionBtn: {
    width: 66,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#7e5ca8",
    alignItems: "center",
    justifyContent: "center",
  },

  actionBtnText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "lowercase",
  },
});
