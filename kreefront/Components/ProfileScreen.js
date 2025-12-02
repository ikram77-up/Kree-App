// Components/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../Context/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ProfileScreen({ navigation }) {
    const { user, profile, logout, token, updateProfileContext } = useAuth();

    const [imageUri, setImageUri] = useState(profile?.picture ? `${API_URL}/${profile.picture}`.replace(/\\/g, '/') : null);
    const [isUploading, setIsUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to upload images.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!imageUri || imageUri === `${API_URL}/${profile?.picture}`.replace(/\\/g, '/')) return;

        setIsUploading(true);

        try {
            const formData = new FormData();
            
            let uri = imageUri;
            if (Platform.OS === 'android' && !uri.startsWith('file://')) {
                uri = 'file://' + uri;
            }

            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;


            formData.append('profilePicture', {
                uri: uri,
                name: filename,
                type,
            });

            const response = await fetch(`${API_URL}/profile/picture`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                updateProfileContext(data.profile);
                setImageUri(`${API_URL}/${data.profile.picture}`.replace(/\\/g, '/'));
                Alert.alert('Success', 'Profile picture updated successfully!');
            } else {
                Alert.alert('Upload Failed', data.message || 'An error occurred.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An error occurred while uploading the image.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Disconnect",
            "Do you really want to disconnect?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes", onPress: () => logout() }
            ]
        );
    };

    return (
        <LinearGradient
            colors={["#ff7b00ff", "#000000ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.container}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <FontAwesome5 name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={pickImage}>
                            <View style={styles.avatarCircle}>
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} style={styles.avatarImage} />
                                ) : (
                                    <FontAwesome5 name="user" size={50} color="#fff" />
                                )}
                            </View>
                            <View style={styles.editIcon}>
                                <FontAwesome5 name="camera" size={15} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <Text style={styles.userRole}>{user?.role === 'client' ? 'Client' : 'Agency'}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <InfoItem icon="envelope" label="Email" value={user?.email} />
                        <InfoItem icon="phone" label="phone" value={profile?.phoneNumber || 'Not specified'} />
                        {user?.role === 'client' && (
                            <InfoItem icon="id-card" label="CIN" value={profile?.cin || 'Not specified'} />
                        )}
                        {user?.role === 'agency' && (
                            <>
                                <InfoItem icon="map-marker-alt" label="Adress" value={profile?.address} />
                                <InfoItem icon="city" label="Ville" value={profile?.city} />
                            </>
                        )}
                    </View>

                    {imageUri !== `${API_URL}/${profile?.picture}`.replace(/\\/g, '/') && (
                         <TouchableOpacity style={styles.saveBtn} onPress={handleUpload} disabled={isUploading}>
                            {isUploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveText}>Save Picture</Text>
                            )}
                        </TouchableOpacity>
                    )}
                   
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Disconnect</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </LinearGradient>
    );
}

const InfoItem = ({ icon, label, value }) => (
    <View style={styles.infoItem}>
        <View style={styles.iconBox}>
            <FontAwesome5 name={icon} size={18} color="#ff7b00" />
        </View>
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold'
    },
    content: { padding: 20 },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#333',
        elevation: 10,
        shadowColor: '#ff7b00',
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    editIcon: {
        position: 'absolute',
        bottom: 10,
        right: 0,
        backgroundColor: '#ff7b00',
        padding: 8,
        borderRadius: 15,
    },
    userName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold'
    },
    userRole: {
        color: '#aaa',
        fontSize: 16,
        textTransform: 'capitalize'
    },
    infoSection: {
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        gap: 10
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        width: 40, height: 40,
        backgroundColor: '#000000',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    infoLabel: {
        color: '#ffffffa6',
        fontSize: 12
    },
    infoValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    saveBtn: {
        backgroundColor: '#00a86b',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutBtn: {
        backgroundColor: '#ff6300',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000000'
    },
    logoutText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold'
    }
});
