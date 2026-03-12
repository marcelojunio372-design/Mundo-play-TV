import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated, Dimensions } from "react-native";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

const LOGO_IMAGE = require("../../assets/images/icon.png");
const INTRO_SOUND = require("../../assets/sounds/intro.mp3");

export default function SplashScreen({ navigation }) {
  const particlesOpacity = useRef(new Animated.Value(0)).current;
  const particlesTranslate = useRef(new Animated.Value(-width)).current;

  const energyOpacity = useRef(new Animated.Value(0)).current;
  const energyTranslate = useRef(new Animated.Value(-width)).current;

  const smokeOpacity = useRef(new Animated.Value(0)).current;
  const smokeScale = useRef(new Animated.Value(0.9)).current;

  const lightOpacity = useRef(new Animated.Value(0)).current;
  const lightTranslate = useRef(new Animated.Value(-width)).current;

  const flashOpacity = useRef(new Animated.Value(0)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    startIntro();
  }, []);

  async function startIntro() {
    let sound;

    try {
      sound = new Audio.Sound();
      await sound.loadAsync(INTRO_SOUND);
      await sound.playAsync();

      Animated.sequence([
        Animated.parallel([
          Animated.timing(particlesOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(particlesTranslate, {
            toValue: width,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(energyOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(energyTranslate, {
            toValue: width,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(smokeOpacity, {
            toValue: 0.5,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(smokeScale, {
            toValue: 1.08,
            duration: 850,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(lightOpacity, {
            toValue: 0.95,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(lightTranslate, {
            toValue: width,
            duration: 420,
            useNativeDriver: true,
          }),
        ]),

        Animated.sequence([
          Animated.timing(flashOpacity, {
            toValue: 0.35,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(flashOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 6,
            tension: 70,
            useNativeDriver: true,
          }),
        ]),
      ]).start(async () => {
        setTimeout(async () => {
          try {
            if (sound) {
              await sound.unloadAsync();
            }
          } catch {}
          navigation.replace("Login");
        }, 900);
      });
    } catch {
      navigation.replace("Login");
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.particles,
          {
            opacity: particlesOpacity,
            transform: [{ translateX: particlesTranslate }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.energy,
          {
            opacity: energyOpacity,
            transform: [{ translateX: energyTranslate }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.smoke,
          {
            opacity: smokeOpacity,
            transform: [{ scale: smokeScale }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.light,
          {
            opacity: lightOpacity,
            transform: [{ translateX: lightTranslate }, { rotate: "-8deg" }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.flash, { opacity: flashOpacity }]}
      />

      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image source={LOGO_IMAGE} style={styles.logo} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  particles: {
    position: "absolute",
    width: width * 1.3,
    height: 90,
    borderRadius: 80,
    backgroundColor: "rgba(180,120,255,0.22)",
    shadowColor: "#c084ff",
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 18,
    top: height * 0.32,
  },

  energy: {
    position: "absolute",
    width: width * 1.2,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#b56cff",
    shadowColor: "#b56cff",
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 20,
    top: height * 0.45,
  },

  smoke: {
    position: "absolute",
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width,
    backgroundColor: "rgba(120,80,180,0.18)",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.9,
    shadowRadius: 60,
    elevation: 18,
  },

  light: {
    position: "absolute",
    width: width * 1.4,
    height: 140,
    backgroundColor: "rgba(255,255,255,0.12)",
    shadowColor: "#ffffff",
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 14,
    top: height * 0.38,
  },

  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
  },

  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
});
