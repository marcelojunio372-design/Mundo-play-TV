import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

const { width: W, height: H } = Dimensions.get("window");

const BG_IMAGE = require("../../assets/bg.jpg");
const LOGO_IMAGE = require("../../assets/logo.png");

const MODES = {
  XTREAM: "xtream",
  M3U: "m3u",
};

function normalizeServer(server) {
  let s = String(server || "").trim();
  if (!s) return "";

  if (!s.startsWith("http://") && !s.startsWith("https://")) {
    s = "http://" + s;
  }

  try {
    const u = new URL(s);

    if (u.hostname === "epics.zip" && !u.port) {
      u.port = "80";
    }

    return u.toString().replace(/\/$/, "");
  } catch {
    return s.replace(/\/$/, "");
  }
}

function normalizeUrl(url) {
  let s = String(url || "").trim();
  if (!s) return "";

  if (!s.startsWith("http://") && !s.startsWith("https://")) {
    s = "http://" + s;
  }

  return s;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Falha HTTP ${response.status}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Resposta inválida da API.");
  }
}

export default function LoginScreen({ navigation }) {
  const [mode, setMode] = useState(MODES.XTREAM);

  const [server, setServer] = useState("http://epics.zip:80");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [m3uUrl, setM3uUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [macAddress, setMacAddress] = useState("00:1A:79:XX:XX:XX");

  const boxWidth = useMemo(() => {
    if (Platform.isTV) return Math.min(W * 0.42, 520);
    return Math.min(W * 0.88, 420);
  }, []);

  useEffect(() => {
    loadSavedData();
    loadMac();
  }, []);

  async function loadSavedData() {
    try {
      const savedMode = await AsyncStorage.getItem("login_mode");
      const savedServer = await AsyncStorage.getItem("xtream_server");
      const savedUser = await AsyncStorage.getItem("xtream_user");
      const savedPass = await AsyncStorage.getItem("xtream_pass");
      const savedM3u = await AsyncStorage.getItem("m3u_url");

      if (savedMode) setMode(savedMode);
      if (savedServer) setServer(savedServer);
      if (savedUser) setUsername(savedUser);
      if (savedPass) setPassword(savedPass);
      if (savedM3u) setM3uUrl(savedM3u);
    } catch {}
  }

  async function loadMac() {
    try {
      const raw =
        Application.androidId ||
        Application.applicationId ||
        "001A79XXXXXX";

      const clean = String(raw).replace(/[^a-fA-F0-9]/g, "").padEnd(12, "0").slice(0, 12);
      const mac = clean.match(/.{1,2}/g)?.join(":") || "00:1A:79:XX:XX:XX";
      setMacAddress(mac.toUpperCase());
    } catch {
      setMacAddress("00:1A:79:XX:XX:XX");
    }
  }

  async function handleXtreamLogin() {
    try {
      setLoading(true);

      if (!server || !username || !password) {
        Alert.alert("Erro", "Preencha servidor, usuário e senha.");
        return;
      }

      const fixedServer = normalizeServer(server);

      const apiUrl =
        `${fixedServer}/player_api.php?username=${encodeURIComponent(username)}` +
        `&password=${encodeURIComponent(password)}`;

      const data = await fetchJson(apiUrl);

      if (!data?.user_info?.auth) {
        throw new Error("Login inválido.");
      }

      await AsyncStorage.multiSet([
        ["login_mode", MODES.XTREAM],
        ["xtream_server", fixedServer],
        ["xtream_user", username],
        ["xtream_pass", password],
        ["m3u_url", ""],
      ]);

      navigation.replace("Home");
    } catch (e) {
      Alert.alert("Erro", String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleM3ULogin() {
    try {
      setLoading(true);

      if (!m3uUrl) {
        Alert.alert("Erro", "Digite a URL M3U.");
        return;
      }

      const fixedUrl = normalizeUrl(m3uUrl);

      const response = await fetch(fixedUrl, {
        method: "GET",
        headers: {
          Accept: "*/*",
          "User-Agent": "Mozilla/5.0",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Falha HTTP ${response.status}`);
      }

      if (!text.includes("#EXTM3U") && !text.includes("#EXTINF")) {
        throw new Error("Lista M3U inválida.");
      }

      await AsyncStorage.multiSet([
        ["login_mode", MODES.M3U],
        ["m3u_url", fixedUrl],
        ["xtream_server", ""],
        ["xtream_user", ""],
        ["xtream_pass", ""],
      ]);

      navigation.replace("Home");
    } catch (e) {
      Alert.alert("Erro", String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={BG_IMAGE} resizeMode="cover" style={styles.bg}>
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { width: boxWidth }]}>
            <Image source={LOGO_IMAGE} resizeMode="contain" style={styles.logo} />

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === MODES.XTREAM && styles.tabBtnActive]}
                onPress={() => setMode(MODES.XTREAM)}
              >
                <Text style={[styles.tabText, mode === MODES.XTREAM && styles.tabTextActive]}>
                  Xtream
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, mode === MODES.M3U && styles.tabBtnActive]}
                onPress={() => setMode(MODES.M3U)}
              >
                <Text style={[styles.tabText, mode === MODES.M3U && styles.tabTextActive]}>
                  M3U
                </Text>
              </TouchableOpacity>
            </View>

            {mode === MODES.XTREAM ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Servidor"
                  placeholderTextColor="#BFBFBF"
                  value={server}
                  onChangeText={setServer}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Usuário"
                  placeholderTextColor="#BFBFBF"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#BFBFBF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[styles.mainBtn, loading && styles.btnDisabled]}
                  onPress={handleXtreamLogin}
                  disabled={loading}
                >
                  <Text style={styles.mainBtnText}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua URL M3U"
                  placeholderTextColor="#BFBFBF"
                  value={m3uUrl}
                  onChangeText={setM3uUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[styles.mainBtn, loading && styles.btnDisabled]}
                  onPress={handleM3ULogin}
                  disabled={loading}
                >
                  <Text style={styles.mainBtnText}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.macText}>MAC: {macAddress}</Text>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  card: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: "center",
  },

  logo: {
    width: 150,
    height: 110,
    marginBottom: 8,
  },

  tabRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 14,
  },

  tabBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
  },

  tabBtnActive: {
    backgroundColor: "#10F0A0",
  },

  tabText: {
    color: "#FFF",
    fontWeight: "800",
    textAlign: "center",
    fontSize: 14,
  },

  tabTextActive: {
    color: "#000",
  },

  input: {
    width: "100%",
    backgroundColor: "rgba(20,20,20,0.90)",
    color: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },

  mainBtn: {
    width: "100%",
    backgroundColor: "#10F0A0",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  btnDisabled: {
    opacity: 0.65,
  },

  mainBtnText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "900",
  },

  macText: {
    color: "#C8C8C8",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 16,
  },
});
