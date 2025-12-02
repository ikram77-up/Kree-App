import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Platform, ScrollView, Image
} from 'react-native';
import { useAuth } from '../Context/AuthContext';
import { useSocket } from '../Context/SocketContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const NOTIFICATION_SOUND = require('../assets/notification.mp3');

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

const RequestCard = ({ item, onAccept, onViewDetails }) => {
    const calculateTimeLeft = () => {
        const deadline = new Date(item.expiresAt);
        return Math.max(0, deadline - new Date());
    };
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [item]);

    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);
    if (timeLeft <= 0) return null;

    return (
        <TouchableOpacity
            style={[styles.card, item.isNew && styles.newCard]}
            onPress={() => onViewDetails(item)}
            activeOpacity={0.9}
        >
            {item.isNew && <View style={styles.unreadIndicator} />}
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome5 name="user-circle" size={20} color="#ccc" />
                    <Text style={styles.clientName}>{item.userId?.name || "Client"}</Text>
                </View>
                <Text style={styles.priceText}>Min: {item.priceMin} MAD</Text>
                <Text style={styles.priceText}>Max: {item.priceMax} MAD</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.carTitle}>{item.modelofCar}</Text>
                <View style={styles.row}>
                    <Text style={styles.detail}>{new Date(item.startDate).toLocaleDateString()}</Text>
                    <Text style={styles.detail}> {item.pickupLocation}</Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome5 name="clock" size={14} color="#ff7b00" />
                    <Text style={styles.timer}>{minutes}:{seconds < 10 ? '0' : ''}{seconds}</Text>
                </View>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(item)}>
                    <Text style={styles.btnText}>FAIRE UNE OFFRE</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};


const RequestDetailsModal = ({ visible, onClose, request, API_URL, onAcceptOffer }) => {
    if (!request) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.detailsModalContent}>
                    <Text style={styles.modalTitle}>Request Details</Text>
                    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

                        <Text style={styles.detailLabel}>Client Name:</Text>
                        <Text style={styles.detailValue}>{request.userId?.name || "N/A"}</Text>
                        <Text style={styles.detailLabel}>Phone Number:</Text>
                        <Text style={styles.detailValue}>{request.userId?.phoneNumber || "N/A"}</Text>

                        <Text style={styles.detailLabel}>Dates:</Text>
                        <Text style={styles.detailValue}>{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</Text>

                        <View style={styles.imageSection}>
                            <Text style={styles.sectionTitle}>Client Documents</Text>

                            <Text style={styles.detailLabel}>ID/CIN Image:</Text>
                            {request.cin ? (
                                <Image source={{ uri: `${API_URL}/${request.cin}` }} style={styles.documentImage} />
                            ) : (
                                <Text style={styles.noDocument}>CIN not provided.</Text>
                            )}

                            <Text style={styles.detailLabel}>Profile Picture:</Text>
                            {request.picture ? (
                                <Image source={{ uri: `${API_URL}/${request.picture}` }} style={styles.documentImage} />
                            ) : (
                                <Text style={styles.noDocument}>Picture not provided.</Text>
                            )}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                                <Text style={{ color: '#000' }}>Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onAcceptOffer(request)} style={styles.confirmBtn}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Make Offer</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};



