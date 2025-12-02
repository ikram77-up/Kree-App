import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, ActivityIndicator, Platform
} from 'react-native';
import { useAuth } from '../Context/AuthContext';
import { useSocket } from '../Context/SocketContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const API_URL = process.env.EXPO_PUBLIC_API_URL;


const OfferCard = ({ offer, onAction, onViewDetails }) => {
    const carDetails = offer.carId;
    const agencyName = offer.agenceId?.name || "Agence Inconnue";

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onViewDetails(carDetails._id)}
            activeOpacity={0.8}
        >
            <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>PRIX PROPOSÉ</Text>
                <Text style={styles.priceValue}>{offer.offrePrice} MAD</Text>
            </View>

            <View style={styles.details}>
                <Text style={styles.agencyName}>Par: {agencyName}</Text>
                <Text style={styles.carModel}>Voiture: {carDetails?.brand} {carDetails?.modelCar}</Text>
                <Text style={styles.carDetails}>{carDetails?.fuelType} / {carDetails?.gearBox} / {carDetails?.seats} places</Text>
                <Text style={styles.message}>Message: {offer.message}</Text>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={(e) => { e.stopPropagation(); onAction(offer._id, 'rejected'); }}
                >
                    <FontAwesome5 name="times" size={14} color="#666" style={{ marginRight: 5 }} />
                    <Text style={styles.rejectText}>Refuser</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={(e) => { e.stopPropagation(); onAction(offer._id, 'accepted'); }}
                >
                    <FontAwesome5 name="check" size={14} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.acceptText}>Accepter</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default function ClientOffersScreen({ navigation }) {
    const { user, token } = useAuth();
    const { socket } = useSocket();

    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    
    const [deliveryStatus, setDeliveryStatus] = useState(null);

    const fetchOffers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/offres/client`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setOffers(data.filter(o => o.status === 'pending'));
            } else {
                const err = await response.json();
                Alert.alert("Error", err.message || "Unable to load offers.");
            }
        } catch (e) {
            console.error("Error loading offers:", e);
            Alert.alert("Error", "Server connection problem.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();

        if (!socket) return;

        socket.on('new_offer_received', (newOffer) => {
            Alert.alert("New Offer", `You have received an offer for ${newOffer.carId?.modelCar}`);

            if (newOffer.status === 'pending') {
                setOffers(prev => [newOffer, ...prev]);
            }
        });

        // mise a jour en route (Envoyé par l'Agence)
        socket.on('send_delivery_update', (data) => {
            setDeliveryStatus({
                message: data.message,
                status: 'en_route',
            });
        });

        //  Confirmation d'arrivée FINALE (Envoyé par l'Agence)
        socket.on('confirm_delivery_arrival', (data) => {
            // Afficher un message clair d'arrivée finale
            Alert.alert(
                "Delivery Complete!",
                `Your car, the ${data.carModel || 'N/A'}, has officially arrived. Safe travels!`
            );

            // Masquer la bannière "en route" après l'arrivée
            setDeliveryStatus(null);
        });


        return () => {
            socket.off('new_offer_received');
            socket.off('send_delivery_update');
            socket.off('confirm_delivery_arrival');
        };
    }, [socket]);


    const handleViewDetails = (carId) => {
        navigation.navigate('CarDetailsScreen', { carId: carId });
    };

    const handleOfferAction = async (offerId, status) => {
        const url = `${API_URL}/offres/answer`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    offreId: offerId,
                    status: status
                })
            });

            if (response.ok) {
                const d = await response.json();
                const confirmedOffer = d.offre;

                setOffers(prev => prev.filter(o => o._id !== offerId));

                if (status === 'accepted') {
                    Alert.alert("Congratulations!", `Booking confirmed. The agency ${confirmedOffer.agenceId?.name || ""} has been notified.`);
                } else {
                    Alert.alert("Refused", "The offer has been rejected.");
                }

            } else {
                const d = await response.json();
                Alert.alert("Error", d.message || "Unable to process the offer.");
            }
        } catch (e) {
            Alert.alert("Error", "Network problem during update.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Vos Offres ({offers.length})</Text>
                <TouchableOpacity onPress={fetchOffers}>
                    <FontAwesome5 name="sync-alt" size={20} color="#ff7b00" />
                </TouchableOpacity>
            </View>

            {/* 🚨 BANNIÈRE DE CONFIRMATION DE LIVRAISON EN COURS */}
            {deliveryStatus && (
                <View style={[styles.deliveryBanner, deliveryStatus.status === 'arrived' && styles.deliveryBannerArrived]}>
                    <View style={styles.deliveryContent}>
                        <FontAwesome5
                            name={deliveryStatus.status === 'arrived' ? "check-circle" : "truck"}
                            size={20}
                            color="#fff"
                            style={{ marginRight: 10 }}
                        />
                        <View>
                            <Text style={styles.deliveryTitle}>
                                {deliveryStatus.status === 'arrived' ? "ARRIVÉE CONFIRMÉE" : "Delivery En Route!"}
                            </Text>
                            <Text style={styles.deliveryMessage}>{deliveryStatus.message}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => setDeliveryStatus(null)} style={styles.closeBtn}>
                        <FontAwesome5 name="times" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}


            {isLoading ? (
                <ActivityIndicator size="large" color="#ff7b00" style={styles.loadingSpinner} />
            ) : (
                <FlatList
                    data={offers}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <OfferCard
                            offer={item}
                            onAction={handleOfferAction}
                            onViewDetails={handleViewDetails}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <FontAwesome5 name="inbox" size={50} color="#ccc" />
                            <Text style={styles.emptyText}>En attente de réponses d'agences...</Text>
                        </View>
                    }
                    contentContainerStyle={styles.flatlistContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingHorizontal: 15,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    loadingSpinner: { marginTop: 50 },

    deliveryBanner: {
        backgroundColor: '#ff7b00', 
        padding: 15,
        marginHorizontal: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    deliveryBannerArrived: {
        backgroundColor: '#00a86b', 
    },
    deliveryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    deliveryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    deliveryMessage: {
        color: '#fff',
        fontSize: 14,
        marginTop: 2,
    },
    closeBtn: {
        padding: 5,
    },

    flatlistContent: { paddingHorizontal: 15, paddingBottom: 20, paddingTop: 10 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 15, color: '#888', fontSize: 16 },

    card: {
        backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, padding: 15,
        borderLeftWidth: 5,
        borderLeftColor: '#ff6300',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
        position: 'relative',
        paddingRight: 125,
    },
    priceBox: {
        backgroundColor: '#ff6300',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 0,
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
        position: 'absolute',
        top: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        width: 110,
        height: '100%',

    },
    priceValue: { color: '#fff', fontWeight: 'bold', fontSize: 22, textAlign: 'center' },
    priceLabel: { color: '#000', fontSize: 10, marginTop: 5, fontWeight: '500', textAlign: 'center' },

    details: { marginBottom: 15, },
    agencyName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    carModel: { fontSize: 14, color: '#555', marginTop: 5, fontWeight: 'bold' },
    carDetails: { fontSize: 12, color: '#666' },
    message: {
        fontSize: 14,
        color: '#333',
        marginTop: 10, fontStyle: 'italic'
    },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 10, borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10
    },
    rejectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eee',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rejectText: {
        color: '#666',
        fontWeight: '600',
        marginLeft: 3,
        fontSize: 15
    },
    acceptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00a86b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    acceptText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 3,
        fontSize: 12
    }
});