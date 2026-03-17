import React, { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

export default function LiveTVScreen({
  session,
  onBack,
  onOpenSettings,
  onLogout,
}) {
  const liveItems = session?.data?.live || [];

  const categories = useMemo(() => {
    const grouped = {};
    liveItems.forEach((item) => {
      const group = String(item.group || "OUTROS").trim().toUpperCase();
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(item);
    });

    const result = [
      { id: "all", name: "TODOS", items: liveItems },
      { id: "fav", name: "FAVORITOS", items: [] },
    ];

    Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .forEach((group, index) => {
        result.push({
          id: `group_${index}`,
          name: group,
          items: grouped[group],
        });
      });

    return result;
  }, [liveItems]);

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState(
    liveItems.length ? liveItems[0] : null
  );

  const visibleChannels = categories[selectedCategory]?.items || [];
  const videoRef = useRef(null);

  const handleSelectChannel = (item) => {
    setSelectedChannel(item);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>| Ao vivo</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <Text style={styles.leftTitle}>Categorias</Text>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const active = index === selectedCategory;
              return (
                <TouchableOpacity
                  style={[styles.categoryRow, active && styles.categoryActive]}
                  onPress={() => {
                    setSelectedCategory(index);
                    if (item.items.length) setSelectedChannel(item.items[0]);
                  }}
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
            }}
          />
        </View>

        <View style={styles.centerPanel}>
          <FlatList
            data={visibleChannels}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            renderItem={({ item }) => {
              const active = selectedChannel?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.channelRow, active && styles.channelRowActive]}
                  onPress={() => handleSelectChannel(item)}
                >
                  <View style={styles.logoBox}>
                    <Text style={styles.logoText}>
                      {String(item.name || "?").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.channelInfo}>
                    <Text
                      style={[styles.channelName, active && styles.channelNameActive]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.channelGroup} numberOfLines={1}>
                      {item.group || "Canal"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.rightPanel}>
          <Text style={styles.previewTitle}>MUNDO PLAY TV</Text>
          <Text style={styles.previewChannel} numberOfLines={2}>
            {selectedChannel?.name || "Sem canal"}
          </Text>

          <View style={styles.previewBox}>
            {selectedChannel?.url ? (
              <Video
                ref={videoRef}
                source={{ uri: selectedChannel.url }}
                style={styles.previewVideo}
                resizeMode="contain"
                shouldPlay={false}
                useNativeControls={false}
              />
            ) : null}
          </View>

          <View style={styles.playerButtons}>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => videoRef.current?.playAsync()}
            >
              <Text style={styles.smallBtnText}>PLAY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => videoRef.current?.pauseAsync()}
            >
              <Text style={styles.smallBtnText}>PAUSE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => videoRef.current?.presentFullscreenPlayer()}
            >
              <Text style={styles.smallBtnText}>FULL</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sideLabel}>{selectedChannel?.name || "-"}</Text>
          <Text style={styles.sideSub}>Grupo: {selectedChannel?.group || "-"}</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={onBack}>
            <Text style={styles.actionBtnText}>VOLTAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onOpenSettings}>
            <Text style={styles.actionBtnText}>CONFIG.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onLogout}>
            <Text style={styles.actionBtnText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#22245e" },

  header: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "#4f4f96",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0d1038",
    padding: 4,
  },

  leftPanel: {
    width: isPhone ? 84 : 180,
    paddingRight: 4,
  },

  leftTitle: {
    color: "#d8e1f1",
    fontSize: isPhone ? 7 : 10,
    marginBottom: 4,
  },

  categoryRow: {
    minHeight: isPhone ? 32 : 46,
    paddingHorizontal: 6,
    marginBottom: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryActive: {
    backgroundColor: "#73edf0",
  },

  categoryText: {
    color: "#fff",
    fontSize: isPhone ? 6.5 : 10,
    fontWeight: "800",
    flex: 1,
    marginRight: 4,
  },

  categoryTextActive: {
    color: "#13233c",
  },

  categoryCount: {
    color: "#fff",
    fontSize: isPhone ? 6.5 : 10,
    fontWeight: "900",
  },

  centerPanel: {
    flex: 1,
    paddingHorizontal: 3,
  },

  channelRow: {
    minHeight: isPhone ? 40 : 54,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },

  channelRowActive: {
    backgroundColor: "rgba(115,237,240,0.16)",
    borderRadius: 6,
  },

  logoBox: {
    width: isPhone ? 28 : 42,
    height: isPhone ? 28 : 42,
    borderRadius: 6,
    backgroundColor: "#213d75",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  logoText: {
    color: "#fff",
    fontSize: isPhone ? 7 : 11,
    fontWeight: "900",
  },

  channelInfo: {
    flex: 1,
  },

  channelName: {
    color: "#fff",
    fontSize: isPhone ? 7.5 : 11,
    fontWeight: "900",
  },

  channelNameActive: {
    color: "#9efcff",
  },

  channelGroup: {
    color: "#c7d2eb",
    fontSize: isPhone ? 6.5 : 9,
    marginTop: 1,
  },

  rightPanel: {
    width: isPhone ? 96 : 220,
    paddingLeft: 4,
  },

  previewTitle: {
    color: "#47d9ff",
    fontSize: isPhone ? 7 : 11,
    fontWeight: "900",
    marginBottom: 3,
  },

  previewChannel: {
    color: "#fff",
    fontSize: isPhone ? 6.5 : 10,
    fontWeight: "900",
    marginBottom: 4,
  },

  previewBox: {
    width: "100%",
    height: isPhone ? 70 : 150,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 6,
  },

  previewVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  playerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  smallBtn: {
    flex: 1,
    minHeight: isPhone ? 24 : 34,
    borderRadius: 8,
    backgroundColor: "rgba(56,215,255,0.14)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
    paddingHorizontal: 1,
  },

  smallBtnText: {
    color: "#38d7ff",
    fontSize: isPhone ? 5.5 : 8,
    fontWeight: "900",
    textAlign: "center",
  },

  sideLabel: {
    color: "#fff",
    fontSize: isPhone ? 7 : 11,
    fontWeight: "900",
    marginBottom: 3,
  },

  sideSub: {
    color: "#b9c8e1",
    fontSize: isPhone ? 6.5 : 9,
    marginBottom: 8,
  },

  actionBtn: {
    minHeight: isPhone ? 28 : 38,
    borderRadius: 8,
    backgroundColor: "rgba(56,215,255,0.14)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  actionBtnText: {
    color: "#38d7ff",
    fontSize: isPhone ? 7 : 10,
    fontWeight: "900",
  },
});
