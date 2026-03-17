import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import VideoPlayer from "../components/VideoPlayer";

function buildCategories(channels) {
  const grouped = {};
  channels.forEach((item) => {
    const group = item.group || "OUTROS";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  const categories = [
    { id: "all", name: "TODOS", items: channels },
    { id: "fav", name: "FAVORITOS", items: [] },
  ];

  Object.keys(grouped).forEach((group, index) => {
    categories.push({ id: `group_${index}`, name: group.toUpperCase(), items: grouped[group] });
  });

  return categories;
}

export default function LiveTVScreen({ session, onBack, onOpenSettings, onLogout }) {
  const channels = useMemo(() => session?.data?.channels || [], [session]);
  const categories = useMemo(() => buildCategories(channels), [channels]);

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState(0);

  const visibleChannels = categories[selectedCategory]?.items || [];
  const current = visibleChannels[selectedChannel];

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
                  onPress={() => {
                    setSelectedCategory(index);
                    setSelectedChannel(0);
                  }}
                >
                  <Text style={[styles.categoryName, active && styles.categoryNameActive]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.categoryCount, active && styles.categoryNameActive]}>
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
                      <Text style={styles.channelLogoText}>{(item.name || "TV").slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}

                  <View style={styles.channelInfo}>
                    <Text style={[styles.channelName, active && styles.channelNameActive]} numberOfLines={1}>
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
          <VideoPlayer url={current?.url} title={current?.name} compact brand="MUNDO PLAY TV" />

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle} numberOfLines={2}>{current?.name || "Nenhum canal"}</Text>
            <Text style={styles.infoText}>Grupo: {current?.group || "-"}</Text>
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
  container: { flex: 1, backgroundColor: "#101737" },
  header: {
    height: 38,
    backgroundColor: "#3a3d7a",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  headerTitle: { color: "#e8fbff", fontSize: 10, fontWeight: "800" },
  content: { flex: 1, flexDirection: "row", padding: 4 },
  leftPanel: { width: 86, paddingRight: 4 },
  leftTitle: { color: "#dff8ff", fontSize: 7, marginBottom: 6 },
  categoryRow: {
    minHeight: 30,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  categoryRowActive: { backgroundColor: "#6de9ea", borderRadius: 4 },
  categoryName: { color: "#fff", fontSize: 7, fontWeight: "800", flex: 1, marginRight: 4 },
  categoryNameActive: { color: "#0d2340" },
  categoryCount: { color: "#fff", fontSize: 7, fontWeight: "800" },
  centerPanel: { flex: 1, paddingHorizontal: 4 },
  channelRow: {
    minHeight: 34,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  channelRowActive: { backgroundColor: "#6de9ea", borderRadius: 4 },
  channelLogo: { width: 20, height: 20, borderRadius: 4, marginRight: 6, backgroundColor: "#29456b" },
  channelLogoFallback: {
    width: 20, height: 20, borderRadius: 4, marginRight: 6,
    backgroundColor: "#29456b", alignItems: "center", justifyContent: "center"
  },
  channelLogoText: { color: "#fff", fontSize: 6, fontWeight: "900" },
  channelInfo: { flex: 1 },
  channelName: { color: "#fff", fontSize: 8, fontWeight: "800" },
  channelNameActive: { color: "#0d2340" },
  channelSub: { color: "#c8defa", fontSize: 6, marginTop: 2 },
  rightPanel: { width: 124, paddingLeft: 4 },
  infoBox: { marginTop: 6, marginBottom: 4 },
  infoTitle: { color: "#fff", fontSize: 8, fontWeight: "900", marginBottom: 3 },
  infoText: { color: "#9fb2c7", fontSize: 7 },
  actionBtn: {
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  actionText: { color: "#38d7ff", fontSize: 7, fontWeight: "900" },
});
