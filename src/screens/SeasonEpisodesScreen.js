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
import { Video, ResizeMode } from "expo-av";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

export default function SeasonEpisodesScreen({ series, season, onBack }) {
  const episodes = Array.isArray(season?.episodes) ? season.episodes : [];
  const videoRef = useRef(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [statusText, setStatusText] = useState("");

  const openEpisode = (item) => {
    if (!item?.url) return;
    setStatusText("");
    setSelectedEpisode(item);
  };

  const closePlayer = async () => {
    try {
      await videoRef.current?.stopAsync?.();
    } catch (e) {}
    setSelectedEpisode(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.leftPanel}>
        <TouchableOpacity onPress={onBack} style={styles.backWrap}>
          <Text style={styles.backText}>VOLTAR</Text>
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
        statusBarTranslucent
      >
        <View style={styles.playerScreen}>
          {selectedEpisode?.url ? (
            <Video
              ref={videoRef}
              source={{ uri: selectedEpisode.url }}
              style={styles.fullscreenVideo}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
              onLoadStart={() => setStatusText("Carregando episódio...")}
              onLoad={() => setStatusText("")}
              onReadyForDisplay={() => setStatusText("")}
              onError={() => setStatusText("Falha ao reproduzir este episódio.")}
            />
          ) : (
            <View style={styles.playerEmpty}>
              <Text style={styles.playerEmptyText}>URL do episódio não encontrada</Text>
            </View>
          )}

          <View style={styles.playerTopOverlay}>
            <TouchableOpacity onPress={closePlayer} style={styles.playerBackBtn}>
              <Text style={styles.playerBackText}>VOLTAR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.playerBottomOverlay}>
            <Text style={styles.playerTitle} numberOfLines={1}>
              {selectedEpisode?.title || "Episódio"}
            </Text>

            <Text style={styles.playerMeta} numberOfLines={1}>
              {season?.name || "Temporada"} • {series?.name || "Série"}
            </Text>

            <Text style={styles.playerDesc} numberOfLines={3}>
              {selectedEpisode?.description || "Descrição do episódio."}
            </Text>
          </View>

          {!!statusText && (
            <View style={styles.statusOverlay}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          )}
        </View>
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
    backgroundColor: "#102033",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  backText: {
    color: "#38d7ff",
    fontSize: isPhone ? 14 : 18,
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
    backgroundColor: "#000",
  },

  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },

  playerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },

  playerEmptyText: {
    color: "#fff",
    fontSize: 14,
  },

  playerTopOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: isPhone ? 18 : 26,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  playerBackBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#102033",
    borderRadius: 8,
  },

  playerBackText: {
    color: "#38d7ff",
    fontWeight: "800",
    fontSize: 12,
  },

  playerBottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  playerTitle: {
    color: "#fff",
    fontSize: isPhone ? 16 : 22,
    fontWeight: "900",
    marginBottom: 6,
  },

  playerMeta: {
    color: "#c7d2df",
    fontSize: isPhone ? 11 : 14,
    marginBottom: 8,
  },

  playerDesc: {
    color: "#e7edf5",
    fontSize: isPhone ? 12 : 15,
    lineHeight: isPhone ? 18 : 22,
  },

  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 20,
  },

  statusText: {
    color: "#fff",
    textAlign: "center",
    fontSize: isPhone ? 11 : 14,
  },
});
