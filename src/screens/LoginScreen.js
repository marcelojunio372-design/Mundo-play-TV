import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadM3U } from "../services/m3uService";
import { loadXtream } from "../services/xtreamService";

const LOGIN_STORAGE_KEY = "mundoplaytv_login_data_v1";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("m3u");
  const [m3uUrl, setM3uUrl] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mac] = useState("00:1A:79:12:34:56");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSavedLogin() {
      try {
        const raw = await AsyncStorage.getItem(LOGIN_STORAGE_KEY);
        if (!raw) return;

        const saved = JSON.parse(raw);

        setMode(saved?.mode || "m3u");
        setM3uUrl(saved?.m3uUrl || "");
        setServerUrl(saved?.serverUrl || "");
        setUsername(saved?.username || "");
        setPassword(saved?.password || "");
      } catch (e) {}
    }

    loadSavedLogin();
  }, []);

  const saveLoginData = async (payload = {}) => {
    try {
      await AsyncStorage.setItem(
        LOGIN_STORAGE_KEY,
        JSON.stringify({
          mode: payload.mode || mode,
          m3uUrl: payload.m3uUrl || "",
          serverUrl: payload.serverUrl || "",
          username: payload.username || "",
          password: payload.password || "",
        })
      );
    } catch (e) {}
  };

  const clearSavedLogin = async () => {
    try {
      await AsyncStorage.removeItem(LOGIN_STORAGE_KEY);
      setMode("m3u");
      setM3uUrl("");
      setServerUrl("");
      setUsername("");
      setPassword("");
      Alert.alert("OK", "Dados salvos apagados.");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível apagar os dados salvos.");
    }
  };

  const normalizeUrl = (url) => {
    const value = String(url || "").trim();
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `http://${value}`;
  };

  const handleM3U = async () => {
    const finalUrl = normalizeUrl(m3uUrl);

    if (!finalUrl) {
      Alert.alert("Erro", "Informe a URL M3U");
      return;
    }

    try {
      setLoading(true);

      await saveLoginData({
        mode: "m3u",
        m3uUrl: finalUrl,
        serverUrl: "",
        username: "",
        password: "",
      });

      const data = await loadM3U(finalUrl, { only: "all" });

      onLogin({
        type: "m3u",
        url: finalUrl,
        mac,
        data,
      });
    } catch (e) {
      Alert.alert("Erro", "Falha ao carregar a lista M3U");
    } finally {
      setLoading(false);
    }
  };

  const handleXtream = async () => {
    const base = normalizeUrl(serverUrl);

    if (!base || !username || !password) {
      Alert.alert("Erro", "Preencha servidor, usuário e senha");
      return;
    }

    const playlistUrl = `${base.replace(/\/+$/, "")}/get.php?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}&type=m3u_plus&output=ts`;

    try {
      setLoading(true);

      await saveLoginData({
        mode: "xtream",
        m3uUrl: "",
        serverUrl: base,
        username,
        password,
      });

      const data = await loadXtream(base, username, password);

      onLogin({
        type: "xtream",
        url: playlistUrl,
        server: base,
        username,
        password,
        mac,
        data,
      });
    } catch (e) {
      Alert.alert("Erro", "Falha ao carregar login Xtream");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (loading) return;

    if (mode === "m3u") return handleM3U();
    if (mode === "xtream") return handleXtream();

    Alert.alert("Aviso", "Use M3U ou usuário/senha");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.logo}>MUNDO PLAY TV</Text>
          <Text style={styles.sub}>Entrar no aplicativo</Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === "xtream" && styles.tabActive]}
              onPress={() => setMode("xtream")}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "xtream" && styles.tabTextActive,
                ]}
              >
                Usuário / Senha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === "m3u" && styles.tabActive]}
              onPress={() => setMode("m3u")}
            >
              <Text
                style={[styles.tabText, mode === "m3u" && styles.tabTextActive]}
              >
                M3U
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "m3u" && (
            <TextInput
              style={styles.input}
              placeholder="Cole aqui sua URL M3U"
              placeholderTextColor="#7d8ea3"
              value={m3uUrl}
              onChangeText={setM3uUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          {mode === "xtream" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Servidor"
                placeholderTextColor="#7d8ea3"
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Usuário"
                placeholderTextColor="#7d8ea3"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#7d8ea3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

          <TouchableOpacity style={styles.btn} onPress={handleConnect}>
            <Text style={styles.btnText}>
              {loading
                ? mode === "xtream"
                  ? "CARREGANDO XTREAM..."
                  : "CARREGANDO M3U..."
                : "CONECTAR"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={clearSavedLogin}>
            <Text style={styles.clearBtnText}>APAGAR DADOS SALVOS</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerMac}>MAC: {mac}</Text>
            <Text style={styles.footer}>Login IPTV profissional</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06111d",
  },

  wrap: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#091827",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  logo: {
    color: "#38d7ff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },

  sub: {
    color: "#c6d4e3",
    textAlign: "center",
    marginBottom: 18,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#0d2234",
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },

  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  tabActive: {
    backgroundColor: "#132c43",
  },

  tabText: {
    color: "#95aac0",
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#38d7ff",
  },

  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0c1f31",
    color: "#fff",
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  btn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  btnText: {
    color: "#04121d",
    fontWeight: "900",
    fontSize: 15,
  },

  clearBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0c1f31",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  clearBtnText: {
    color: "#ffb3b3",
    fontWeight: "800",
    fontSize: 13,
  },

  footerRow: {
    marginTop: 16,
    alignItems: "center",
  },

  footerMac: {
    color: "#a8bed2",
    fontSize: 12,
    marginBottom: 4,
  },

  footer: {
    color: "#6f8497",
    fontSize: 12,
  },
});
