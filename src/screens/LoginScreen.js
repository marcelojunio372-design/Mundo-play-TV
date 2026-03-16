import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { COLORS } from "../utils/constants";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("xtream");
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [m3uUrl, setM3uUrl] = useState("");
  const [mac, setMac] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.loginWrap}>
        <View style={styles.loginCard}>
          <Text style={styles.loginLogo}>MUNDO PLAY TV</Text>
          <Text style={styles.loginSub}>Entrar no aplicativo</Text>

          <View style={styles.modeRow}>
            <TouchableOpacity style={[styles.modeBtn, mode === "xtream" && styles.modeBtnActive]} onPress={() => setMode("xtream")}>
              <Text style={styles.modeText}>Usuário / Senha</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modeBtn, mode === "m3u" && styles.modeBtnActive]} onPress={() => setMode("m3u")}>
              <Text style={styles.modeText}>M3U</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modeBtn, mode === "mac" && styles.modeBtnActive]} onPress={() => setMode("mac")}>
              <Text style={styles.modeText}>MAC</Text>
            </TouchableOpacity>
          </View>

          {mode === "xtream" && (
            <>
              <TextInput style={styles.input} placeholder="Servidor" placeholderTextColor={COLORS.muted} value={server} onChangeText={setServer} />
              <TextInput style={styles.input} placeholder="Usuário" placeholderTextColor={COLORS.muted} value={username} onChangeText={setUsername} />
              <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={COLORS.muted} secureTextEntry value={password} onChangeText={setPassword} />
            </>
          )}

          {mode === "m3u" && (
            <TextInput
              style={[styles.input, { height: 110, textAlignVertical: "top" }]}
              placeholder="Cole aqui sua URL M3U"
              placeholderTextColor={COLORS.muted}
              multiline
              value={m3uUrl}
              onChangeText={setM3uUrl}
            />
          )}

          {mode === "mac" && (
            <>
              <TextInput style={styles.input} placeholder="Servidor / Portal" placeholderTextColor={COLORS.muted} value={server} onChangeText={setServer} />
              <TextInput style={styles.input} placeholder="MAC Address" placeholderTextColor={COLORS.muted} value={mac} onChangeText={setMac} />
            </>
          )}

          <TouchableOpacity style={styles.loginBtn} onPress={onLogin}>
            <Text style={styles.loginBtnText}>CONECTAR</Text>
          </TouchableOpacity>

          <Text style={styles.macFooter}>Login IPTV profissional</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loginWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  loginCard: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    padding: 20,
  },
  loginLogo: { color: COLORS.primary, fontSize: 30, fontWeight: "900", textAlign: "center" },
  loginSub: { color: COLORS.text, fontSize: 16, textAlign: "center", marginTop: 8, marginBottom: 18 },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  modeBtn: {
    flex: 1,
    backgroundColor: COLORS.panel2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  modeText: { color: COLORS.text, textAlign: "center", fontWeight: "700", fontSize: 12 },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, marginTop: 6 },
  loginBtnText: { color: "#00151d", textAlign: "center", fontSize: 16, fontWeight: "900" },
  macFooter: { color: COLORS.muted, textAlign: "center", marginTop: 14, fontSize: 12 },
});
