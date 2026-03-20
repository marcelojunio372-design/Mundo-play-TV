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
  ScrollView,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

const { width, height } = Dimensions.get("window");
const isPhone = width < 900;

export default function MovieDetailsScreen({ movie, onBack }) {
  const videoRef = useRef(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [statusText, setStatusText] = useState("");

  if (!movie) return null;

  const description =
    movie.description ||
    movie.plot ||
    movie.synopsis ||
    "Sem descrição na lista.";

  const openPlayer = () => {
    if (!movie?.url) return;
    setStatusText("");
    setShowPlayer(true);
  };

  const closePlayer = async () => {
    try {
      await videoRef.current?.stopAsync?.();
    } catch (e) {}
    setShowPlayer(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={
          movie.backdrop
            ? { uri: movie.backdrop }
            : movie.cover
            ? { uri: movie.cover }
            : movie.logo
            ? { uri: movie.logo }
            : undefined
        }
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
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
              </View>

              <Text style={styles.title}>{movie.name || "Sem nome"}</Text>

              <Text style={styles.meta}>
                {(movie.year || "-") + " • " + (movie.group || "Filmes")}
              </Text>

              <Text style={styles.label}>Descrição</Text>
              <Text style={styles.desc}>{description}</Text>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>

      <Modal
        visible={showPlayer}
        animationType="fade"
        transparent={false}
        onRequestClose={closePlayer}
        statusBarTranslucent
      >
        <View style={styles.playerScreen}>
          <Video
            ref={videoRef}
            source={{ uri: movie.url }}
            style={styles.fullscreenVideo}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            isLooping={false}
            onLoadStart={() => setStatusText("Carregando vídeo...")}
            onLoad={() => setStatusText("")}
            onReadyForDisplay={() => setStatusText("")}
            onError={(error) => {
              const msg =
                typeof error === "string"
                  ? error
                  : error?.errorString || "Falha ao reproduzir este vídeo.";
              setStatusText(msg);
            }}
          />

          <View style={styles.playerTopOverlay}>
            <TouchableOpacity onPress={closePlayer} style={styles.playerBackBtn}>
              <Text style={styles.playerBackText}>VOLTAR</Text>
            </TouchableOpacity>
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
    backgroundColor: "#080b12",
  },

  bg: {
    flex: 1,
  },

  bgImage: {
    opacity: 0.20,
  },

  scrollContent: {
    flexGrow: 1,
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
    paddingHorizontal: isPhone ? 18 : 60,
    paddingTop: isPhone ? 60 : 40,
    paddingBottom: 24,
    backgroundColor: "rgba(10,8,16,0.62)",
  },

  poster: {
    width: isPhone ? 130 : 200,
    height: isPhone ? 190 : 300,
    borderRadius: 12,
    backgroundColor: "#26354b",
  },

  infoWrap: {
    flex: 1,
    marginLeft: isPhone ? 0 : 24,
    marginTop: isPhone ? 18 : 0,
    width: "100%",
    backgroundColor: "rgba(60,36,72,0.55)",
    padding: isPhone ? 16 : 20,
    borderRadius: 14,
  },

  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  actionBtn: {
    height: isPhone ? 40 : 46,
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

  title: {
    color: "#fff",
    fontSize: isPhone ? 22 : 34,
    fontWeight: "900",
  },

  meta: {
    color: "#d9d0de",
    fontSize: isPhone ? 11 : 16,
    marginTop: 8,
  },

  label: {
    color: "#38d7ff",
    fontSize: isPhone ? 11 : 14,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 6,
  },

  desc: {
    color: "#f1edf4",
    fontSize: isPhone ? 12 : 16,
    lineHeight: isPhone ? 18 : 24,
  },

  playerScreen: {
    flex: 1,
    backgroundColor: "#000",
  },

  fullscreenVideo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },

  playerTopOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: isPhone ? 18 : 26,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  playerBackBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#102033",
  },

  playerBackText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: 12,
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
