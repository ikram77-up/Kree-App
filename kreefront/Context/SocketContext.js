import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
const SocketContext = createContext();

export const useSocket = () =>
    useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user && user._id) {
            const newSocket = io(process.env.EXPO_PUBLIC_SOCKET_URL, {

            });
            newSocket.on(`connect`, () => {
                console.log('Socket connected with ID:', newSocket.id);
                newSocket.emit('registerUser', user._id);
            });

            newSocket.on(`notification`, (notification) => {
                console.log('new notification received', notification);
                Toast.show({
                    type: 'info',
                    text1: notification.title,
                    text2: notification.message,
                    visibilityTime: 5000,
                    position: 'top'
                })
            });

            setSocket(newSocket);

            //nettoyage
            return () => {
                newSocket.disconnect();
            };
        } else {
            // if user is not logged in, disconnect socket
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user]); //userEffect depend de user

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
