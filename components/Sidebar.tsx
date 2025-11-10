import React from 'react';
import type { View } from '../types';
import { HomeIcon, UsersIcon, MoneyIcon, ReceiptIcon, SettingsIcon } from './icons/Icons';

interface SidebarProps {
    currentView: View;
    setView: (view: View) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    apartmentName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen, apartmentName }) => {
    const navItems = [
        { id: 'dashboard', label: 'Genel Bakış', icon: <HomeIcon /> },
        { id: 'residents', label: 'Sakinler', icon: <UsersIcon /> },
        { id: 'dues', label: 'Aidatlar', icon: <MoneyIcon /> },
        { id: 'expenses', label: 'Masraflar', icon: <ReceiptIcon /> },
        { id: 'settings', label: 'Ayarlar', icon: <SettingsIcon /> },
    ];

    const handleNavigation = (view: View) => {
        setView(view);
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    }

    return (
        <>
            {/* Overlay for mobile */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            <aside className={`w-64 text-white flex-shrink-0 flex-col fixed md:relative inset-y-0 left-0 z-20 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex bg-glass-light/10 dark:bg-glass-dark/20 backdrop-blur-xl border-r border-border-light dark:border-border-dark`}>
                <div className="h-20 flex items-center justify-center flex-shrink-0 p-4">
                    <h1 className="text-xl font-bold text-white text-center px-2">{apartmentName} Yönetimi</h1>
                </div>
                <nav className="mt-8 flex-1 overflow-y-auto">
                    <ul>
                        {navItems.map(item => (
                            <li key={item.id} className="px-4 mb-2">
                                <button
                                    onClick={() => handleNavigation(item.id as View)}
                                    className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
                                        currentView === item.id
                                            ? 'bg-white/20 text-white'
                                            : 'text-gray-200 hover:bg-white/10'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="ml-4 text-lg font-medium">{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-4 border-t border-white/10">
                    <p className="text-center text-xs text-gray-300">
                        Yönetim Paneli v1.0
                    </p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;