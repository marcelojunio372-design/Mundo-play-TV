import React, { useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Video } from "expo-av";

export default function VideoPlayer({ url }) {
  const video = useRef(null);
  const [status, setStatus] = useState({});

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={styles.video}
        source={{ uri: url }}
        resizeMode="contain"
        shouldPlay
        onPlaybackStatusUpdate={(s) => setStatus(s)}
      />

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() =>
            status.isPlaying
              ? video.current.pauseAsync()
              : video.current.playAsync()
          }
        >
          <Text style={styles.btn}>
            {status.isPlaying ? "PAUSE" : "PLAY"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => video.current.presentFullscreenPlayer()}
        >
          <Text style={styles.btn}>TELA CHEIA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
  },

  video: {
    width: "100%",
    height: 220,
  },

  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#111",
  },

  btn: {
    color: "#fff",
    fontWeight: "bold",
  },
});
