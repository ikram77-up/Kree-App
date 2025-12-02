import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Modal, Alert, ActivityIndicator, ScrollView, Image
} from 'react-native';
import { useAuth } from '../Context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibraryAsync, MediaTypeOptions, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL;


const toBoolean = (value) => String(value) === 'true';


const featuresList = [
    { key: 'gps', label: 'GPS' },
    { key: 'bluetooth', label: 'Bluetooth' },
    { key: 'climatisation', label: 'Climatisation' },
];

export default function MyCarsScreen({ navigation }) {
    const { token, user } = useAuth();
    const [cars, setCars] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState(null);

    const [carForm, setCarForm] = useState({
        brand: '', modelCar: '', color: '', km: '',
        fuelType: 'essence', gearBox: 'manuelle', seats: '4',
        image: null,      // URI du fichier sélectionné (pour upload)
        imageUrl: '',     // URL/Path de l'image si on est en mode EDIT
        gps: false,
        bluetooth: false,
        climatisation: false,
    });
    const { gps, bluetooth, climatisation } = carForm;


    const fetchCars = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/car`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                // afficher que les voitures de l'agence connectée  pour user agence 
                const myCars = data.filter(c =>
                    (c.userId?._id === user._id) || (c.userId === user._id)
                );
                setCars(myCars);
            }
        } catch (error) {
            console.error("Error loading cars:", error);
            Alert.alert("Error", "Unable to load your cars");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    // upload image
    const pickImage = async () => {
        const { status } = await requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', "Access to the gallery is necessary.");
            return;
        }

        let result = await launchImageLibraryAsync({
            mediaTypes: MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setCarForm({ ...carForm, image: result.assets[0].uri, imageUrl: null });
        }
    };

    // ajout et update de voiture 
    const handleSaveCar = async () => {
        if (!carForm.brand || !carForm.modelCar || !carForm.km || (!isEditing && !carForm.image && !carForm.imageUrl)) {
            Alert.alert("Error", "Brand, Model, Mileage and Image are mandatory.");
            return;
        }

        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/car/update/${selectedCarId}` : `${API_URL}/car`;

        const formData = new FormData();

        // Ajout des champs texte
        formData.append('brand', carForm.brand);
        formData.append('modelCar', carForm.modelCar);
        formData.append('color', carForm.color);
        formData.append('km', String(carForm.km));
        formData.append('fuelType', carForm.fuelType);
        formData.append('gearBox', carForm.gearBox);
        formData.append('seats', String(carForm.seats));

        // Ajout des fonctionnalités (boolean)
        formData.append('gps', String(carForm.gps));
        formData.append('bluetooth', String(carForm.bluetooth));
        formData.append('climatisation', String(carForm.climatisation));

        // Ajout de l'IMAGE 
        if (carForm.image && !carForm.imageUrl) {
            const uri = carForm.image;
            const filename = uri.split('/').pop();
            const type = 'image/' + (filename.split('.').pop() === 'jpg' ? 'jpeg' : filename.split('.').pop());
            formData.append('image', { uri, name: filename, type });
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,

                },
                body: formData
            });

            if (response.ok) {
                Alert.alert("Success", isEditing ? "Car updated." : "Car added.");
                setModalVisible(false);
                fetchCars(); // Rafraîchir la liste
                resetForm();
            } else {
                const err = await response.json();
                console.error("Mongoose/API error:", err.message);
                Alert.alert("Error", err.message || "Operation failed");
            }
        } catch (error) {
            console.error("Network/general error:", error);
            Alert.alert("Error", "Network problem during registration.");
        }
    };

    // reinstaliation de la voiture
    const openEditModal = (car) => {
        const features = car.features || {}; // Sécurité

        setCarForm({
            brand: car.brand, modelCar: car.modelCar, color: car.color,
            km: String(car.km), fuelType: car.fuelType, gearBox: car.gearBox,
            seats: String(car.seats),
            image: car.image,
            imageUrl: car.image, // Sauvegarde l'ancienne URL
            gps: toBoolean(features.gps) || false,
            bluetooth: toBoolean(features.bluetooth) || false,
            climatisation: toBoolean(features.climatisation) || false,
        });
        setIsEditing(true);
        setSelectedCarId(car._id);
        setModalVisible(true);
    };

    const resetForm = () => {
        setCarForm({
            brand: '', modelCar: '', color: '', km: '', fuelType: 'essence',
            gearBox: 'manuelle', seats: '4', image: null, imageUrl: '',
            gps: false, bluetooth: false, climatisation: false
        });
        setIsEditing(false);
        setSelectedCarId(null);
    };

    //fonction pour supprimer voiture
    const handleDeleteCar = (carId) => {
        Alert.alert(
            "Confirmation",
            "Are you sure you want to delete this car?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_URL}/car/delete/${carId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            if (response.ok) {
                                Alert.alert("Success", "Car deleted successfully.");
                                fetchCars(); // Rafraîchir la liste
                            } else {
                                const err = await response.json();
                                Alert.alert("Error", err.message || "Deletion failed.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Network problem during deletion.");
                        }
                    }
                }
            ]
        );
    };


    const renderCarCard = ({ item }) => (
        // Rendre la carte entière cliquable pour aller aux détails
        <TouchableOpacity
            style={styles.carCard}
            onPress={() => navigation.navigate('CarDetailsScreen', { carName: `${item.brand} ${item.modelCar} ${item.color}`, carId: item._id, imageUrl: `${API_URL}/${item.image}` })}
            activeOpacity={0.8}
        >
            <View style={styles.carIcon}>
                <Image
                    source={{ uri: `${API_URL}/${item.image}` }}
                    style={styles.carImagePreview}
                />
            </View>
            <View style={styles.carInfo}>
                <Text style={styles.carTitle}>{item.brand} {item.modelCar}</Text>
                <Text style={styles.carKm}>{item.km} KM • {item.seats} Places</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                    <FontAwesome5 name="edit" size={16} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCar(item._id)} style={[styles.actionBtn, { borderColor: 'red' }]}>
                    <FontAwesome5 name="trash" size={16} color="red" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const FeatureToggle = ({ label, state, onPress }) => (
        <TouchableOpacity
            style={[styles.featureBtn, state && styles.featureBtnActive]}
            onPress={onPress}
        >
            <FontAwesome5 name={state ? "check-circle" : "circle"} size={14} color={state ? "#fff" : "#666"} style={{ marginRight: 5 }} />
            <Text style={[styles.featureBtnText, state && { color: '#fff' }]}>{label}</Text>
        </TouchableOpacity>
    );


 
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <FontAwesome5 name="arrow-left" size={20} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My cars ({cars.length})</Text>
                <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={styles.addBtn}>
                    <FontAwesome5 name="plus" size={16} color="#fff" />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#ff7b00" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={cars}
                    keyExtractor={(item) => item._id}
                    renderItem={renderCarCard}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>Aucune voiture. Ajoutez-en une !</Text>}
                />
            )}

            {/* MODALE AJOUT / MODIF */}
            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{isEditing ? "Update Car" : "New Car"}</Text>

                        <ScrollView>
                            {/* Image Upload */}
                            <Text style={styles.label}>Image (Obligatoire)</Text>
                            {(carForm.image || carForm.imageUrl) &&
                                <Image
                                    // Utilise l'URI locale si nouvelle, ou l'URL API si existante
                                    source={{ uri: carForm.image || `${API_URL}/${carForm.imageUrl}` }}
                                    style={styles.carImagePreviewModal}
                                />
                            }
                            <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn}>
                                <Text style={styles.imagePickerText}>{carForm.image || carForm.imageUrl ? "Changer l'image" : "Sélectionner Image"}</Text>
                            </TouchableOpacity>

                            {/* Inputs */}
                            <Text style={styles.label}>Marque</Text><TextInput style={styles.input} placeholder="Dacia" value={carForm.brand} onChangeText={(t) => setCarForm({ ...carForm, brand: t })} />
                            <Text style={styles.label}>Modèle</Text><TextInput style={styles.input} placeholder="Logan" value={carForm.modelCar} onChangeText={(t) => setCarForm({ ...carForm, modelCar: t })} />
                            <Text style={styles.label}>Couleur</Text><TextInput style={styles.input} placeholder="Rouge" value={carForm.color} onChangeText={(t) => setCarForm({ ...carForm, color: t })} />
                            <Text style={styles.label}>Km (KM)</Text><TextInput style={styles.input} placeholder="50000" keyboardType="numeric" value={carForm.km} onChangeText={(t) => setCarForm({ ...carForm, km: t })} />

                            {/* Pickers */}
                            <Text style={styles.label}>Type de carburant</Text>
                            <View style={styles.pickerBox}><Picker selectedValue={carForm.fuelType} onValueChange={(v) => setCarForm({ ...carForm, fuelType: v })}>
                                <Picker.Item label="Diesel" value="diesel" />
                                <Picker.Item label="Essence" value="essence" />
                                <Picker.Item label="Hybride" value="hybride" />
                                <Picker.Item label="Électrique" value="Electric" />
                            </Picker></View>

                            <Text style={styles.label}>Boîte de vitesse</Text>
                            <View style={styles.pickerBox}><Picker selectedValue={carForm.gearBox} onValueChange={(v) => setCarForm({ ...carForm, gearBox: v })}>
                                <Picker.Item label="Manuelle" value="manuelle" />
                                <Picker.Item label="Automatique" value="automatique" />
                            </Picker></View>

                            <Text style={styles.label}>Places</Text>
                            <View style={styles.pickerBox}><Picker selectedValue={carForm.seats} onValueChange={(v) => setCarForm({ ...carForm, seats: v })}>
                                <Picker.Item label="2" value="2" />
                                <Picker.Item label="4" value="4" />
                                <Picker.Item label="5" value="5" />
                                <Picker.Item label="7" value="7" />
                            </Picker></View>

                            {/* Features Toggles */}
                            <Text style={styles.label}>Fonctionnalités</Text>
                            <View style={styles.featuresContainer}>
                                <FeatureToggle label="GPS" state={gps} onPress={() => setCarForm({ ...carForm, gps: !carForm.gps })} />
                                <FeatureToggle label="Bluetooth" state={bluetooth} onPress={() => setCarForm({ ...carForm, bluetooth: !carForm.bluetooth })} />
                                <FeatureToggle label="Climatisation" state={climatisation} onPress={() => setCarForm({ ...carForm, climatisation: !climatisation })} />
                            </View>


                            <View style={styles.modalButtons}>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                    <Text style={styles.btnTextCancel}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSaveCar} style={styles.saveBtn}>
                                    <Text style={styles.btnTextSave}>Enregistrer</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Composant de bascule de fonctionnalité (maintenu en dehors de la fonction principale pour la clarté)
