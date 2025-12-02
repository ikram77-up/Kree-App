import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Platform,
    TouchableOpacity
} from 'react-native';
import { useAuth } from '../Context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ClientRequestsScreen({ navigation }) {
    const { token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchClientRequests();
    }, []);

    const fetchClientRequests = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/price`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setRequests(data.data || []);
            } else {
                Alert.alert("Erreur", data.message || "Erreur lors du chargement des demandes.");
            }
        } catch (error) {
            console.error("Erreur réseau/API:", error);
            Alert.alert("Erreur Réseau", "Impossible de contacter le serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.requestCard}>
            <Text style={styles.cardTitle}>Car Model: **{item.modelofCar}**</Text>
            <Text style={styles.cardDetail}><FontAwesome5 name="map-marker-alt" size={14} color="#555" /> Pickup: {item.pickupLocation}</Text>
            <Text style={styles.cardDetail}><FontAwesome5 name="calendar-alt" size={14} color="#555" /> Dates: {new Date(item.startDate).toLocaleDateString()} to {new Date(item.endDate).toLocaleDateString()}</Text>
            <Text style={styles.cardDetail}><FontAwesome5 name="tag" size={14} color="#555" /> Budget Min: **{item.priceMin} MAD**</Text>
            <Text style={styles.cardDetail}><FontAwesome5 name="tag" size={14} color="#555" /> Budget Max: **{item.priceMax} MAD**</Text>

            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.offers ? item.offers.length : 0} Offer(s) Received</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.screenTitle}>M story of booking</Text>

            {isLoading ? (
                <ActivityIndicator size="large" color="#ff6300" style={{ marginTop: 50 }} />
            ) : requests.length > 0 ? (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshing={isLoading}
                    onRefresh={fetchClientRequests}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <FontAwesome5 name="inbox" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>You haven't made any car rental requests yet.</Text>
                    <TouchableOpacity style={styles.createRequestButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.createRequestText}>Create a new request</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff6300',
        paddingHorizontal: 5,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
        marginBottom: 20,
    },
    requestCard: {
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#ff7b00',
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardDetail: {
        fontSize: 14,
        color: '#555',
        marginTop: 3,
    },
    statusBadge: {
        marginTop: 10,
        alignSelf: 'flex-start',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        backgroundColor: '#ffe6cc',
    },
    statusText: {
        color: '#ff6300',
        fontWeight: '600',
        fontSize: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#999',
        textAlign: 'center'
    },
    createRequestButton: {
        backgroundColor: '#ff6300',
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    createRequestText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});