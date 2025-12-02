import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useSocket } from '../Context/SocketContext'; 

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const useNotificationCount = () => {
    const { token, user } = useAuth();
    const { socket } = useSocket();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchCount = async () => {
        if (!token || !user) return;
        try {
            const response = await fetch(`${API_URL}/notifications/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (e) {
            console.error("Error fetching count:", e);
        }
    };

    // Écouter la connexion et les événements Socket
    useEffect(() => {
        fetchCount();
        if (socket) {
            socket.on('notification', (newNotif) => {
                if (newNotif.isRead === false) {
                    setUnreadCount(prev => prev + 1);
                }
            });

            // Quand l'utilisateur marque ses notifs comme lues, on doit pouvoir appeler fetchCount()
        }

        return () => {
            if (socket) socket.off('notification');
        };
    }, [token, socket]);

    return unreadCount;
};