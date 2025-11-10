import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ResidentsList from './components/ResidentsList';
import DuesTracker from './components/DuesTracker';
import ExpensesManager from './components/ExpensesManager';
import Settings from './components/Settings';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import { initialSakinler, initialAidatlar, initialMasraflar } from './data/mockData';
import type { View, Theme, Sakin, Aidat, Masraf, Notification, AppSettings } from './types';

const App: React.FC = () => {
    // State management
    const [sakinler, setSakinler] = useState<Sakin[]>(() => JSON.parse(localStorage.getItem('sakinler') || 'null') || initialSakinler);
    const [aidatlar, setAidatlar] = useState<Aidat[]>(() => JSON.parse(localStorage.getItem('aidatlar') || 'null') || initialAidatlar);
    const [masraflar, setMasraflar] = useState<Masraf[]>(() => JSON.parse(localStorage.getItem('masraflar') || 'null') || initialMasraflar);
    const [settings, setSettings] = useState<AppSettings>(() => JSON.parse(localStorage.getItem('settings') || 'null') || { apartmentName: 'Emir Apartmanı', defaultDueAmount: 550 });
    
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isVoiceAssistantOpen, setVoiceAssistantOpen] = useState(false);

    // Persist data to localStorage
    useEffect(() => { localStorage.setItem('sakinler', JSON.stringify(sakinler)); }, [sakinler]);
    useEffect(() => { localStorage.setItem('aidatlar', JSON.stringify(aidatlar)); }, [aidatlar]);
    useEffect(() => { localStorage.setItem('masraflar', JSON.stringify(masraflar)); }, [masraflar]);
    useEffect(() => { localStorage.setItem('settings', JSON.stringify(settings)); }, [settings]);
    useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);

    // Apply theme
    useEffect(() => {
        const root = window.document.documentElement;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);
    
    const addNotification = useCallback((message: string) => {
        const newNotification: Notification = { id: Date.now(), message, read: false };
        setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20 notifications
    }, []);
    
    // Check for unpaid dues on app load
    useEffect(() => {
        const today = new Date();
        const overdueNotifications = new Set<string>();
    
        aidatlar.forEach(aidat => {
            if (new Date(aidat.sonOdemeTarihi) < today) {
                aidat.sakinler.forEach(s => {
                    if (!s.odendi) {
                        const sakin = sakinler.find(sk => sk.id === s.sakinId);
                        if (sakin) {
                            const notificationKey = `${sakin.id}-${aidat.donem}`;
                            if (!notifications.some(n => n.message.includes(sakin.adSoyad) && n.message.includes(aidat.donem))) {
                                overdueNotifications.add(`${sakin.adSoyad} isimli sakinin ${aidat.donem} dönemi aidat ödemesi gecikmiştir.`);
                            }
                        }
                    }
                });
            }
        });
    
        if (overdueNotifications.size > 0) {
           overdueNotifications.forEach(msg => addNotification(msg));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // CRUD Handlers
    const handleAddSakin = (sakin: Omit<Sakin, 'id'>) => {
        const newSakin = { ...sakin, id: crypto.randomUUID() };
        setSakinler(prev => [...prev, newSakin]);
        // Also add the new resident to existing aidat periods with 'unpaid' status
        setAidatlar(prevAidatlar => prevAidatlar.map(aidat => ({
            ...aidat,
            sakinler: [...aidat.sakinler, { sakinId: newSakin.id, odendi: false }]
        })));
        addNotification(`${sakin.adSoyad} yeni sakin olarak eklendi.`);
    };
    const handleUpdateSakin = (updatedSakin: Sakin) => {
        setSakinler(prev => prev.map(s => s.id === updatedSakin.id ? updatedSakin : s));
        addNotification(`${updatedSakin.adSoyad} bilgileri güncellendi.`);
    };
    const handleDeleteSakin = (id: string) => {
        const sakinAdi = sakinler.find(s=>s.id === id)?.adSoyad || 'Bilinmeyen sakin';
        setSakinler(prev => prev.filter(s => s.id !== id));
        // Also remove from aidat payments
        setAidatlar(prevAidatlar => prevAidatlar.map(aidat => ({
            ...aidat,
            sakinler: aidat.sakinler.filter(s => s.sakinId !== id)
        })));
        addNotification(`${sakinAdi} sistemden silindi.`);
    };

    const handleAddAidat = (aidat: Omit<Aidat, 'id'>) => {
        const newAidat = { ...aidat, id: crypto.randomUUID() };
        setAidatlar(prev => [...prev, newAidat]);
        addNotification(`${aidat.donem} için yeni aidat dönemi oluşturuldu.`);
    };
    const handleToggleOdeme = (aidatId: string, sakinId: string, odendi: boolean) => {
        setAidatlar(prev => prev.map(aidat => {
            if (aidat.id === aidatId) {
                return {
                    ...aidat,
                    sakinler: aidat.sakinler.map(s => s.sakinId === sakinId ? { ...s, odendi } : s)
                };
            }
            return aidat;
        }));
    };

    const handleAddMasraf = (masraf: Omit<Masraf, 'id'>) => {
        const newMasraf = { ...masraf, id: crypto.randomUUID() };
        setMasraflar(prev => [...prev, newMasraf]);
        addNotification(`${masraf.aciklama} masrafı eklendi.`);
    };
    const handleUpdateMasraf = (updatedMasraf: Masraf) => {
        setMasraflar(prev => prev.map(m => m.id === updatedMasraf.id ? updatedMasraf : m));
        addNotification(`${updatedMasraf.aciklama} masrafı güncellendi.`);
    };
    const handleDeleteMasraf = (id: string) => {
        const masrafAciklama = masraflar.find(m => m.id === id)?.aciklama || 'Bilinmeyen masraf';
        setMasraflar(prev => prev.filter(m => m.id !== id));
        addNotification(`${masrafAciklama} masrafı silindi.`);
    };
    
    const handleUpdateSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        addNotification('Uygulama ayarları güncellendi.');
    }
    
    const handleBulkUpdate = (data: { sakinler: Sakin[], aidatlar: Aidat[], masraflar: Masraf[] }) => {
        setSakinler(data.sakinler);
        setAidatlar(data.aidatlar);
        setMasraflar(data.masraflar);
        addNotification("Tüm veriler başarıyla içe aktarıldı.");
    }
    
    const handleMarkNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
    
    const handleUpdateDuesByApartmentNumber = (daireNo: number, odendi: boolean): string => {
        const sakin = sakinler.find(s => s.daireNo === daireNo);
        if (!sakin) {
            return `Hata: ${daireNo} numaralı daire bulunamadı.`;
        }
        
        // Find the latest aidat period to update
        if (aidatlar.length === 0) {
            return "Hata: Henüz aidat dönemi oluşturulmamış.";
        }
        
        // Helper to sort by month name
        function getMonthIndex(monthName: string) {
            const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            return months.indexOf(monthName);
        }

        const latestAidat = [...aidatlar].sort((a, b) => {
            const dateB = new Date(parseInt(b.donem.split(' ')[1], 10), getMonthIndex(b.donem.split(' ')[0]));
            const dateA = new Date(parseInt(a.donem.split(' ')[1], 10), getMonthIndex(a.donem.split(' ')[0]));
            return dateB.getTime() - dateA.getTime();
        })[0];
        
        handleToggleOdeme(latestAidat.id, sakin.id, odendi);
        const durum = odendi ? 'ödendi' : 'ödenmedi';
        addNotification(`${sakin.adSoyad} (Daire ${daireNo}) - ${latestAidat.donem} aidatı ${durum} olarak işaretlendi.`);
        return `Tamamdır, ${daireNo} numaralı dairenin ${latestAidat.donem} dönemi aidatı ${durum} olarak işaretlendi.`;
    };
    
    const handleAddExpenseByVoice = (aciklama: string, tutar: number, kategori: string): string => {
        const yeniMasraf: Omit<Masraf, 'id'> = {
            aciklama,
            tutar,
            kategori,
            tarih: new Date().toISOString().split('T')[0],
        };
        handleAddMasraf(yeniMasraf);
        return `Anlaşıldı, ${tutar} TL tutarında ${aciklama} masrafı ${kategori} kategorisine eklendi.`;
    };


    const MainContent = useMemo(() => {
        switch (currentView) {
            case 'dashboard': return <Dashboard sakinler={sakinler} aidatlar={aidatlar} masraflar={masraflar} />;
            case 'residents': return <ResidentsList sakinler={sakinler} aidatlar={aidatlar} onAddSakin={handleAddSakin} onUpdateSakin={handleUpdateSakin} onDeleteSakin={handleDeleteSakin} />;
            case 'dues': return <DuesTracker aidatlar={aidatlar} sakinler={sakinler} onAddAidat={handleAddAidat} onToggleOdeme={handleToggleOdeme} defaultDueAmount={settings.defaultDueAmount} />;
            case 'expenses': return <ExpensesManager masraflar={masraflar} onAddMasraf={handleAddMasraf} onUpdateMasraf={handleUpdateMasraf} onDeleteMasraf={handleDeleteMasraf} />;
            case 'settings': return <Settings theme={theme} setTheme={setTheme} settings={settings} onUpdateSettings={handleUpdateSettings} sakinler={sakinler} aidatlar={aidatlar} masraflar={masraflar} onBulkUpdate={handleBulkUpdate} addNotification={addNotification} />;
            default: return <div>Bilinmeyen sayfa</div>;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentView, sakinler, aidatlar, masraflar, settings, theme]);


    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans transition-colors duration-300">
            <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} apartmentName={settings.apartmentName} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    currentView={currentView} 
                    setSidebarOpen={setSidebarOpen} 
                    theme={theme}
                    setTheme={setTheme}
                    notifications={notifications}
                    onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                    onToggleVoiceAssistant={() => setVoiceAssistantOpen(true)}
                />
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    {MainContent}
                </main>
            </div>
             <VoiceAssistantModal 
                isOpen={isVoiceAssistantOpen}
                onClose={() => setVoiceAssistantOpen(false)}
                addNotification={addNotification}
                onUpdateDues={handleUpdateDuesByApartmentNumber}
                onAddExpense={handleAddExpenseByVoice}
             />
        </div>
    );
}

export default App;