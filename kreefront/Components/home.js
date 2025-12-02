import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");

export default function Home() {
    const navigation = useNavigation();

    return (
        <LinearGradient
            colors={["#ff7b00", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.container}
        >
            {/* LOGO */}
            <MotiView
                from={{ opacity: 0, translateY: -30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 700 }}
            >
                <Image
                    source={require("../assets/logo-kree.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </MotiView>

            {/* Main TEXT (under the logo) */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 800, delay: 400 }}
                style={styles.textBlock}
            >
                <Text style={styles.mainTitle}>EXPLORE MOROCCO</Text>
                <Text style={styles.mainSubtitle}>RENT WITH CONFIDENCE</Text>
                <Text style={styles.mainSubtitle}>CHOOSE KREE</Text>
            </MotiView>

            {/* CAR IMAGE */}
            <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 1000, delay: 600 }}
                style={styles.imageContainer}
            >
                <Image
                    source={require("../assets/kree car.jpg")}
                    style={styles.carImage}
                    resizeMode="cover"
                />
            </MotiView>

            {/* BUTTON */}
            <MotiView
                from={{ opacity: 0, translateY: 50 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 800, delay: 900 }}
            >
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate("AuthScreen")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            </MotiView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "space-evenly",
        alignItems: "center",
        paddingVertical: 50,
    },
    logo: {
        width: 160,
        height: 70,
    },
    textBlock: {
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20,
    },
    mainTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "bold",
        letterSpacing: 1,
        textAlign: "center",
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    mainSubtitle: {
        color: "#fff",
        fontSize: 18,
        textAlign: "center",
        marginTop: 5,
        letterSpacing: 0.5,
        opacity: 0.9,
    },
    imageContainer: {
        width: width * 0.9,
        height: width * 0.5,
        borderRadius: 20,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 20,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 6,
    },
    carImage: {
        width: "100%",
        height: "100%",
    },
    button: {
        backgroundColor: "#000000",
        borderColor: "#ff7b00",
        borderWidth: 2,
        paddingVertical: 14,
        paddingHorizontal: 60,
        borderRadius: 35,
        marginBottom: 40,
        shadowColor: "#ff7b00",
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        letterSpacing: 0.5,
    },
});
