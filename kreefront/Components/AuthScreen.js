import React, { useState, useEffect } from 'react';
import { LinearGradient } from "expo-linear-gradient";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
// Importez la librairie d'icônes
import { Ionicons } from '@expo/vector-icons';


import {
    launchImageLibraryAsync,
    requestMediaLibraryPermissionsAsync,
    MediaType
} from 'expo-image-picker';

import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { useAuth } from '../Context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen({ navigation }) {

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false); // ✅ État pour la visibilité
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('client');
    const [name, setName] = useState('');
    const [cin, setCin] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pictureUrl, setPictureUrl] = useState(null);
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, register, firebaseLogin } = useAuth();

    // Fonction de bascule de la visibilité
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    //GESTION GOOGLE
    const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
        androidClientId: "YOUR_ANDROID_CLIENT_ID",
        webClientId: "847757431275-qh1g4vsvjehof83gvupktmp5snlcc3nd.apps.googleusercontent.com",
        iosClientId: "YOUR_IOS_CLIENT_ID",
    });

    //Facebook
    const [fbRequest, fbResponse, promptFacebook] = Facebook.useAuthRequest({
        clientId: 'YOUR_CLIENT_ID',
    });

    // Login Google 
    useEffect(() => {
        if (googleResponse?.type === 'success') {
            const { authentication } = googleResponse;
            const credential = GoogleAuthProvider.credential(authentication.idToken);

            signInWithCredential(auth, credential)
                .then(async (userCredential) => {
                    const firebaseUser = userCredential.user;
                    const data = await firebaseLogin(firebaseUser);

                    if (data && data.user) {
                        if (data.user.role === 'client') {
                            navigation.navigate(`ClientHomeScreen`)
                        } else if (data.user.role === 'agency') {
                            navigation.navigate(`AgenceHomeScreen`)
                        }
                    }
                })
                .catch(err => Alert.alert('Error', 'Google connection failed'));
        }
    }, [googleResponse]);

    // function picker

    const pickImage = async () => {
        const { status } = await requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refused', 'Access to gallery is refused!');
            return;
        }
        const result = await launchImageLibraryAsync({
            mediaTypes: MediaType.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) setPictureUrl(result.assets[0].uri);
    };

    // fonction handleSubmit
    const handleSubmit = async () => {
        if (isLoading) return;
        setIsLoading(true);

        if (isLogin) {
            // LOGIN
            const data = await login(email, password);
            if (data && data.user) {
                if (data.user.role === 'client') {
                    navigation.navigate(`ClientHomeScreen`)
                } else if (data.user.role === 'agency') {
                    navigation.navigate(`AgenceHomeScreen`)
                }
            }
        } else {
            // REGISTER
            // Validation
            if (!name || !email || !password || !role) {
                Alert.alert('Error', 'All fields are required.');
                setIsLoading(false);
                return;
            }
            if (role === 'client' && (!cin || !phoneNumber)) {
                Alert.alert('Error', 'for account client need cin and phone number are required.');
                setIsLoading(false);
                return;
            }
            if (role === 'agency' && (!address || !city || !phoneNumber)) {
                Alert.alert('Error', 'for agence, adress, city and phone are required.');
                setIsLoading(false);
                return;
            }

            const userData = {
                name, email, password, role, phoneNumber,
                ...(role === 'client' && { cin }),
                ...(role === 'agency' && { address, city }),
            };

            const success = await register(userData);

            if (success) {
                Alert.alert('Success', 'Registration successful! Logging in...');
                // user onnnect automatiquement
                const data = await login(email, password);

                if (data && data.user) {
                    if (data.user.role === 'client') {
                        navigation.navigate(`ClientHomeScreen`)
                    } else if (data.user.role === 'agency') {
                        navigation.navigate(`AgenceHomeScreen`)
                    }
                }
            }
        }
        setIsLoading(false);
    };


    return (

        <LinearGradient colors={["#ff7b00", "#000000"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Image source={require('../assets/logo-kree.png')} style={styles.logo} />
                <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

                {!isLogin && (
                    <>
                        <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} placeholderTextColor="#888" />
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
                            {['client', 'agency'].map(r => (
                                <TouchableOpacity key={r} onPress={() => setRole(r)} style={[
                                    styles.roleButton,
                                    { backgroundColor: role === r ? '#ff6300' : '#fff' }
                                ]}>
                                    <Text style={{ color: role === r ? '#fff' : '#000', fontWeight: 'bold' }}>
                                        {r === 'client' ? 'Client' : 'Agency'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {role === 'client' && (
                            <>
                                <TextInput placeholder="ID" value={cin} onChangeText={setCin} style={styles.input} placeholderTextColor="#888" />
                                <TextInput placeholder="Phone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" style={styles.input} placeholderTextColor="#888" />
                                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                                    <Text style={{ color: '#fff', textAlign: 'center' }}>Choose picture</Text>
                                </TouchableOpacity>
                                {pictureUrl && <Image source={{ uri: pictureUrl }} style={styles.previewImage} />}
                            </>
                        )}

                        {role === 'agency' && (
                            <>
                                <TextInput placeholder="Address" value={address} onChangeText={setAddress} style={styles.input} placeholderTextColor="#888" />
                                <TextInput placeholder="City" value={city} onChangeText={setCity} style={styles.input} placeholderTextColor="#888" />
                                <TextInput placeholder="Phone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" style={styles.input} placeholderTextColor="#888" />
                            </>
                        )}
                    </>
                )}

                <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#888" />

                <View style={styles.passwordContainer}>
                    <TextInput
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                        placeholderTextColor="#888"
                        style={styles.passwordInput}
                    />
                    <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        style={styles.eyeButton}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off' : 'eye'} 
                            size={24}
                            color="#333"
                        />
                    </TouchableOpacity>
                </View>


                <TouchableOpacity style={styles.switchBtn} onPress={() => setIsLogin(!isLogin)}>
                    <Text style={styles.switchText}>{isLogin ? "Don't have an account? Register now" : 'Already have an account? Login'}</Text>
                </TouchableOpacity>

                {/* the submission button */}
                <TouchableOpacity
                    style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>{isLogin ? 'Login' : 'Register'}</Text>
                    )}
                </TouchableOpacity>

                {/* Google / Facebook Buttons  */}
                <TouchableOpacity style={[styles.socialBtn, styles.google]} onPress={() => promptGoogle()} disabled={isLoading}>
                    <Image source={require('../assets/google.png')} style={styles.icon} />
                    <Text
                        style={[styles.socialText, { color: '#000' }]}>Continue with Google
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.socialBtn, styles.facebook]}
                    onPress={() => promptFacebook()} disabled={isLoading}>
                    <Image source={require('../assets/facebook.png')} style={styles.icon} />
                    <Text style={styles.socialText}>Continue with Facebook</Text>
                </TouchableOpacity>
            </ScrollView>

        </LinearGradient>

    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    },
    logo: {
        alignSelf: 'center',
        width: 120,
        height: 60,
        marginBottom: 30,
        marginTop: 20
    },
    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        backgroundColor: '#fff'
    },

    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginVertical: 8,
        backgroundColor: '#fff',
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        backgroundColor: 'transparent',
    },
    eyeButton: {
        paddingHorizontal: 15,
        height: '100%',
        justifyContent: 'center',
    },

    submitBtn: {
        backgroundColor: '#ff6300',
        padding: 15,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#000',
        marginTop: 20
    },
    submitBtnDisabled: {
        backgroundColor: '#aaa',
    },
    submitText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold'
    },
    switchBtn: { marginTop: 10 },
    switchText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 14
    },
    socialBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 3
    },
    google: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    facebook: { backgroundColor: '#4b18f2ff' },
    icon: {
        width: 15,
        height: 11,
        marginRight: 10
    },
    socialText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    imagePickerBtn: {
        backgroundColor: '#ff6300',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignSelf: 'center',
        marginTop: 10
    },
    roleButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#000',
        marginHorizontal: 5,
    }
});