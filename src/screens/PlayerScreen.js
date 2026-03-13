
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const params = route?.params || {};
  const item = params?.item || null;
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const section = params?.section || "live";

  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("Carregando player...");
  const [errorText, setErrorText] = useState("");

  const streamUrl = useMemo(() => {
    if (!item) return "";

    if (loginType === "m3u") {
      return item?.url || "";
    }

    const raw = item?.raw || {};
    const streamId = raw?.stream_id;
    const seriesId = raw?.series_id;

    if (section === "live" && streamId) {
      return `${server}/live/${username}/${password}/${streamId}.m3u8`;
    }

    if (section === "vod" && streamId) {
      return `${server}/movie/${username}/${password}/${streamId}.mp4`;
    }

    if (section === "series" && seriesId) {
      return "";
    }

    return item?.url || "";
  }, [item, loginType, server, username, password, section]);

  function handlePlaybackStatusUpdate(status) {
    if (!status) return;

    if (status.isLoaded) {
      setLoading(false);
      setStatusText("");
      setErrorText("");
      return;
    }

    if (status.error) {
      setLoading(false);
      setErrorText("Falha ao reproduzir este conteúdo.");
      Alert.alert("Erro", "Falha ao reproduzir este conteúdo.");
    }
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Item inválido.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (section === "series") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {item?.name || "Série"}
          </Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.infoTitle}>{item?.name || "Série"}</Text>
          <Text style={styles.infoText}>
            O suporte completo para temporadas e episódios entra no próximo pacote.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.actionBtnText}>Voltar para a lista</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!streamUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {item?.name || "Player"}
          </Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.errorText}>URL do stream não encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={1}>
          {item?.name || "Player"}
        </Text>
      </View>

      <View style={styles.playerWrap}>
        <Video
          source={{ uri: streamUrl }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={() => {
            setLoading(false);
            setErrorText("Erro ao abrir vídeo.");
            Alert.alert("Erro", "Erro ao abrir vídeo.");
          }}
        />

        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#18e7a1" />
            <Text style={styles.overlayText}>{statusText}</Text>
          </View>
        )}
      </View>

      {!!errorText && (
        <View style={styles.messageBox}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      )}

      <View style={styles.detailsBox}>
        <Text style={styles.infoTitle}>{item?.name || "Sem nome"}</Text>
        <Text style={styles.infoText}>Categoria: {item?.category || "Geral"}</Text>
        <Text style={styles.infoText}>Tipo: {section === "live" ? "Live TV" : "Filme"}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    backgroundColor: "#18e7a1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#111",
    fontWeight: "800",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 12,
  },
  playerWrap: {
    marginHorizontal: 14,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayText: {
    color: "#fff",
    marginTop: 12,
    fontWeight: "700",
  },
  detailsBox: {
    margin: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
  },
  infoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoText: {
    color: "#d1d1d1",
    marginBottom: 6,
  },
  messageBox: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
  },
  errorText: {
    color: "#ffb3b3",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  actionBtn: {
    backgroundColor: "#18e7a1",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  actionBtnText: {
    color: "#111",
    fontWeight: "800",
  },
});
