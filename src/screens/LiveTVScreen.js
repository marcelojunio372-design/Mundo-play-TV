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
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import {
  loadEPG,
  findNowAndNextForChannel,
  formatProgramTime,
} from "../services/epgService";

const { width, height } = Dimensions.get("window");
const isPhone = width < 900;

function buildCategories(channels = []) {
  const groups = {};

  channels.forEach((item) => {
    const key = String(item.group || "OUTROS").trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return [
    { name: "Tudo", items: channels },
    { name: "Favoritos", items: [] },
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
  const channels = session?.data?.live || [];
  const categories = useMemo(() => buildCategories(channels), [channels]);

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedChannelIndex, setSelectedChannelIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [epgItems, setEpgItems] = useState([]);
  const [epgLoading, setEpgLoading] = useState(true);

  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function fetchEPG() {
      setEpgLoading(true);
      const data = await loadEPG();
      if (active) {
        setEpgItems(data);
        setEpgLoading(false);
      }
    }

    fetchEPG();

    return () => {
      active = false;
    };
  }, []);

  const baseChannels = categories[selectedCategory]?.items || channels;

  const visibleChannels = baseChannels.filter((item) =>
    String(item.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedChannel =
    visibleChannels[selectedChannelIndex] || visibleChannels[0] || null;

  const { nowProgram, nextProgram } = useMemo(() => {
    return findNowAndNextForChannel(epgItems, selectedChannel?.name || "");
  }, [epgItems, selectedChannel]);

  const handleSelectCategory = (index) => {
    setSelectedCategory(index);
    setSelectedChannelIndex(0);
    setSearch("");
  };

  const handleSelectChannel = (index) => {
    setSelectedChannelIndex(index);
  };

  const openFullscreen = async () => {
    if (!selectedChannel?.url) return;
    setShowFullscreen(true);
  };

  const closeFullscreen = async () => {
    try {
      await fullscreenVideoRef.current?.stopAsync?.();
    } catch (e) {}
    setShowFullscreen(false);
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
            onChangeText={setSearch}
            placeholder="buscar"
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
            renderItem={({ item, index }) => {
              const active = index === selectedCategory;
              return (
                <TouchableOpacity
                  style={[styles.categoryRow, active && styles.categoryActive]}
                  onPress={() => handleSelectCategory(index)}
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
            }}
          />
        </View>

        <View style={styles.centerPanel}>
          <FlatList
            data={visibleChannels}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            renderItem={({ item, index }) => {
              const active = index === selectedChannelIndex;

              return (
                <TouchableOpacity
                  style={[styles.channelRow, active && styles.channelRowActive]}
                  onPress={() => handleSelectChannel(index)}
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
                      {item.name || "Sem nome"}
                    </Text>

                    <Text style={styles.channelSub} numberOfLines={1}>
                      {item.group || "Canal"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.rightPanel}>
          <View style={styles.previewBox}>
            {selectedChannel?.url ? (
              <Video
                ref={videoRef}
                source={{ uri: selectedChannel.url }}
                style={styles.previewVideo}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
              />
            ) : (
              <View style={styles.previewEmpty}>
                <Text style={styles.previewEmptyText}>
                  Selecione um canal
                </Text>
              </View>
            )}
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.actionBtnSmall}>
              <Text style={styles.actionBtnText}>PLAY</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnSmall}>
              <Text style={styles.actionBtnText}>PAUSE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSmall}
              onPress={openFullscreen}
            >
              <Text style={styles.actionBtnText}>FULL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.epgBox}>
            <Text style={styles.epgHeader}>EPG</Text>

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

                <Text style={styles.epgSub} numberOfLines={1}>
                  {selectedChannel?.group
                    ? `Grupo: ${selectedChannel.group}`
                    : "Grupo: -"}
                </Text>

                <Text style={styles.epgDesc} numberOfLines={4}>
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
              </>
            )}
          </View>
        </View>
      </View>

      <Modal
        visible={showFullscreen}
        animationType="fade"
        transparent={false}
        onRequestClose={closeFullscreen}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.fullscreenContainer}>
          <StatusBar hidden />

          <View style={styles.fullscreenTop}>
            <TouchableOpacity
              onPress={closeFullscreen}
              style={styles.fullscreenBackBtn}
            >
              <Text style={styles.fullscreenBackText}>VOLTAR</Text>
            </TouchableOpacity>

            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {selectedChannel?.name || "Canal"}
            </Text>
          </View>

          <View style={styles.fullscreenVideoWrap}>
            {selectedChannel?.url ? (
              <Video
                ref={fullscreenVideoRef}
                source={{ uri: selectedChannel.url }}
                style={styles.fullscreenVideo}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
              />
            ) : (
              <View style={styles.previewEmpty}>
                <Text style={styles.previewEmptyText}>Sem sinal</Text>
              </View>
            )}
          </View>

          <View style={styles.fullscreenEpg}>
            <Text style={styles.epgHeader}>EPG</Text>
            <Text style={styles.epgTime}>
              {nowProgram ? formatProgramTime(nowProgram) : "Ao vivo agora"}
            </Text>
            <Text style={styles.epgTitle} numberOfLines={2}>
              {nowProgram?.title || selectedChannel?.name || "Sem canal"}
            </Text>
            <Text style={styles.epgSub} numberOfLines={1}>
              {selectedChannel?.group
                ? `Grupo: ${selectedChannel.group}`
                : "Grupo: -"}
            </Text>
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
    width: isPhone ? 90 : 180,
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

  rightPanel: {
    flex: 1,
    backgroundColor: "#0b1338",
    padding: 8,
  },

  previewBox: {
    width: "100%",
    height: isPhone ? height * 0.24 : 260,
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

  previewActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
    gap: 8,
  },

  actionBtnSmall: {
    minWidth: isPhone ? 62 : 90,
    minHeight: isPhone ? 34 : 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#38d7ff",
    backgroundColor: "rgba(56,215,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  actionBtnText: {
    color: "#38d7ff",
    fontSize: isPhone ? 9 : 12,
    fontWeight: "900",
  },

  epgBox: {
    backgroundColor: "#10183f",
    borderRadius: 8,
    padding: 10,
  },

  epgHeader: {
    color: "#38d7ff",
    fontSize: isPhone ? 10 : 13,
    fontWeight: "900",
    marginBottom: 6,
  },

  epgTime: {
    color: "#ffd94d",
    fontSize: isPhone ? 8 : 11,
    fontWeight: "900",
    marginBottom: 4,
  },

  epgTitle: {
    color: "#fff",
    fontSize: isPhone ? 10 : 14,
    fontWeight: "900",
    marginBottom: 4,
  },

  epgSub: {
    color: "#c4d1df",
    fontSize: isPhone ? 8 : 11,
    marginBottom: 6,
  },

  epgDesc: {
    color: "#d7e1ec",
    fontSize: isPhone ? 8 : 11,
    lineHeight: isPhone ? 12 : 16,
  },

  nextProgramBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  nextProgramLabel: {
    color: "#38d7ff",
    fontSize: isPhone ? 8 : 10,
    fontWeight: "900",
    marginBottom: 4,
  },

  nextProgramTitle: {
    color: "#fff",
    fontSize: isPhone ? 9 : 12,
    fontWeight: "700",
  },

  nextProgramTime: {
    color: "#c4d1df",
    fontSize: isPhone ? 8 : 10,
    marginTop: 4,
  },

  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  fullscreenTop: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#05070d",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  fullscreenBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#102033",
  },

  fullscreenBackText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: 12,
  },

  fullscreenTitle: {
    flex: 1,
    color: "#fff",
    marginLeft: 12,
    fontSize: isPhone ? 12 : 16,
    fontWeight: "800",
  },

  fullscreenVideoWrap: {
    width: "100%",
    height: height * 0.62,
    backgroundColor: "#000",
  },

  fullscreenVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  fullscreenEpg: {
    flex: 1,
    padding: 14,
    backgroundColor: "#05070d",
  },
});
