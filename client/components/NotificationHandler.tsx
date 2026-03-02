import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationHandler = () => {
    const { user } = useAuth();
    useNotifications(user);

    return null;
};
