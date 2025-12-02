import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

// import les providers et les hooks
import { AuthProvider, useAuth } from './Context/AuthContext';
import { SocketProvider } from './Context/SocketContext';
import AppNavigator from './navigation/appNavigator';

// Creation de component interne pour gerer navigation de l'app
function RootNavigator() {
  // je veux appeler le hook a l'interieur de mon component
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6300" />
      </View>
    );
  }

  //  AppNavigator  gére l'affichage de AuthScreen ou ClientHomeScreen
  //  en fonction de 'isAuthenticated'
  return <AppNavigator isAuthenticated={isAuthenticated} />;
}

export default function App() {
  return (
    // Authentification
    <AuthProvider>
      {/*  Socket */}
      <SocketProvider>

        <NavigationContainer>
          {/*  navigateur  */}
          <RootNavigator />
        </NavigationContainer>

        <StatusBar style="auto" />

        {/* 4. Le composant Toast pour les notifications */}
        <Toast />

      </SocketProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  }
});