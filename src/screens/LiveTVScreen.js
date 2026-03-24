import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ResizeMode, Video } from "expo-av";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUrl(url = "") {
  return String(url || "").trim();
}

export default function LiveTVScreen({
  session,
  isEpgReady,
  onOpenHome,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
}) {
  const videoRef = useRef(null);

  const channels = useMemo(() => {
    return safeArray(session?.data?.live).filter(
      (item) => item && item.url && item.name
    );
  }, [session]);

  const [selectedChannel, setSelectedChannel] = useState(
    channels.length > 0 ? channels[0] : null
  );
  const [playerKey, setPlayerKey] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [playerMessage, setPlayerMessage] = useState("");

  const streamUrl = useMemo(() => {
    return normalizeUrl(selectedChannel?.url);
  }, [selectedChannel]);

  const handleSelectChannel = async (channel) => {
    setSelectedChannel(channel);
    setHasError(false);
    setPlayerMessage("");
    setPlayerKey((prev) => prev + 1);

    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync().catch(() => {});
      }
    } catch (e) {}
  };

  const handleReloadPlayer = async () => {
    setHasError(false);
    setPlayerMessage("");
    setPlayerKey((prev) => prev + 1);

    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync().catch(() => {});
      }
    } catch (e) {}
  };

  const renderMenu = () => {
    return (
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuBtn} onPress={onOpenLive}>
          <Text style={styles.menuBtnText}>LIVE TV</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={onOpenMovies}>
          <Text style={styles.menuBtnText}>FILMES</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={onOpenSeries}>
          <Text style={styles.menuBtnText}>SÉRIES</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={onOpenHome}>
          <Text style={styles.menuBtnText}>VOLTAR</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderChannelItem = ({ item }) => {
    const active = selectedChannel?.id === item?.id;

    return (
      <TouchableOpacity
        style={[styles.channelItem, active && styles.channelItemActive]}
        onPress={() => handleSelectChannel(item)}
      >
        <Text
          style={[styles.channelName, active && styles.channelNameActive]}
          numberOfLines={1}
        >
          {item?.name || "Canal"}
        </Text>

        <Text style={styles.channelGroup} numberOfLines={1}>
          {item?.group || "AO VIVO"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.title}>MUNDO PLAY TV</Text>
        <Text style={styles.subtitle}>
          {isEpgReady ? "Guia pronto" : "Modo ao vivo"}
        </Text>
      </View>

      <View style={styles.content}>
        {renderMenu()}

        <View style={styles.main}>
          <View style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <View>
                <Text style={styles.playerTitle}>
                  {selectedChannel?.name || "Selecione um canal"}
                </Text>
                <Text style={styles.playerSubtitle}>
                  {selectedChannel?.group || "TV AO VIVO"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.reloadBtn}
                onPress={handleReloadPlayer}
              >
                <Text style={styles.reloadBtnText}>RECARREGAR</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playerBox}>
              {streamUrl ? (
                <>
                  <Video
                    key={`live-player-${playerKey}`}
                    ref={videoRef}
                    style={styles.video}
                    source={{
                      uri: streamUrl,
                      headers: {
                        "User-Agent": "Mozilla/5.0",
                        Accept: "*/*",
                        Connection: "keep-alive",
                      },
                    }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    isLooping={false}
                    volume={1.0}
                    onLoadStart={() => {
                      setIsBuffering(true);
                      setHasError(false);
                      setPlayerMessage("Abrindo canal...");
                    }}
                    onReadyForDisplay={() => {
                      setIsBuffering(false);
                      setHasError(false);
                      setPlayerMessage("");
                    }}
                    onPlaybackStatusUpdate={(status) => {
                      if (!status) return;

                      if (status.isLoaded) {
                        if (status.isBuffering) {
                          setIsBuffering(true);
                          setPlayerMessage("Carregando transmissão...");
                        } else {
                          setIsBuffering(false);
                          if (!hasError) {
                            setPlayerMessage("");
                          }
                        }
                      } else if (status.error) {
                        setIsBuffering(false);
                        setHasError(true);
                        setPlayerMessage("Não foi possível reproduzir este canal.");
                      }
                    }}
                    onError={() => {
                      setIsBuffering(false);
                      setHasError(true);
                      setPlayerMessage("Erro no player deste canal.");
                    }}
                  />

                  {(isBuffering || hasError || !!playerMessage) && (
                    <View style={styles.overlay}>
                      {isBuffering && (
                        <ActivityIndicator size="large" color="#38d7ff" />
                      )}

                      {!!playerMessage && (
                        <Text style={styles.overlayText}>{playerMessage}</Text>
                      )}

                      {hasError && (
                        <TouchableOpacity
                          style={styles.overlayRetryBtn}
                          onPress={handleReloadPlayer}
                        >
                          <Text style={styles.overlayRetryText}>TENTAR DE NOVO</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyPlayer}>
                  <Text style={styles.emptyPlayerText}>
                    Selecione um canal para reproduzir.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.listCard}>
            <Text style={styles.listTitle}>CANAIS</Text>

            {channels.length === 0 ? (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  Nenhum canal ao vivo encontrado na lista.
                </Text>
              </View>
            ) : (
              <FlatList
                data={channels}
                keyExtractor={(item, index) =>
                  String(item?.id || `${item?.name || "canal"}_${index}`)
                }
                renderItem={renderChannelItem}
                showsVerticalScrollIndicator={false}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={8}
                removeClippedSubviews
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06111d",
  },

  topbar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  subtitle: {
    color: "#38d7ff",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    flexDirection: "row",
  },

  menu: {
    width: 110,
    padding: 10,
    gap: 10,
  },

  menuBtn: {
    height: 70,
    backgroundColor: "#0b1c2d",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  menuBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },

  main: {
    flex: 1,
    flexDirection: "row",
    padding: 10,
    gap: 10,
  },

  playerCard: {
    flex: 1.2,
    backgroundColor: "#081522",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  playerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },

  playerSubtitle: {
    color: "#8fb2cb",
    marginTop: 4,
    fontSize: 12,
  },

  reloadBtn: {
    backgroundColor: "#10263b",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#1e4d75",
  },

  reloadBtnText: {
    color: "#38d7ff",
    fontWeight: "800",
    fontSize: 12,
  },

  playerBox: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 240,
  },

  video: {
    width: "100%",
    height: "100%",
    minHeight: 240,
    backgroundColor: "#000",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  overlayText: {
    color: "#ffffff",
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },

  overlayRetryBtn: {
    marginTop: 14,
    backgroundColor: "#38d7ff",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  overlayRetryText: {
    color: "#04121d",
    fontWeight: "900",
  },

  emptyPlayer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  emptyPlayerText: {
    color: "#c7d7e5",
    textAlign: "center",
    fontSize: 14,
  },

  listCard: {
    width: 280,
    backgroundColor: "#081522",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  listTitle: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10,
  },

  channelItem: {
    backgroundColor: "#0c1f31",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  channelItemActive: {
    borderColor: "#38d7ff",
    backgroundColor: "#10263b",
  },

  channelName: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },

  channelNameActive: {
    color: "#38d7ff",
  },

  channelGroup: {
    color: "#90a8bc",
    marginTop: 4,
    fontSize: 11,
  },

  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  emptyListText: {
    color: "#c7d7e5",
    textAlign: "center",
  },
});
