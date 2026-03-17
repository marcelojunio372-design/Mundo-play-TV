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
        {/* ESQUERDA */}
        <View style={styles.leftPanel}>
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

        {/* MEIO */}
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

        {/* DIREITA */}
        <View style={styles.rightPanel}>
          <Text style={styles.previewTitle}>MUNDO PLAY TV</Text>
          <Text style={styles.previewChannel} numberOfLines={2}>
            {selectedChannel?.name || "Sem canal"}
          </Text>

          <View style={styles.previewBox}>
            {selectedChannel?.url && (
              <Video
                ref={videoRef}
                source={{ uri: selectedChannel.url }}
                style={styles.previewVideo}
                resizeMode="contain"
                shouldPlay={false}
                useNativeControls={false}
              />
            )}
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
  container: { flex: 1, backgroundColor: "#0d1038" },

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
    padding: 4,
  },

  /* ESQUERDA */
  leftPanel: {
    width: isPhone ? 70 : 160,
  },

  categoryRow: {
    height: isPhone ? 26 : 40,
    paddingHorizontal: 5,
    marginBottom: 2,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryActive: {
    backgroundColor: "#73edf0",
  },

  categoryText: {
    color: "#fff",
    fontSize: isPhone ? 6 : 9,
    fontWeight: "800",
  },

  categoryTextActive: {
    color: "#13233c",
  },

  categoryCount: {
    color: "#fff",
    fontSize: isPhone ? 6 : 9,
    fontWeight: "900",
  },

  /* MEIO */
  centerPanel: {
    flex: 1,
    paddingHorizontal: 2,
  },

  channelRow: {
    height: isPhone ? 28 : 40,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  channelRowActive: {
    backgroundColor: "rgba(115,237,240,0.16)",
  },

  logoBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#213d75",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },

  logoText: {
    color: "#fff",
    fontSize: 6,
    fontWeight: "900",
  },

  channelName: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "900",
  },

  channelNameActive: {
    color: "#9efcff",
  },

  channelGroup: {
    color: "#c7d2eb",
    fontSize: 5.5,
  },

  /* DIREITA */
  rightPanel: {
    width: isPhone ? 90 : 200,
  },

  previewTitle: {
    color: "#47d9ff",
    fontSize: 7,
    fontWeight: "900",
  },

  previewChannel: {
    color: "#fff",
    fontSize: 6,
    marginBottom: 4,
  },

  previewBox: {
    width: "100%",
    height: 70,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 6,
  },

  previewVideo: {
    width: "100%",
    height: "100%",
  },

  playerButtons: {
    flexDirection: "row",
    marginBottom: 6,
  },

  smallBtn: {
    flex: 1,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
  },

  smallBtnText: {
    color: "#38d7ff",
    fontSize: 6,
    fontWeight: "900",
  },

  actionBtn: {
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  actionBtnText: {
    color: "#38d7ff",
    fontSize: 7,
    fontWeight: "900",
  },
});
