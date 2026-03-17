import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Video } from "expo-av";

export default function VideoPlayer({ url, title, brand = "MUNDO PLAY TV", compact = false }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.brandBar}>
        <Text style={styles.brand}>{brand}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title || "Preview"}
        </Text>
      </View>

      {url ? (
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={[styles.video, compact && styles.videoCompact]}
          resizeMode="contain"
          useNativeControls
          shouldPlay={false}
          onPlaybackStatusUpdate={(s) => setStatus(s)}
        />
      ) : (
        <View style={[styles.video, compact && styles.videoCompact, styles.placeholder]}>
          <Text style={styles.placeholderText}>Sem vídeo</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => videoRef.current?.playAsync?.()}
        >
          <Text style={styles.btnText}>PLAY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => videoRef.current?.pauseAsync?.()}
        >
          <Text style={styles.btnText}>PAUSE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => videoRef.current?.presentFullscreenPlayer?.()}
        >
          <Text style={styles.btnText}>TELA CHEIA</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status} numberOfLines={1}>
        {status?.isPlaying ? "Reproduzindo" : "Pronto para reproduzir"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0d1b2a",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  containerCompact: {
    borderRadius: 8,
  },
  brandBar: {
    backgroundColor: "#0a1624",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  brand: {
    color: "#38d7ff",
    fontSize: 8,
    fontWeight: "900",
  },
  title: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
  video: {
    width: "100%",
    height: 140,
    backgroundColor: "#000",
  },
  videoCompact: {
    height: 96,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#9fb2c7",
    fontSize: 9,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    padding: 6,
  },
  btn: {
    flex: 1,
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  btnText: {
    color: "#38d7ff",
    fontSize: 7,
    fontWeight: "900",
  },
  status: {
    color: "#9fb2c7",
    fontSize: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});
