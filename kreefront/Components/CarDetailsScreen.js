import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../Context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const CarDetailCard = ({ label, value, iconName }) => (
    <View style={detailsStyles.detailCard}>
        <FontAwesome5 name={iconName} size={22} color="#ff7b00" style={detailsStyles.detailIcon} />
        <Text style={detailsStyles.detailLabel}>{label}</Text>
        <Text style={detailsStyles.detailValue}>{value}</Text>
    </View>
);

const FeatureItem = ({ icon, label, active = false }) => (
    <View style={[detailsStyles.featureItem, active && detailsStyles.featureItemActive]}>
        <FontAwesome5 name={icon} size={14} color={active ? '#fff' : '#ff7b00'} />
        <Text style={[detailsStyles.featureText, active && { color: '#fff' }]}>{label}</Text>
    </View>
);

export default function CarDetailsScreen({ route, navigation }) {
    const { carId } = route.params;
    const { token } = useAuth();
    const [car, setCar] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const insets = useSafeAreaInsets();

    const fetchCarDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/car/${carId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setCar(data);
            } else {
                Alert.alert("Error", "Car not found.");
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Unable to load details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCarDetails();
    }, [carId]);

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#ff6300" />
            </View>
        );
    }

    if (!car) {
        return <View style={[styles.container, { paddingTop: insets.top }]}><Text style={styles.noDataText}>Details not available.</Text></View>;
    }

    const carFeatures = car.features || {};

    const translatedGearBox = car.gearBox === 'manuelle' ? 'Manual' : car.gearBox === 'automatique' ? 'Automatic' : car.gearBox;
    const translatedFuelType = car.fuelType === 'essence' ? 'Gasoline' : car.fuelType === 'diesel' ? 'Diesel' : car.fuelType === 'hybride' ? 'Hybrid' : car.fuelType;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <FontAwesome5 name="arrow-left" size={24} color="#030101ff" />
                    </TouchableOpacity>
                </View>

                <Image
                    source={{ uri: `${API_URL}/${car.image}` }}
                    style={styles.mainImage}
                />

                <View style={styles.detailsBox}>
                    <Text style={styles.title}>{car.brand} {car.modelCar}</Text>
                    <Text style={styles.subtitle}>{car.color}</Text>

                    <View style={styles.separator} />

                    <Text style={styles.sectionTitle}>Car Information</Text>
                    <View style={detailsStyles.detailsGrid}>
                        <CarDetailCard label="KM" value={`${car.km} KM`} iconName="road" />
                        <CarDetailCard label="Gearbox" value={translatedGearBox} iconName="cogs" />
                        <CarDetailCard label="Fuel Type" value={translatedFuelType} iconName="gas-pump" />
                        <CarDetailCard label="Seats" value={`${car.seats} Pers.`} iconName="user-friends" />
                    </View>

                    <View style={styles.separator} />

                    <Text style={styles.sectionTitle}>Features</Text>
                    <View style={detailsStyles.featureContainer}>
                        {carFeatures.gps && <FeatureItem icon="map-marked-alt" label=" GPS" active={true} />}
                        {carFeatures.bluetooth && <FeatureItem icon="bluetooth-b" label="Bluetooth" active={true} />}
                        {carFeatures.climatisation && <FeatureItem icon="wind" label="Air Conditioning" active={true} />}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const detailsStyles = StyleSheet.create({
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
        rowGap: 15,
    },
    detailCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
        elevation: 3,
    },
    detailIcon: {
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },

    featureContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#f0f0f0',
    },
    featureItemActive: {
        backgroundColor: '#ff6300',
        borderColor: '#000000',
    },
    featureText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollViewContent: {
        paddingBottom: 40,
    },
    header: {
        paddingTop: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    backBtn: {
        padding: 0,
        width: 30,
        alignItems: 'flex-start'
    },
    noDataText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#666'
    },

    mainImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        marginBottom: 15,
    },
    detailsBox: {
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 2
    },
    subtitle: {
        fontSize: 18,
        color: '#ff7b00',
        fontWeight: 'bold',
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginTop: 10
    },
    separator: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20
    },
});