export default function AgenceHomeScreen({ navigation }) {
    const { user, token } = useAuth();
    const { socket } = useSocket();
    const [requests, setRequests] = useState([]);
    const [myCars, setMyCars] = useState([]);

    const unreadCount = requests.filter(r => r.isNew).length;

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [offerPrice, setOfferPrice] = useState('');
    const [selectedCar, setSelectedCar] = useState('');
    const [message, setMessage] = useState('Disponible.');
    const [isSending, setIsSending] = useState(false);

    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [detailedRequest, setDetailedRequest] = useState(null);


    // { status: 'EN_ROUTE_PENDING' | 'EN_ROUTE_SENT', clientId, offerId, carModel }
    const [deliveryFollowUp, setDeliveryFollowUp] = useState(null);


    const fetchMyCars = async () => {
        try {
            const response = await fetch(`${API_URL}/car`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                const myAgencyCars = data.filter(c => c.userId?._id === user._id || c.userId === user._id);
                setMyCars(myAgencyCars);
            }
        } catch (error) { console.log("Error loading cars", error); }
    };

    const fetchInitialRequests = async () => {
        setRequests([]);
    };

    useEffect(() => {
        fetchMyCars();
        fetchInitialRequests();

        const unsubscribe = navigation.addListener('focus', () => {
            fetchMyCars();
        });
        return unsubscribe;
    }, [navigation]);

    // gestion de sockets
    useEffect(() => {
        if (!socket) return;
        socket.emit('registerAgency', user._id);

        // Nouvelle demande de prix
        socket.on('new_price_request', (newRequest) => {
            const requestWithStatus = { ...newRequest, isNew: true };
            setRequests(prev => [requestWithStatus, ...prev]);
            playNotificationSound();
        });

        // Offre acceptée par le client
        socket.on('offer_accepted_by_client', (data) => {
            // Stocker les données pour le bouton de livraison
            setDeliveryFollowUp({ ...data, status: 'EN_ROUTE_PENDING' });
            playNotificationSound();

            // Retirer la requête traitée de la liste
            setRequests(prev => prev.filter(r => r._id !== data.nameyourpriceId));
        });

        return () => {
            socket.off('new_price_request');
            socket.off('offer_accepted_by_client');
        };
    }, [socket]);


    const handleMarkAsRead = (requestId) => {
        setRequests(prevRequests => prevRequests.map(req =>
            req._id === requestId ? { ...req, isNew: false } : req
        ));
    };

    const openRequestDetails = (request) => {
        setDetailedRequest(request);
        setIsDetailsModalVisible(true);
        handleMarkAsRead(request._id);
    };

    const handleAccept = (request) => {
        setSelectedRequest(request);
        setOfferPrice(String(request.priceMax));
        setModalVisible(true);
        handleMarkAsRead(request._id);
        setIsDetailsModalVisible(false);
    };

    const sendOffer = async () => {
        if (!selectedCar) {
            Alert.alert("Error", "Please choose a car from your garage.");
            return;
        }
        setIsSending(true);
        try {
            const response = await fetch(`${API_URL}/offres`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    carId: selectedCar,
                    nameyourpriceId: selectedRequest._id,
                    offrePrice: parseFloat(offerPrice),
                    message: message
                })
            });
            if (response.ok) {
                Alert.alert("Success", "Offer sent! You can make another offer if required.");
                setModalVisible(false);
            } else {
                Alert.alert("Error", "Failed to send");
            }
        } catch (e) { Alert.alert("Error", "Network"); }
        setIsSending(false);
    };

    const handleSendDeliveryMessage = () => {
        if (!deliveryFollowUp) return;

        // Émission de l'événement pour la notification "En Route"
        socket.emit('send_delivery_update', {
            clientId: deliveryFollowUp.clientId,
            offerId: deliveryFollowUp.offerId,
            carModel: deliveryFollowUp.carModel, // Passé pour le message client
            message: `Your ${deliveryFollowUp.carModel} is on its way! Estimated arrival: 10 minutes.`,
        });

        Alert.alert("Delivery Alert Sent", "The client has been notified that the car is en route.");

        // Mettre à jour le statut pour débloquer le bouton d'arrivée finale
        setDeliveryFollowUp(prev => ({ ...prev, status: 'EN_ROUTE_SENT' }));
    };

    //  CONFIRMATION L'ARRIVÉE FINALE
    const handleConfirmArrival = () => {
        if (!deliveryFollowUp || deliveryFollowUp.status !== 'EN_ROUTE_SENT') return;

        // Émission de l'événement final d'arrivée
        socket.emit('confirm_delivery_arrival', {
            clientId: deliveryFollowUp.clientId,
            offerId: deliveryFollowUp.offerId,
            carModel: deliveryFollowUp.carModel,
            message: `Your ${deliveryFollowUp.carModel} has arrived at the pickup location. Safe travels!`,
        });

        Alert.alert("Delivery Complete", "The final arrival notification has been sent to the client.");

        // Réinitialiser le suivi
        setDeliveryFollowUp(null);
    };


    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('ProfileScreen')}>
                    <FontAwesome5 name="user-circle" size={28} color="#ff7b00" />
                </TouchableOpacity>

                {/* gestion dynamique du boutton de suivi  */}
                {deliveryFollowUp && deliveryFollowUp.status === 'EN_ROUTE_PENDING' && (
                    // BOUTON 1: ENVOYER "EN ROUTE"
                    <TouchableOpacity style={styles.followUpBtn} onPress={handleSendDeliveryMessage}>
                        <FontAwesome5 name="truck" size={16} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.followUpText}>Send Delivery Update</Text>
                    </TouchableOpacity>
                )}

                {deliveryFollowUp && deliveryFollowUp.status === 'EN_ROUTE_SENT' && (
                    // BOUTON 2: CONFIRMER ARRIVÉE FINALE
                    <TouchableOpacity style={styles.confirmArrivalBtn} onPress={handleConfirmArrival}>
                        <FontAwesome5 name="check-double" size={16} color="#fff" style={{ marginRight: 5 }} />
                        <Text style={styles.followUpText}>Confirm Arrival</Text>
                    </TouchableOpacity>
                )}

                {/* BOUTON MY CARS (affiché si aucun suivi n'est actif) */}
                {(!deliveryFollowUp || deliveryFollowUp.status === 'EN_ROUTE_PENDING') && (
                    <TouchableOpacity style={styles.garageBtn} onPress={() => navigation.navigate('MyCarsScreen')}>
                        <FontAwesome5 name="car" size={16} color="#fff" />
                        <Text style={styles.garageText}>My Cars</Text>
                    </TouchableOpacity>
                )}

                {/* BOUTON NOTIFICATION AVEC BADGE */}
                <TouchableOpacity style={styles.notificationWrapper}>
                    <FontAwesome5 name="bell" size={24} color="#ff6300" />
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>Customer Requests ({requests.length})</Text>

            {/* LISTE DES request */}
            <FlatList
                data={requests}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <RequestCard
                        item={item}
                        onAccept={handleAccept}
                        onViewDetails={openRequestDetails}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={{ color: '#888' }}>Awaiting customer requests...</Text>
                        <ActivityIndicator color="#ff7b00" style={{ marginTop: 10 }} />
                    </View>
                }
            />

            {/*FAIRE UNE OFFRE */}
            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Submit Your Offe</Text>
                        <Text style={styles.label}>Choose car :</Text>
                        <View style={styles.pickerBox}>
                            <Picker selectedValue={selectedCar} onValueChange={setSelectedCar}>
                                <Picker.Item label="-- Select --" value="" />
                                {myCars.map(car => (
                                    <Picker.Item key={car._id} label={`${car.brand} ${car.modelCar}`} value={car._id} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Prix (MAD) :</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={offerPrice} onChangeText={setOfferPrice} />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={sendOffer} style={styles.confirmBtn}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Detail de client */}
            <RequestDetailsModal
                visible={isDetailsModalVisible}
                onClose={() => setIsDetailsModalVisible(false)}
                request={detailedRequest}
                API_URL={API_URL}
                onAcceptOffer={handleAccept}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', paddingHorizontal: 15
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', paddingTop: 50, marginBottom: 20
    },



    followUpBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff7b00',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 10,
        justifyContent: 'center',
    },
    confirmArrivalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00a86b',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 10,
        justifyContent: 'center',
    },
    followUpText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Notifications
    notificationWrapper: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        right: -8,
        top: -8,
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
    },

    // Garage Button
    garageBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#000',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#ff7b00',
        marginHorizontal: 10,
        justifyContent: 'center',
    },
    garageText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },

    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    emptyState: { marginTop: 50, alignItems: 'center' },


    // Card styles
    card: {
        backgroundColor: '#f9f9f9',
        padding: 15, borderRadius: 10,
        marginBottom: 10, borderWidth: 1,
        borderColor: '#eee'
    },
    newCard: {
        backgroundColor: '#fffbe6',
        borderColor: '#ff7b00',
        borderLeftWidth: 5,
        borderLeftColor: '#ff7b00',
    },
    unreadIndicator: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'red',
        zIndex: 10,
    },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between', marginBottom: 10
    },
    clientName: { fontWeight: 'bold', marginLeft: 5 },
    priceText: { color: '#ff6300', fontWeight: 'bold' },
    cardBody: { marginBottom: 10 },
    carTitle: { fontSize: 16, fontWeight: 'bold' },
    row: { flexDirection: 'row', gap: 10, marginTop: 5 },
    detail: { color: '#666', fontSize: 12 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center'
    },
    timer: {
        color: 'red',
        fontWeight: 'bold',
        marginLeft: 5
    },
    acceptBtn: {
        backgroundColor: '#ff6300',
        borderColor: '#000',
        padding: 10, borderRadius: 8,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold', fontSize: 12
    },


    //  Offre
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20, borderRadius: 15
    },
    modalTitle: {
        fontSize: 20, fontWeight: 'bold',
        color: '#ff7b00', textAlign: 'center', marginBottom: 15
    },
    label: { fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
    input: {
        borderWidth: 1, borderColor: '#ccc',
        borderRadius: 8, padding: 10
    },
    pickerBox: {
        borderWidth: 1, borderColor: '#ccc',
        borderRadius: 8, overflow: 'hidden'
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between', marginTop: 20
    },
    cancelBtn: { padding: 15 },
    confirmBtn: {
        backgroundColor: '#ff7b00',
        padding: 15, borderRadius: 8
    },


    //  Détails Client
    detailsModalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        maxHeight: '80%',
    },
    detailLabel: {
        fontSize: 14,
        color: '#ff7b00',
        fontWeight: 'bold',
        marginTop: 10,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    imageSection: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    documentImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
        borderRadius: 8,
        marginVertical: 10,
    },
    noDocument: {
        color: '#888',
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 10,
    },
});