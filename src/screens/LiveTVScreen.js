import React, { useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Video } from "expo-av";

export default function LiveTVScreen({ session, onBack, onOpenSettings, onLogout }) {
  const channels = useMemo(() => session?.data?.channels || [], [session]);
  const [selectedChannel, setSelectedChannel] = useState(0);
  const current = channels[selectedChannel];
  const videoRef = useRef(null);

  const categories = [
    { id: "1", name: "TODOS", count: channels.length },
    { id: "2", name: "FAVORITOS", count: 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>| Ao vivo</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.left}>
          <Text style={styles.blockTitle}>Categorias</Text>

          {categories.map((item, index) => (
            <View key={item.id} style={[styles.categoryRow, index === 0 && styles.categoryActive]}>
              <Text style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>
                {item.name}
              </Text>
              <Text style={[styles.categoryText, index === 0 && styles.categoryTextActive]}>
                {item.count}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.center}>
          <FlatList
            data={channels}
            keyExtractor={(item, index) => item.id || String(index)}
            initialNumToRender={30}
            maxToRenderPerBatch={30}
            windowSize={10}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.channelRow, selectedChannel === index && styles.channelActive]}
                onPress={() => setSelectedChannel(index)}
              >
                <Text style={styles.channelName} numberOfLines={1}>
                  {item.name || "Sem nome"}
                </Text>
                <Text style={styles.channelGroup} numberOfLines={1}>
                  {item.group || "Canal"}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.right}>
          <Text style={styles.previewText}>Player</Text>

          <View style={styles.previewBox}>
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

          <Text style={styles.info} numberOfLines={1}>
            {current?.name || "Nenhum canal"}
          </Text>

          <Text style={styles.info2} numberOfLines={1}>
            {current?.group || "-"}
          </Text>

          <TouchableOpacity style={styles.btn} onPress={onBack}>
            <Text style={styles.btnText}>VOLTAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={onOpenSettings}>
            <Text style={styles.btnText}>CONF.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={onLogout}>
            <Text style={styles.btnText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101737" },

  header: {
    height: 46,
    backgroundColor: "#2b2f66",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  headerText: {
    color: "#d9f6ff",
    fontSize: 11,
    fontWeight: "700",
  },

  body: {
    flex: 1,
    flexDirection: "row",
    padding: 4,
  },

  left: {
    width: 90,
    paddingRight: 4,
  },

  center: {
    flex: 1,
    paddingHorizontal: 4,
  },

  right: {
    width: 110,
    paddingLeft: 4,
  },

  blockTitle: {
    color: "#dff8ff",
    fontSize: 9,
    marginBottom: 6,
  },

  categoryRow: {
    minHeight: 36,
    paddingHorizontal: 6,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryActive: {
    backgroundColor: "#6de9ea",
    borderRadius: 4,
  },

  categoryText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    flexShrink: 1,
  },

  categoryTextActive: {
    color: "#0d2340",
  },

  channelRow: {
    minHeight: 38,
    paddingHorizontal: 6,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  channelActive: {
    backgroundColor: "#6de9ea",
    borderRadius: 4,
  },

  channelName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  channelGroup: {
    color: "#cfe9ff",
    fontSize: 8,
    marginTop: 2,
  },

  previewText: {
    color: "#dff8ff",
    fontSize: 9,
    textAlign: "center",
    marginBottom: 6,
  },

  previewBox: {
    height: 120,
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

  info: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
    marginBottom: 3,
  },

  info2: {
    color: "#9fb2c7",
    fontSize: 8,
    marginBottom: 6,
  },

  btn: {
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    borderRadius: 8,
    paddingVertical: 7,
    marginTop: 5,
    alignItems: "center",
  },

  btnText: {
    color: "#38d7ff",
    fontSize: 8,
    fontWeight: "900",
  },
});
