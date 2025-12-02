import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform,
    Image,
    KeyboardAvoidingView
} from 'react-native';
import { useAuth } from '../Context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useNotificationCount } from '../Hooks/useNotificationCount';
// Import Audio for sound notifications
import { Audio } from 'expo-av';

import {
    launchImageLibraryAsync,
    MediaTypeOptions,
    requestMediaLibraryPermissionsAsync
} from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const NOTIFICATION_SOUND = require('../assets/notification.mp3');

export default function ClientHomeScreen({ navigation }) {
    const { user, profile, token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const unreadCount = useNotificationCount();

    const [previousCount, setPreviousCount] = useState(unreadCount);

    const playNotificationSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                NOTIFICATION_SOUND,
                { shouldPlay: true }
            );
            await sound.playAsync();

            setTimeout(() => sound.unloadAsync(), 3000);

        } catch (error) {
            console.error("Erreur de lecture du son:", error);
        }
    };

    useEffect(() => {
        if (unreadCount > previousCount) {
            playNotificationSound();
        }
        setPreviousCount(unreadCount);
    }, [unreadCount, previousCount]);

    // Dates
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // +1 day
    const [isStartPickerVisible, setStartPickerVisibility] = useState(false);
    const [isEndPickerVisible, setEndPickerVisibility] = useState(false);

    const featuresList = ["GPS", "Air conditioner", "Bluetooth", "Camera",];


    // Form State
    const [form, setForm] = useState({
        fullName: user?.name || '',
        phoneNumber: profile?.phoneNumber || '',
        cin: null,
        picture: null,
        model: '',
        color: '',
        gearbox: 'Manual',
        fuelType: 'Diesel',
        seats: '4',
        priceMin: '',
        priceMax: '',
        pickupLocation: '',
        returnLocation: '',
        features: []
    });

    const handleChange = (name, value) => setForm({ ...form, [name]: value });

    const pickImage = async (field) => {
        const { status } = await requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to upload images.');
            return;
        }

        let result = await launchImageLibraryAsync({
            mediaTypes: MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setForm({ ...form, [field]: result.assets[0].uri });
        }
    };

    const toggleFeature = (feature) => {
        if (form.features.includes(feature)) {
            setForm({ ...form, features: form.features.filter(f => f !== feature) });
        } else {
            setForm({ ...form, features: [...form.features, feature] });
        }
    };


    const handleSubmit = async () => {
        // Validation
        if (!form.model || !form.priceMax || !form.pickupLocation) {
            Alert.alert("Missing Information", "Please fill in at least the Car Model, Max Price, and Pickup Location.");
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();

            // Append Text Fields
            formData.append('modelofCar', form.model);
            formData.append('color', form.color);
            formData.append('gearbox', form.gearbox);
            formData.append('fuelType', form.fuelType);
            formData.append('seats', form.seats);
            formData.append('priceMin', String(form.priceMin));
            formData.append('priceMax', String(form.priceMax));
            formData.append('startDate', startDate.toISOString());
            formData.append('endDate', endDate.toISOString());
            formData.append('pickupLocation', form.pickupLocation);
            formData.append('returnLocation', form.returnLocation);

            // Append Images (CIN)
            if (form.cin) {
                let uri = form.cin;
                if (Platform.OS === 'android' && !uri.startsWith('file://')) {
                    uri = 'file://' + uri;
                }
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('cin', { uri, name: filename, type });
            }

            // Append Images (Picture)
            if (form.picture) {
                let uri = form.picture;
                if (Platform.OS === 'android' && !uri.startsWith('file://')) {
                    uri = 'file://' + uri;
                }
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('picture', { uri, name: filename, type });
            }

            // Send Request
            const response = await fetch(`${API_URL}/price`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Your request has been sent to agencies!");

            } else {
                Alert.alert("Error", data.message || "Unknown error occurred");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Network Error", "Unable to reach the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={styles.mainContainer}>

                {/* Header Mis à jour pour 3 boutons */}
                <View style={styles.header}>
                    {/* Profil */}
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('ProfileScreen')}>
                        <FontAwesome5 name="user-circle" size={28} color="#ff7b00" />
                        <Text style={styles.headerText}>{user?.name || "Profile"}</Text>
                    </TouchableOpacity>

                    {/* Historique Mes Demandes */}
                    <TouchableOpacity onPress={() => navigation.navigate('ClientRequestsScreen')} style={{ padding: 8 }}>
                        <FontAwesome5 name="car" size={24} color="#ff6300" />
                    </TouchableOpacity>

                    {/* Offres  */}
                    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('ClientOffersScreen')}>
                        <FontAwesome5 name="bell" size={24} color="#ff6300" />
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.container}>
                    <Text style={styles.title}>Car Booking Request</Text>

                    {/* Personal Info */}
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={form.fullName} onChangeText={(t) => handleChange('fullName', t)} />

                    {/* CIN Upload */}
                    <Text style={styles.label}>ID/CIN (Upload)</Text>
                    <TouchableOpacity style={styles.button} onPress={() => pickImage("cin")}>
                        <Text style={styles.buttonText}>{form.cin ? "Change ID Image" : "Upload ID/CIN"}</Text>
                    </TouchableOpacity>
                    {form.cin && <Image source={{ uri: form.cin }} style={styles.previewImage} />}

                    {/* Picture Upload */}
                    <Text style={styles.label}>Profile Picture</Text>
                    <TouchableOpacity style={styles.button} onPress={() => pickImage("picture")}>
                        <Text style={styles.buttonText}>{form.picture ? "Change Photo" : "Upload Photo"}</Text>
                    </TouchableOpacity>
                    {form.picture && <Image source={{ uri: form.picture }} style={styles.previewImage} />}

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} keyboardType="phone-pad" value={form.phoneNumber} onChangeText={(t) => handleChange('phoneNumber', t)} />

                    {/* Vehicle Info */}
                    <Text style={styles.sectionTitle}>Car Details</Text>

                    <Text style={styles.label}>Car Model</Text>
                    <TextInput style={styles.input} placeholder="Ex: Clio 4" placeholderTextColor="#666" value={form.model} onChangeText={(t) => handleChange('model', t)} />

                    <Text style={styles.label}>Color</Text>
                    <TextInput style={styles.input} placeholder="Ex: Black" placeholderTextColor="#666" value={form.color} onChangeText={(t) => handleChange('color', t)} />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text style={styles.label}>Gearbox</Text>
                            <View style={styles.pickerBox}>
                                <Picker selectedValue={form.gearbox} onValueChange={(v) => handleChange('gearbox', v)} style={styles.picker}>
                                    <Picker.Item label="Manual" value="Manual" />
                                    <Picker.Item label="Automatic" value="Automatic" />
                                </Picker>
                            </View>
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text style={styles.label}>Fuel Type</Text>
                            <View style={styles.pickerBox}>
                                <Picker selectedValue={form.fuelType} onValueChange={(v) => handleChange('fuelType', v)} style={styles.picker}>
                                    <Picker.Item label="Diesel" value="Diesel" />
                                    <Picker.Item label="Essence" value="Gasoline" />
                                    <Picker.Item label="Hybrid" value="Hybrid" />
                                    <Picker.Item label="Electric" value="Electric" />
                                </Picker>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.label}>Seats</Text>
                    <View style={styles.pickerBox}>
                        <Picker selectedValue={form.seats} onValueChange={(v) => handleChange('seats', v)} style={styles.picker}>
                            <Picker.Item label="4" value="4" />
                            <Picker.Item label="5" value="5" />
                            <Picker.Item label="7" value="7" />
                            <Picker.Item label="9" value="9" />
                        </Picker>
                    </View>

                    {/* Features */}
                    <Text style={styles.label}>Features</Text>
                    <View style={styles.featuresContainer}>
                        {featuresList.map((f) => (
                            <TouchableOpacity key={f} style={[styles.featureButton, form.features.includes(f) && styles.featureSelected]} onPress={() => toggleFeature(f)}>
                                <Text style={{ color: form.features.includes(f) ? "#fff" : "#333", fontWeight: 'bold' }}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Price */}
                    <Text style={styles.label}>Your Budget (MAD)</Text>
                    <View style={styles.row}>
                        <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="Min" keyboardType="numeric" value={form.priceMin} onChangeText={(t) => handleChange('priceMin', t)} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Max" keyboardType="numeric" value={form.priceMax} onChangeText={(t) => handleChange('priceMax', t)} />
                    </View>

                    {/* Dates */}
                    <Text style={styles.label}>Dates</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setStartPickerVisibility(true)}>
                            <Text style={styles.dateLabel}>Start Date</Text>
                            <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setEndPickerVisibility(true)}>
                            <Text style={styles.dateLabel}>End Date</Text>
                            <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Locations */}
                    <Text style={styles.label}>Pickup Location</Text>
                    <TextInput style={styles.input} value={form.pickupLocation} onChangeText={(t) => handleChange('pickupLocation', t)} />
                    <Text style={styles.label}>Return Location</Text>
                    <TextInput style={styles.input} value={form.returnLocation} onChangeText={(t) => handleChange('returnLocation', t)} />

                    {/* Submit */}
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SEND REQUEST</Text>}
                    </TouchableOpacity>
                    <View style={{ height: 50 }} />
                </ScrollView>

                {/* Date Modals */}
                <DateTimePickerModal isVisible={isStartPickerVisible} mode="datetime" onConfirm={(d) => { setStartDate(d); setStartPickerVisibility(false) }} onCancel={() => setStartPickerVisibility(false)} />
                <DateTimePickerModal isVisible={isEndPickerVisible} mode="datetime" onConfirm={(d) => { setEndDate(d); setEndPickerVisibility(false) }} onCancel={() => setEndPickerVisibility(false)} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerBtn: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerText: {
        color: '#000',
        marginLeft: 10,
        fontWeight: 'bold'
    },
    container: { padding: 20 },
    title: {
        fontSize: 22,

        fontWeight: 'bold',
        color: '#ff7b00',
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#333'
    },
    label: {
        color: '#ff6300',
        marginTop: 10,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    input: {
        color: '#000',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
        backgroundColor: '#fff'
    },
    pickerBox: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
        overflow: 'hidden',
        backgroundColor: '#fff'
    },
    picker: {
        color: '#000',
        height: 50
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dateBtn: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10, borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444'
    },
    dateLabel: {
        color: '#666',
        fontSize: 12
    },
    dateValue: {
        color: '#000',
        fontWeight: 'bold'
    },
    button: {
        backgroundColor: "#eee",
        padding: 10, borderRadius: 8,
        alignItems: "center",
        marginTop: 5
    },
    buttonText: { color: "#000" },
    previewImage: {
        width: "100%",
        height: 200, marginTop: 10,
        borderRadius: 10,
        resizeMode: 'cover'
    },
    featuresContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 5
    },
    featureButton: {
        borderWidth: 1,
        borderColor: "#ccc",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f9f9f9'
    },
    featureSelected: {
        backgroundColor: "#ff6300",
        borderColor: "#ff6300"
    },
    submitBtn: {
        backgroundColor: '#ff6300',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20
    },
    submitText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18
    },
    notificationBadge: {
        position: 'absolute',
        right: -5,
        top: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    }
});