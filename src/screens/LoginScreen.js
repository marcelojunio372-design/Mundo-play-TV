import React, { useState } from "react";
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
import { loadM3U } from "../services/m3uService";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("m3u");
  const [m3uUrl, setM3uUrl] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mac, setMac] = useState("");
  const [loading, setLoading] = useState(false);

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
      const data = await loadM3U(finalUrl);

      onLogin({
        type: "m3u",
        url: finalUrl,
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
      const data = await loadM3U(playlistUrl);

      onLogin({
        type: "xtream",
        url: playlistUrl,
        server: base,
        username,
        password,
        data,
      });
    } catch (e) {
      Alert.alert("Erro", "Falha ao carregar login usuário/senha");
    } finally {
      setLoading(false);
    }
  };

  const handleMac = async () => {
    const macValue = String(mac || "").trim();

    if (!macValue) {
      Alert.alert("Erro", "Informe o MAC");
      return;
    }

    Alert.alert(
      "Aviso",
      "MAC precisa de backend/portal específico. Use M3U ou usuário/senha nesta versão."
    );
  };

  const handleConnect = async () => {
    if (loading) return;

    if (mode === "m3u") return handleM3U();
    if (mode === "xtream") return handleXtream();
    return handleMac();
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
              <Text style={[styles.tabText, mode === "xtream" && styles.tabTextActive]}>
                Usuário / Senha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === "m3u" && styles.tabActive]}
              onPress={() => setMode("m3u")}
            >
              <Text style={[styles.tabText, mode === "m3u" && styles.tabTextActive]}>
                M3U
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === "mac" && styles.tabActive]}
              onPress={() => setMode("mac")}
            >
              <Text style={[styles.tabText, mode === "mac" && styles.tabTextActive]}>
                MAC
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
              />
              <TextInput
                style={styles.input}
                placeholder="Usuário"
                placeholderTextColor="#7d8ea3"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#7d8ea3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </>
          )}

          {mode === "mac" && (
            <TextInput
              style={styles.input}
              placeholder="MAC"
              placeholderTextColor="#7d8ea3"
              value={mac}
              onChangeText={setMac}
              autoCapitalize="characters"
            />
          )}

          <TouchableOpacity style={styles.btn} onPress={handleConnect}>
            <Text style={styles.btnText}>
              {loading ? "CONECTANDO..." : "CONECTAR"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>Login IPTV profissional</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111d" },
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
  },
  sub: {
    color: "#d4dee8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: "#102235",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: "rgba(56,215,255,0.16)",
    borderWidth: 1,
    borderColor: "#38d7ff",
  },
  tabText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#38d7ff",
  },
  input: {
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#102235",
    color: "#fff",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  btn: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  btnText: {
    color: "#00131f",
    fontSize: 12,
    fontWeight: "900",
  },
  footer: {
    color: "#8fa4ba",
    textAlign: "center",
    marginTop: 16,
    fontSize: 10,
  },
});
