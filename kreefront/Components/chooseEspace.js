import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

export default function ChooseEspace({ navigation }) {
    return (
        <LinearGradient
            colors={["#ff7b00", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
        >
            <View style={styles.container}>
                <Text style={styles.title}>Choose your</Text>
                <Text style={styles.title}>space</Text>

                {/* CUSTOMER BUTTON */}
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('ClientHomeScreen')}
                >
                    <View style={styles.buttonContent}>
                        <Image
                            source={require('../assets/client.png')}
                            style={styles.icon}
                        />
                        <Text style={styles.buttonText} numberOfLines={1} ellipsizeMode="tail">
                            Customer space
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* AGENCY BUTTON */}
                <TouchableOpacity
                    style={styles.button}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('AgenceHomeScreen')}
                >
                    <View style={styles.buttonContent}>
                        <Image
                            source={require('../assets/agence.png')}
                            style={styles.icon}
                        />
                        <Text style={styles.buttonText} numberOfLines={1} ellipsizeMode="tail">
                            Agency space
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    button: {
        backgroundColor: '#ff6300',
        borderColor: '#000',
        borderWidth: 2,
        borderRadius: 35,
        marginVertical: 12,
        width: '80%',
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'nowrap',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
        textAlign: 'center',
        flexShrink: 1,
    },
    icon: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
    },
});
