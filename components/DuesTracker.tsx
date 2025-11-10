import React, { useState, useMemo, useEffect } from 'react';
import type { Aidat, Sakin } from '../types';
import Modal from './common/Modal';
import { formatCurrency } from '../utils/formatters';

interface DuesTrackerProps {
    aidatlar: Aidat[];
    sakinler: Sakin[];
    onAddAidat: (aidat: Omit<Aidat, 'id'>) => void;
    onToggleOdeme: (aidatId: string, sakinId: string, odendi: boolean) => void;
    defaultDueAmount: number;
}

const DuesTracker: React.FC<DuesTrackerProps> = ({ aidatlar, sakinler, onAddAidat, onToggleOdeme, defaultDueAmount }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tutar, setTutar] = useState(defaultDueAmount);
    const [donem, setDonem] = useState('');
    const [sonOdemeTarihi, setSonOdemeTarihi] = useState('');

    const sortedAidatlar = useMemo(() => {
        function getMonthIndex(monthName: string) {
            const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
            return months.indexOf(monthName);
        }
        return [...aidatlar].sort((a, b) => {
            const dateB = new Date(parseInt(b.donem.split(' ')[1], 10), getMonthIndex(b.donem.split(' ')[0]));
            const dateA = new Date(parseInt(a.donem.split(' ')[1], 10), getMonthIndex(a.donem.split(' ')[0]));
            return dateB.getTime() - dateA.getTime();
        });
    }, [aidatlar]);

    const [selectedAidatId, setSelectedAidatId] = useState<string | null>(null);
    
    useEffect(() => {
        if (!selectedAidatId && sortedAidatlar.length > 0) {
            setSelectedAidatId(sortedAidatlar[0].id);
        }
    }, [sortedAidatlar, selectedAidatId]);


    const selectedAidat = useMemo(() => {
        return aidatlar.find(a => a.id === selectedAidatId);
    }, [aidatlar, selectedAidatId]);

    const openAddModal = () => {
        setDonem('');
        setTutar(defaultDueAmount);
        setSonOdemeTarihi(new Date().toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const handleAddAidat = (e: React.FormEvent) => {
        e.preventDefault();
        const yeniAidat: Omit<Aidat, 'id'> = {
            donem,
            tutar,
            sonOdemeTarihi,
            sakinler: sakinler.map(s => ({ sakinId: s.id, odendi: false })),
        };
        onAddAidat(yeniAidat);
        setIsModalOpen(false);
    };

    return (
        <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-lg border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-lg">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Aidat Takibi</h3>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedAidatId ?? ''}
                        onChange={(e) => setSelectedAidatId(e.target.value)}
                        className="block w-48 px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"
                    >
                        {sortedAidatlar.map(a => (
                            <option key={a.id} value={a.id}>{a.donem}</option>
                        ))}
                    </select>
                    <button onClick={openAddModal} className="px-4 py-2 bg-accent/80 text-white rounded-md hover:bg-accent backdrop-blur-sm border border-white/20">
                        <i className="fas fa-plus mr-2"></i>Yeni Aidat Dönemi
                    </button>
                </div>
            </div>

            {selectedAidat ? (
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="border-b border-white/20">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Daire No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ad Soyad</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tutar</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ödeme Durumu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sakinler.sort((a,b) => a.daireNo - b.daireNo).map(sakin => {
                                const odeme = selectedAidat.sakinler.find(o => o.sakinId === sakin.id);
                                return (
                                    <tr key={sakin.id} className="border-b border-white/10 dark:border-black/10">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{sakin.daireNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{sakin.adSoyad}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 text-right">{formatCurrency(selectedAidat.tutar)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <button 
                                                onClick={() => onToggleOdeme(selectedAidat.id, sakin.id, !odeme?.odendi)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                                                    odeme?.odendi 
                                                    ? 'bg-green-500/20 text-green-800 dark:text-green-200 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-800 dark:text-red-200 border border-red-500/30'
                                                }`}
                                            >
                                                {odeme?.odendi ? 'Ödendi' : 'Ödenmedi'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-700 dark:text-gray-300 mt-8">Görüntülenecek aidat dönemi yok. Lütfen yeni bir dönem ekleyin.</p>
            )}

            <Modal title="Yeni Aidat Dönemi Ekle" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleAddAidat} className="space-y-4">
                    <div>
                        <label htmlFor="donem" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dönem (Örn: Ağustos 2024)</label>
                        <input type="text" id="donem" value={donem} onChange={(e) => setDonem(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                    <div>
                        <label htmlFor="tutar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aylık Tutar (₺)</label>
                        <input type="number" id="tutar" value={tutar} onChange={(e) => setTutar(parseFloat(e.target.value) || 0)} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                     <div>
                        <label htmlFor="sonOdemeTarihi" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Son Ödeme Tarihi</label>
                        <input type="date" id="sonOdemeTarihi" value={sonOdemeTarihi} onChange={(e) => setSonOdemeTarihi(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200/50 text-gray-800 rounded-md hover:bg-gray-300/50 border border-white/20">İptal</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary border border-white/20">Oluştur</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DuesTracker;