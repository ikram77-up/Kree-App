import React, { useState } from "react";
import { getToken } from "../Context/AuthContext";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

export default function AgenceFormScreen({ navigation }) {
    const [form, setForm] = useState({
        agencyName: "",
        carModel: "",
        brand: "",
        carImage: null,
        color: "",
        km: "",
        fuelType: "",
        gearbox: "",
        seats: "",
        features: [],
    });


    const featuresList = ["GPS", "Bluetooth", "Camera", "Air conditioner"];

    const pickImage = async (key) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!result.canceled) {
            setForm({ ...form, [key]: result.assets[0].uri });
        }
    };

    const toggleFeature = (feature) => {
        setForm((prev) => {
            const features = prev.features.includes(feature)
                ? prev.features.filter((f) => f !== feature)
                : [...prev.features, feature];
            return { ...prev, features };
        });
    };

    const handleSubmit = async () => {
        try {
            const token = await getToken();
            if (!token) {
                Alert.alert("Error", "You must be logged in to submit an offer.");
                return;
            }
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/offres`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (response.ok) {
                Alert.alert("Success", "Your offer has been submitted!");
                navigation.goBack();
            } else {
                Alert.alert("Error", "Failed to submit offer.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "An error occurred while submitting.");
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : null}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Add Car Offer</Text>

                <Text style={styles.label}>Agency Name</Text>
                <TextInput
                    style={styles.input}
                    value={form.agencyName}
                    onChangeText={(t) => setForm({ ...form, agencyName: t })}
                />

                <Text style={styles.label}>Car Model</Text>
                <TextInput
                    style={styles.input}
                    value={form.carModel}
                    onChangeText={(t) => setForm({ ...form, carModel: t })}
                />

                <Text style={styles.label}>Brand</Text>
                <TextInput
                    style={styles.input}
                    value={form.brand}
                    onChangeText={(t) => setForm({ ...form, brand: t })}
                />

                <Text style={styles.label}>Car Image</Text>
                <TouchableOpacity style={styles.button} onPress={() => pickImage("carImage")}>
                    <Text style={styles.buttonText}>
                        {form.carImage ? "Change Car Image" : "Upload Car Image"}
                    </Text>
                </TouchableOpacity>
                {form.carImage && <Image source={{ uri: form.carImage }} style={styles.previewImage} />}

                <Text style={styles.label}>Color</Text>
                <TextInput
                    style={styles.input}
                    value={form.color}
                    onChangeText={(t) => setForm({ ...form, color: t })}
                />

                <Text style={styles.label}>KM</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.km}
                    onChangeText={(t) => setForm({ ...form, km: t })}
                />

                <Text style={styles.label}>Fuel Type</Text>
                <Picker
                    selectedValue={form.fuelType}
                    onValueChange={(v) => setForm({ ...form, fuelType: v })}
                    style={styles.picker}
                >
                    <Picker.Item label="Select fuel type" value="" />
                    <Picker.Item label="Diesel" value="Diesel" />
                    <Picker.Item label="Gasoline" value="Gasoline" />
                    <Picker.Item label="Hybrid" value="Hybrid" />
                    <Picker.Item label="Electric" value="Electric" />
                </Picker>

                <Text style={styles.label}>Gearbox</Text>
                <Picker
                    selectedValue={form.gearbox}
                    onValueChange={(v) => setForm({ ...form, gearbox: v })}
                    style={styles.picker}
                >
                    <Picker.Item label="Select gearbox" value="" />
                    <Picker.Item label="Manual" value="Manual" />
                    <Picker.Item label="Automatic" value="Automatic" />
                </Picker>

                <Text style={styles.label}>Seats</Text>
                <Picker
                    selectedValue={form.seats}
                    onValueChange={(v) => setForm({ ...form, seats: v })}
                    style={styles.picker}
                >
                    <Picker.Item label="Select seats" value="" />
                    <Picker.Item label="4" value="4" />
                    <Picker.Item label="5" value="5" />
                    <Picker.Item label="7" value="7" />
                    <Picker.Item label="10" value="10" />
                </Picker>

                <Text style={styles.label}>Features</Text>
                <View style={styles.featuresContainer}>
                    {featuresList.map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.featureButton,
                                form.features.includes(f) && styles.featureSelected,
                            ]}
                            onPress={() => toggleFeature(f)}
                        >
                            <Text style={{ color: form.features.includes(f) ? "#fff" : "#333" }}>
                                {f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>Submit Offer</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );


}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: "#fff", paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
    label: { fontWeight: "600", marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginTop: 5,
    },
    picker: { marginTop: 5 },
    button: {
        backgroundColor: "#eee",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 5,
    },
    buttonText: { color: "#000000" },
    previewImage: { width: "100%", height: 200, marginTop: 10, borderRadius: 10 },
    featuresContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 5,
    },
    featureButton: {
        borderWidth: 1,
        borderColor: "#ccc",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    featureSelected: {
        backgroundColor: "#FF6300",
        borderColor: "#000000",
    },
    submitButton: {
        backgroundColor: "#ff6300",
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        alignItems: "center",
    },
    submitText: { color: "#fff", fontWeight: "bold" },
});
