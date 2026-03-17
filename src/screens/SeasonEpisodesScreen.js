import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

export default function SeasonEpisodesScreen({ series, season, onBack }) {
  const episodes = season?.episodes || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.leftPanel}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap}>
          <Text style={styles.backText}>↩</Text>
        </TouchableOpacity>

        <Text style={styles.seasonTitle}>{season?.name || "Temporada 1"}</Text>
      </View>

      <View style={styles.rightPanel}>
        <Text style={styles.mainTitle}>{series?.name || "Série"}</Text>

        <FlatList
          data={episodes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.epRow}
              onPress={() => {
                if (!item.url) {
                  Alert.alert("Erro", "URL do episódio não encontrada");
                  return;
                }
                Alert.alert("Player", `Abrindo ${item.title}`);
              }}
            >
              <Image
                source={item.logo ? { uri: item.logo } : undefined}
                style={styles.epThumb}
              />
              <View style={styles.epInfo}>
                <Text style={styles.epNumber}>{index + 1}</Text>
                <Text style={styles.epTitle}>{item.title}</Text>
                <Text style={styles.epDesc} numberOfLines={3}>
                  {item.description || "Descrição do episódio."}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#121018" },

  leftPanel: {
    width: isPhone ? 120 : 230,
    backgroundColor: "#10202f",
    padding: 16,
  },
  backWrap: { marginBottom: 30 },
  backText: { color: "#fff", fontSize: isPhone ? 22 : 30, fontWeight: "900" },
  seasonTitle: { color: "#ffe04f", fontSize: isPhone ? 14 : 22, fontWeight: "900" },

  rightPanel: { flex: 1, padding: 18 },
  mainTitle: {
    color: "#fff",
    fontSize: isPhone ? 18 : 30,
    textAlign: "right",
    marginBottom: 16,
  },

  epRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
    minHeight: isPhone ? 90 : 120,
  },
  epThumb: {
    width: isPhone ? 120 : 180,
    height: "100%",
    backgroundColor: "#3b425a",
  },
  epInfo: { flex: 1, padding: 10 },
  epNumber: { color: "#ff4c4c", fontSize: isPhone ? 10 : 14, fontWeight: "900" },
  epTitle: { color: "#fff", fontSize: isPhone ? 12 : 18, fontWeight: "700", marginTop: 2 },
  epDesc: { color: "#e6e6e6", fontSize: isPhone ? 10 : 14, marginTop: 6 },
});
