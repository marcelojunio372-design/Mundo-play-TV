import React, { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import { Video } from "expo-av";

function buildCategories(channels) {
  const grouped = {};

  channels.forEach((item) => {
    const group = item.group || "OUTROS";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  const categories = [
    {
      id: "all",
      name: "TODOS OS CANAIS",
      items: channels,
    },
    {
      id: "fav",
      name: "FAVORITOS",
      items: [],
    },
  ];

  Object.keys(grouped).forEach((group, index) => {
    categories.push({
      id: `group_${index}`,
      name: group.toUpperCase(),
      items: grouped[group],
    });
  });

  return categories;
}

export default function LiveTVScreen({ session, onBack, onOpenSettings, onLogout }) {
  const videoRef = useRef(null);

  const channels = useMemo(() => session?.data?.channels || [], [session]);
  const categories = useMemo(() => buildCategories(channels), [channels]);

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState(0);

  const visibleChannels = categories[selectedCategory]?.items || [];
  const current = visibleChannels[selectedChannel];

  function selectCategory(index) {
    setSelectedCategory(index);
    setSelectedChannel(0);
  }

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
              const active = selectedCategory === index;
              return (
                <TouchableOpacity
                  style={[styles.categoryRow, active && styles.categoryRowActive]}
                  onPress={() => selectCategory(index)}
                >
                  <Text
                    style={[styles.categoryName, active && styles.categoryNameActive]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={[styles.categoryCount, active && styles.categoryNameActive]}
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
            initialNumToRender={30}
            maxToRenderPerBatch={30}
            windowSize={10}
            renderItem={({ item, index }) => {
              const active = selectedChannel === index;

              return (
                <TouchableOpacity
                  style={[styles.channelRow, active && styles.channelRowActive]}
                  onPress={() => setSelectedChannel(index)}
                >
                  {item.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.channelLogo} />
                  ) : (
                    <View style={styles.channelLogoFallback}>
                      <Text style={styles.channelLogoText}>
                        {(item.name || "TV").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.channelInfo}>
                    <Text
                      style={[styles.channelName, active && styles.channelNameActive]}
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
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum canal encontrado.</Text>
            }
          />
        </View>

        <View style={styles.rightPanel}>
          <Text style={styles.playerTitle}>Preview</Text>

          <View style={styles.playerBox}>
            {current?.url ? (
              <Video
                ref={videoRef}
                source={{ uri: current.url }}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
                shouldPlay={false}
              />
            ) : (
              <View style={styles.videoPlaceholder} />
            )}
          </View>

          <View style={styles.programBox}>
            <Text style={styles.programTitle} numberOfLines={1}>
              {current?.name || "Nenhum canal"}
            </Text>

            <Text style={styles.programSub} numberOfLines={1}>
              {current?.group || "-"}
            </Text>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={onBack}>
            <Text style={styles.actionText}>VOLTAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onOpenSettings}>
            <Text style={styles.actionText}>CONFIG.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={onLogout}>
            <Text style={styles.actionText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101737",
  },

  header: {
    height: 46,
    backgroundColor: "#3a3d7a",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  headerTitle: {
    color: "#e8fbff",
    fontSize: 11,
    fontWeight: "800",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    padding: 4,
  },

  leftPanel: {
    width: 102,
    paddingRight: 4,
  },

  leftTitle: {
    color: "#dff8ff",
    fontSize: 8,
    marginBottom: 8,
  },

  categoryRow: {
    minHeight: 38,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  categoryRowActive: {
    backgroundColor: "#6de9ea",
    borderRadius: 4,
  },

  categoryName: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
    flex: 1,
    marginRight: 4,
  },

  categoryNameActive: {
    color: "#0d2340",
  },

  categoryCount: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
  },

  centerPanel: {
    flex: 1,
    paddingHorizontal: 4,
  },

  channelRow: {
    minHeight: 44,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  channelRowActive: {
    backgroundColor: "#6de9ea",
    borderRadius: 4,
  },

  channelLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: "#29456b",
  },

  channelLogoFallback: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: "#29456b",
    alignItems: "center",
    justifyContent: "center",
  },

  channelLogoText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },

  channelInfo: {
    flex: 1,
  },

  channelName: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },

  channelNameActive: {
    color: "#0d2340",
  },

  channelSub: {
    color: "#c8defa",
    fontSize: 7,
    marginTop: 2,
  },

  rightPanel: {
    width: 118,
    paddingLeft: 4,
  },

  playerTitle: {
    color: "#dff8ff",
    fontSize: 8,
    textAlign: "center",
    marginBottom: 6,
  },

  playerBox: {
    height: 110,
    backgroundColor: "#1a2246",
    marginBottom: 6,
    overflow: "hidden",
  },

  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  videoPlaceholder: {
    flex: 1,
    backgroundColor: "#1a2246",
  },

  programBox: {
    marginBottom: 6,
  },

  programTitle: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
    marginBottom: 2,
  },

  programSub: {
    color: "#9fb2c7",
    fontSize: 7,
    marginBottom: 3,
  },

  actionBtn: {
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  actionText: {
    color: "#38d7ff",
    fontSize: 8,
    fontWeight: "900",
  },

  emptyText: {
    color: "#fff",
    fontSize: 9,
    textAlign: "center",
    marginTop: 20,
  },
});
