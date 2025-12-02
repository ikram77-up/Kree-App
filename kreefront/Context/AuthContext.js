import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Au démarrage, on vérifie si un token existe
    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                if (storedToken) {
                    setToken(storedToken);

                    await fetchUserData(storedToken);
                } else {
                    setIsLoading(false);
                }
            } catch (e) {
                console.log(e);
                setIsLoading(false);
            }
        };
        loadToken();
    }, []);

    // Fonction pour récupérer les infos utilisateur avec un token
    const fetchUserData = async (currentToken) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setProfile(data.profile);
                setIsAuthenticated(true);
            } else {
                // Token invalide ou expiré
                await logout();
            }
        } catch (e) {
            console.log(e);
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction de LOGIN
    const login = async (email, password) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                await AsyncStorage.setItem('token', data.token);
                setToken(data.token);
                setUser(data.user);
                setProfile(data.profile);
                setIsAuthenticated(true);
                return data;
            } else {
                Alert.alert('Error connecxion', data.message || 'Email or password incorrect');
                return null;
            }
        } catch (err) {
            Alert.alert('Error', 'Impossible to connect to the server');
            return null;
        }
    };

    // Fonction de REGISTER

    const register = async (userData) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData), // Envoi data en JSON
            });
            const data = await response.json();

            if (response.ok) {
                Alert.alert('Succès', 'register success ! you can now connect.');
                return true;
            } else {
                Alert.alert('Error register', data.message || 'error survenu');
                return false;
            }
        } catch (err) {
            Alert.alert('Erreur', 'Impossible to connect to the server');
            return false;
        }
    };

    // Fonction de LOGIN/REGISTER via FIREBASE (Google, etc.)
    const firebaseLogin = async (firebaseUser) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/firebase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName,
                    role: 'client' // Par défaut, ou à demander
                }),
            });
            const data = await response.json();
            if (response.ok) {
                // Le backend doit renvoyer un token JWT comme un login normal
                if (data.token) {
                    await AsyncStorage.setItem('token', data.token);
                    setToken(data.token);
                    await fetchUserData(data.token); // Récupère le profil
                    return data;
                }
            } else {
                Alert.alert('error Firebase', data.message);
                return null;
            }
        } catch (e) {
            Alert.alert('Error', 'Connect to backend failed (firebase) échouée');
            return null;
        }
    };

    // Fonction de LOGOUT
    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setProfile(null);
            setIsAuthenticated(false);
            // pas besoin ici d'appler api /user/logout car le token est supprimé
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            token,
            isAuthenticated,
            isLoading,
            login,
            register,
            firebaseLogin,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personnalisé pour utiliser ce contexte
export const useAuth = () => {
    return useContext(AuthContext);
};