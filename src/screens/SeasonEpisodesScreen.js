import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";

const { width, height } = Dimensions.get("window");
const isPhone = width < 900;

export default function SeasonEpisodesScreen({ series, season, onBack }) {
  const episodes = season?.episodes || [];
  const videoRef = useRef(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  const openEpisode = (item) => {
    if (!item?.url) return;
    setSelectedEpisode(item);
  };

  const closePlayer = async () => {
    try {
      await videoRef.current?.pauseAsync?.();
    } catch (e) {}
    setSelectedEpisode(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.leftPanel}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap}>
          <Text style={styles.backText}>↩</Text>
        </TouchableOpacity>

        <Text style={styles.seasonTitle}>
          {season?.name || "Temporada 1"}
        </Text>

        <Text style={styles.seasonCount}>
          Episódios: {episodes.length}
        </Text>
      </View>

      <View style={styles.rightPanel}>
        <Text style={styles.mainTitle}>{series?.name || "Série"}</Text>

        <FlatList
          data={episodes}
          keyExtractor={(item, index) => item.id || `ep_${index}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.epRow}
              onPress={() => openEpisode(item)}
            >
              <Image
                source={item.logo ? { uri: item.logo } : undefined}
                style={styles.epThumb}
              />

              <View style={styles.epInfo}>
                <Text style={styles.epNumber}>{index + 1}</Text>

                <Text style={styles.epTitle} numberOfLines={2}>
                  {item.title || `${series?.name || "Série"} - Episódio ${index + 1}`}
                </Text>

                <Text style={styles.epDesc} numberOfLines={3}>
                  {item.description || "Descrição do episódio."}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <Modal
        visible={!!selectedEpisode}
        animationType="fade"
        transparent={false}
        onRequestClose={closePlayer}
      >
        <SafeAreaView style={styles.playerScreen}>
          <View style={styles.playerTop}>
            <TouchableOpacity onPress={closePlayer} style={styles.playerBackBtn}>
              <Text style={styles.playerBackText}>VOLTAR</Text>
            </TouchableOpacity>

            <Text style={styles.playerTitle} numberOfLines={1}>
              {selectedEpisode?.title || "Episódio"}
            </Text>
          </View>

          <View style={styles.playerBox}>
            {selectedEpisode?.url ? (
              <Video
                ref={videoRef}
                source={{ uri: selectedEpisode.url }}
                style={styles.video}
                resizeMode="contain"
                useNativeControls
                shouldPlay
              />
            ) : (
              <View style={styles.playerEmpty}>
                <Text style={styles.playerEmptyText}>URL do episódio não encontrada</Text>
              </View>
            )}
          </View>

          <View style={styles.playerInfo}>
            <Text style={styles.playerInfoTitle}>
              {selectedEpisode?.title || "Episódio"}
            </Text>

            <Text style={styles.playerInfoMeta}>
              {season?.name || "Temporada"} • {series?.name || "Série"}
            </Text>

            <Text style={styles.playerInfoDesc}>
              {selectedEpisode?.description || "Descrição do episódio."}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#121018",
  },

  leftPanel: {
    width: isPhone ? 120 : 230,
    backgroundColor: "#10202f",
    padding: 16,
  },

  backWrap: {
    marginBottom: 30,
  },

  backText: {
    color: "#fff",
    fontSize: isPhone ? 22 : 30,
    fontWeight: "900",
  },

  seasonTitle: {
    color: "#ffe04f",
    fontSize: isPhone ? 14 : 22,
    fontWeight: "900",
    marginBottom: 12,
  },

  seasonCount: {
    color: "#cdd8e6",
    fontSize: isPhone ? 10 : 14,
  },

  rightPanel: {
    flex: 1,
    padding: 18,
  },

  mainTitle: {
    color: "#fff",
    fontSize: isPhone ? 18 : 30,
    textAlign: "right",
    marginBottom: 16,
    fontWeight: "900",
  },

  epRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
    minHeight: isPhone ? 90 : 120,
    borderRadius: 10,
    overflow: "hidden",
  },

  epThumb: {
    width: isPhone ? 120 : 180,
    height: "100%",
    backgroundColor: "#3b425a",
  },

  epInfo: {
    flex: 1,
    padding: 10,
  },

  epNumber: {
    color: "#ff4c4c",
    fontSize: isPhone ? 10 : 14,
    fontWeight: "900",
  },

  epTitle: {
    color: "#fff",
    fontSize: isPhone ? 12 : 18,
    fontWeight: "700",
    marginTop: 2,
  },

  epDesc: {
    color: "#e6e6e6",
    fontSize: isPhone ? 10 : 14,
    marginTop: 6,
    lineHeight: isPhone ? 14 : 20,
  },

  playerScreen: {
    flex: 1,
    backgroundColor: "#05070d",
  },

  playerTop: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  playerBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#102033",
    borderRadius: 8,
  },

  playerBackText: {
    color: "#38d7ff",
    fontWeight: "800",
    fontSize: 12,
  },

  playerTitle: {
    flex: 1,
    color: "#fff",
    marginLeft: 12,
    fontSize: isPhone ? 12 : 16,
    fontWeight: "800",
  },

  playerBox: {
    width: "100%",
    height: isPhone ? height * 0.34 : height * 0.55,
    backgroundColor: "#000",
  },

  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  playerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  playerEmptyText: {
    color: "#fff",
    fontSize: 14,
  },

  playerInfo: {
    padding: 14,
  },

  playerInfoTitle: {
    color: "#fff",
    fontSize: isPhone ? 18 : 24,
    fontWeight: "900",
    marginBottom: 6,
  },

  playerInfoMeta: {
    color: "#c7d2df",
    fontSize: isPhone ? 11 : 14,
    marginBottom: 8,
  },

  playerInfoDesc: {
    color: "#e7edf5",
    fontSize: isPhone ? 12 : 15,
    lineHeight: isPhone ? 18 : 22,
  },
});
