import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { Video } from "expo-av";

const { width, height } = Dimensions.get("window");
const isPhone = width < 900;

export default function MovieDetailsScreen({ movie, onBack }) {
  const videoRef = useRef(null);
  const [showPlayer, setShowPlayer] = useState(false);

  if (!movie) return null;

  const openPlayer = () => {
    if (!movie.url) return;
    setShowPlayer(true);
  };

  const closePlayer = async () => {
    try {
      await videoRef.current?.pauseAsync?.();
    } catch (e) {}
    setShowPlayer(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={movie.logo ? { uri: movie.logo } : undefined}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>↩</Text>
        </TouchableOpacity>

        <View style={styles.overlay}>
          <Image
            source={movie.logo ? { uri: movie.logo } : undefined}
            style={styles.poster}
          />

          <View style={styles.infoWrap}>
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionBtn} onPress={openPlayer}>
                <Text style={styles.actionBtnText}>▶ Assistir agora</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>★</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>{movie.name}</Text>

            <Text style={styles.meta}>
              {movie.year || "-"} • {movie.group || "Filmes"}
            </Text>

            <Text style={styles.desc}>
              {movie.description || "Sem descrição na lista."}
            </Text>
          </View>
        </View>
      </ImageBackground>

      <Modal
        visible={showPlayer}
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
              {movie.name}
            </Text>
          </View>

          <View style={styles.playerBox}>
            <Video
              ref={videoRef}
              source={{ uri: movie.url }}
              style={styles.video}
              resizeMode="contain"
              useNativeControls
              shouldPlay
            />
          </View>

          <View style={styles.playerInfo}>
            <Text style={styles.playerInfoTitle}>{movie.name}</Text>
            <Text style={styles.playerInfoMeta}>
              {movie.year || "-"} • {movie.group || "Filmes"}
            </Text>
            <Text style={styles.playerInfoDesc}>
              {movie.description || "Sem descrição na lista."}
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
    backgroundColor: "#080b12",
  },

  bg: {
    flex: 1,
  },

  bgImage: {
    opacity: 0.22,
  },

  backBtn: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 10,
  },

  backText: {
    color: "#fff",
    fontSize: isPhone ? 22 : 30,
    fontWeight: "900",
  },

  overlay: {
    flex: 1,
    flexDirection: isPhone ? "column" : "row",
    alignItems: isPhone ? "flex-start" : "center",
    paddingHorizontal: isPhone ? 20 : 70,
    paddingTop: isPhone ? 70 : 0,
    backgroundColor: "rgba(10,8,16,0.58)",
  },

  poster: {
    width: isPhone ? 140 : 200,
    height: isPhone ? 210 : 300,
    borderRadius: 12,
    backgroundColor: "#26354b",
  },

  infoWrap: {
    flex: 1,
    marginLeft: isPhone ? 0 : 28,
    marginTop: isPhone ? 20 : 0,
    width: "100%",
    backgroundColor: "rgba(60,36,72,0.55)",
    padding: 20,
    borderRadius: 14,
  },

  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  actionBtn: {
    height: 42,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    marginRight: 12,
    borderRadius: 10,
  },

  actionBtnText: {
    color: "#fff",
    fontSize: isPhone ? 12 : 16,
    fontWeight: "700",
  },

  iconBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },

  iconBtnText: {
    color: "#fff",
    fontSize: 20,
  },

  title: {
    color: "#fff",
    fontSize: isPhone ? 24 : 36,
    fontWeight: "900",
  },

  meta: {
    color: "#d9d0de",
    fontSize: isPhone ? 12 : 16,
    marginTop: 8,
  },

  desc: {
    color: "#f1edf4",
    fontSize: isPhone ? 12 : 16,
    marginTop: 18,
    lineHeight: isPhone ? 18 : 25,
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
