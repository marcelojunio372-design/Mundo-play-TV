import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

export default function LiveTVScreen({ session, onBack, onOpenSettings, onLogout }) {
  const realChannels = session?.type === "m3u" ? session?.data?.channels || [] : [];
  const channels = realChannels.slice(0, 200);

  const [selectedChannel, setSelectedChannel] = useState(0);
  const current = channels[selectedChannel];

  const categories = [
    { id: "1", name: "TODOS OS CANAIS", count: channels.length },
    { id: "2", name: "FAVORITOS", count: 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>| Ao vivo</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.left}>
          <Text style={styles.blockTitle}>Pesquisa em categorias</Text>

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
          <Text style={styles.previewText}>Pressione "OK" para jogar</Text>
          <View style={styles.previewBox} />
          <Text style={styles.info}>Canal: {current?.name || "Nenhum"}</Text>
          <Text style={styles.info}>Grupo: {current?.group || "-"}</Text>

          <TouchableOpacity style={styles.btn} onPress={onBack}>
            <Text style={styles.btnText}>VOLTAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={onOpenSettings}>
            <Text style={styles.btnText}>CONFIG.</Text>
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
    height: 48,
    backgroundColor: "#2b2f66",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  headerText: {
    color: "#d9f6ff",
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    flexDirection: "row",
    padding: 6,
  },
  left: {
    width: 130,
    paddingRight: 6,
  },
  center: {
    flex: 1,
    paddingHorizontal: 6,
  },
  right: {
    width: 120,
    paddingLeft: 6,
  },
  blockTitle: {
    color: "#dff8ff",
    fontSize: 10,
    marginBottom: 8,
  },
  categoryRow: {
    minHeight: 40,
    paddingHorizontal: 8,
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
    fontSize: 10,
    fontWeight: "700",
    flexShrink: 1,
  },
  categoryTextActive: {
    color: "#0d2340",
  },
  channelRow: {
    minHeight: 42,
    paddingHorizontal: 8,
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
    marginBottom: 8,
  },
  previewBox: {
    height: 110,
    backgroundColor: "#1a2246",
    marginBottom: 8,
  },
  info: {
    color: "#fff",
    fontSize: 8,
    marginBottom: 4,
  },
  btn: {
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 6,
    alignItems: "center",
  },
  btnText: {
    color: "#38d7ff",
    fontSize: 9,
    fontWeight: "900",
  },
});