const FeatureToggle = ({ label, state, onPress }) => (
    <TouchableOpacity
        style={[styles.featureBtn, state && styles.featureBtnActive]}
        onPress={onPress}
    >
        <FontAwesome5 name={state ? "check-circle" : "circle"} size={14} color={state ? "#fff" : "#666"} style={{ marginRight: 5 }} />
        <Text style={[styles.featureBtnText, state && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
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
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    backBtn: {
        padding: 5
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff7b00',
        padding: 8,
        borderRadius: 20,
        paddingHorizontal: 12
    },
    addBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 12
    },

    carCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05
    },
    carImagePreview: {
        width: 60,
        height: 40,
        borderRadius: 8,
        marginRight: 15,
        resizeMode: 'cover'
    },
    carInfo: { flex: 1 },
    carTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000'
    },
    carKm: {
        color: '#666',
        fontSize: 12, marginTop: 2
    },
    actions: {
        flexDirection: 'row',
        gap: 15
    },
    actionBtn: { padding: 5 },


    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15, padding: 20,
        maxHeight: '90%'
    },
    modalTitle: {
        fontSize: 20, fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#ff7b00'
    },

    label: {
        marginBottom: 5,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: '#f9f9f9'
    },
    pickerBox: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden'
    },


    imagePickerBtn: {
        backgroundColor: '#eee',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10
    },
    imagePickerText: {
        fontWeight: 'bold',
        color: '#000'
    },
    carImagePreviewModal: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 10,
        resizeMode: 'cover'
    },

    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15, gap: 8
    },
    featureBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff'
    },
    featureBtnActive: {
        backgroundColor: '#ff6300',
        borderColor: '#000000'
    },
    featureBtnText: {
        fontSize: 14,
        fontWeight: 'bold', color: '#333'
    },

    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10
    },
    cancelBtn: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        marginRight: 5,
        backgroundColor: '#eee',
        borderRadius: 8
    },
    saveBtn: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        marginLeft: 5,
        backgroundColor: '#ff7b00',
        borderRadius: 8
    },
    btnTextSave: {
        color: '#fff',
        fontWeight: 'bold'
    },
    btnTextCancel: {
        color: '#000',
        fontWeight: 'bold'
    }
});