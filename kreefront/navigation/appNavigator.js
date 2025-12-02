import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../Context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import Home from "../Components/home.js";
import AuthScreen from "../Components/AuthScreen.js";
import ClientHomeScreen from "../Components/ClientHomeScreen.js";
import AgenceHomeScreen from "../Components/AgenceHomeScreen.js";
import AgenceInterface from "../Components/agenceInterface.js";
import ChooseEspace from "../Components/chooseEspace.js";
import ClientOffersScreen from "../Components/ClientOffersScreen.js";
import ProfileScreen from "../Components/ProfileScreen.js";
import MyCarsScreen from "../Components/MyCarsScreen.js";
import CarDetailsScreen from "../Components/CarDetailsScreen.js";
import ClientRequestsScreen from "../Components/ClientRequestsScreen.js";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    // isLoading pour l'écran de chargement
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6300" />
            </View>
        );
    }

    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
            {/* Tous les écrans sont maintenant disponibles */}
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="AuthScreen" component={AuthScreen} />
            <Stack.Screen name="chooseEspace" component={ChooseEspace} />
            <Stack.Screen name="ClientHomeScreen" component={ClientHomeScreen} />
            <Stack.Screen name="AgenceHomeScreen" component={AgenceHomeScreen} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="ClientOffersScreen" component={ClientOffersScreen} />
            <Stack.Screen name="agenceInterface" component={AgenceInterface} />
            <Stack.Screen name="MyCarsScreen" component={MyCarsScreen} />
            <Stack.Screen name="CarDetailsScreen" component={CarDetailsScreen} />
            <Stack.Screen name="ClientRequestsScreen" component={ClientRequestsScreen} />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
    }
});