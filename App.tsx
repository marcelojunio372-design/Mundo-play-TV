import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Video } from "expo-av";

export default function App() {
  const [m3uUrl, setM3uUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const loadM3U = () => {
    if (!m3uUrl) {
      Alert.alert("Erro", "Digite uma URL M3U válida");
      return;
    }

    // Exemplo simples: usa a própria URL como stream
    setVideoUrl(m3uUrl);
  };

  return (
    <View style={styles.container}>
      {!videoUrl ? (
        <ScrollView contentContainerStyle={styles.loginBox}>
          <Text style={styles.title}>MUNDO PLAY TV</Text>

          <TextInput
            placeholder="Digite sua URL M3U"
            placeholderTextColor="#999"
            style={styles.input}
            value={m3uUrl}
            onChangeText={setM3uUrl}
          />

          <TouchableOpacity style={styles.button} onPress={loadM3U}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.mac}>MAC: 00:1A:79:XX:XX:XX</Text>
        </ScrollView>
      ) : (
        <Video
          source={{ uri: videoUrl }}
          useNativeControls
          resizeMode="contain"
          style={styles.video}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loginBox: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: "#00ff99",
    marginBottom: 30,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    backgroundColor: "#111",
    color: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#00ff99",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
  mac: {
    marginTop: 20,
    color: "#888",
  },
  video: {
    flex: 1,
  },
});
