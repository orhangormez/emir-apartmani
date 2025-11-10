import React, { useState, useEffect, useRef } from 'react';
import type { View, Theme, Notification } from '../types';

interface HeaderProps {
    currentView: View;
    setSidebarOpen: (isOpen: boolean) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    notifications: Notification[];
    onMarkNotificationsAsRead: () => void;
    onToggleVoiceAssistant: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setSidebarOpen, theme, setTheme, notifications, onMarkNotificationsAsRead, onToggleVoiceAssistant }) => {
    const [isThemeMenuOpen, setThemeMenuOpen] = useState(false);
    const [isNotificationMenuOpen, setNotificationMenuOpen] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);
    const notificationMenuRef = useRef<HTMLDivElement>(null);

    const viewTitles: { [key in View]: string } = {
        dashboard: 'Genel Bakış',
        residents: 'Sakin Yönetimi',
        dues: 'Aidat Takibi',
        expenses: 'Masraf Yönetimi',
        settings: 'Ayarlar',
    };

    const unreadNotificationsCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = () => {
        setNotificationMenuOpen(prev => !prev);
    }
    
    const handleMarkAsReadClick = () => {
        onMarkNotificationsAsRead();
        // Keep the menu open to show it's empty
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setThemeMenuOpen(false);
            }
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
                setNotificationMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themeOptions = [
        { value: 'light', label: 'Açık', icon: 'fa-sun' },
        { value: 'dark', label: 'Koyu', icon: 'fa-moon' },
        { value: 'system', label: 'Sistem', icon: 'fa-desktop' }
    ];

    return (
        <header className="bg-glass-light dark:bg-glass-dark backdrop-blur-lg border-b border-border-light dark:border-border-dark p-4 flex justify-between items-center sticky top-0 z-10 h-20">
            <button
                className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => setSidebarOpen(true)}
            >
                <i className="fas fa-bars text-2xl"></i>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{viewTitles[currentView]}</h2>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <button onClick={onToggleVoiceAssistant} className="p-2 w-10 h-10 bg-white/20 dark:bg-black/20 rounded-full hover:bg-white/30 dark:hover:bg-black/30">
                     <i className="fas fa-microphone-alt text-gray-700 dark:text-gray-300"></i>
                </button>
                <div className="relative" ref={notificationMenuRef}>
                    <button onClick={handleNotificationClick} className="p-2 w-10 h-10 bg-white/20 dark:bg-black/20 rounded-full hover:bg-white/30 dark:hover:bg-black/30 relative">
                        <i className="fas fa-bell text-gray-700 dark:text-gray-300"></i>
                        {unreadNotificationsCount > 0 && (
                            <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                {unreadNotificationsCount}
                            </span>
                        )}
                    </button>
                     {isNotificationMenuOpen && (
                        <div className="fixed top-20 right-4 left-4 sm:absolute sm:left-auto sm:top-full sm:right-0 sm:w-80 mt-2 bg-glass-light dark:bg-glass-dark backdrop-blur-xl rounded-lg shadow-xl border border-border-light dark:border-border-dark overflow-hidden z-20">
                           <div className="p-3 flex justify-between items-center border-b border-border-light dark:border-border-dark">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Bildirimler</h4>
                                {unreadNotificationsCount > 0 && <button onClick={handleMarkAsReadClick} className="text-sm text-primary hover:underline">Tümünü okundu işaretle</button>}
                           </div>
                            <div className="max-h-96 overflow-y-auto">
                               {notifications.length > 0 ? notifications.map(n => (
                                   <div key={n.id} className={`p-3 border-b border-border-light/50 dark:border-border-dark/50 ${!n.read ? 'bg-sky-500/10' : ''}`}>
                                       <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                                   </div>
                               )) : (
                                    <p className="text-center p-4 text-gray-600 dark:text-gray-400">Yeni bildirim yok.</p>
                               )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={themeMenuRef}>
                    <button onClick={() => setThemeMenuOpen(!isThemeMenuOpen)} className="p-2 w-10 h-10 bg-white/20 dark:bg-black/20 rounded-full hover:bg-white/30 dark:hover:bg-black/30">
                        <i className="fas fa-palette text-gray-700 dark:text-gray-300"></i>
                    </button>
                    {isThemeMenuOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-glass-light dark:bg-glass-dark backdrop-blur-xl rounded-md shadow-lg border border-border-light dark:border-border-dark z-20">
                            {themeOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => { setTheme(option.value as Theme); setThemeMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${theme === option.value ? 'bg-accent/80 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'}`}
                                >
                                    <i className={`fas ${option.icon} w-5 mr-2`}></i>
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="hidden sm:block">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Yönetici</span>
                </div>
            </div>
        </header>
    );
};

export default Header;