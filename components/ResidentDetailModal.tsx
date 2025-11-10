import React, { useMemo } from 'react';
import type { Sakin, Aidat } from '../types';
import Modal from './common/Modal';
import { formatCurrency } from '../utils/formatters';

interface ResidentDetailModalProps {
    sakin: Sakin;
    aidatlar: Aidat[];
    onClose: () => void;
}

const ResidentDetailModal: React.FC<ResidentDetailModalProps> = ({ sakin, aidatlar, onClose }) => {
    
    const { history, totalPaid, totalDebt, balance } = useMemo(() => {
        const history = aidatlar.map(aidat => {
            const odemeDurumu = aidat.sakinler.find(s => s.sakinId === sakin.id);
            return {
                donem: aidat.donem,
                tutar: aidat.tutar,
                odendi: odemeDurumu ? odemeDurumu.odendi : false,
            };
        // Fix: Use .getTime() to convert Date objects to numbers for comparison, resolving the TypeScript error.
        // Also, explicitly parse the year from a string to a number for robust date creation.
        }).sort((a,b) => {
            const dateB = new Date(parseInt(b.donem.split(' ')[1], 10), getMonthIndex(b.donem.split(' ')[0]));
            const dateA = new Date(parseInt(a.donem.split(' ')[1], 10), getMonthIndex(a.donem.split(' ')[0]));
            return dateB.getTime() - dateA.getTime();
        });

        const totalPaid = history.filter(h => h.odendi).reduce((acc, h) => acc + h.tutar, 0);
        const totalDebt = history.filter(h => !h.odendi).reduce((acc, h) => acc + h.tutar, 0);
        const balance = totalPaid - (totalPaid + totalDebt);

        return { history, totalPaid, totalDebt, balance };
    }, [sakin, aidatlar]);

    // Helper to sort by month name
    function getMonthIndex(monthName: string) {
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return months.indexOf(monthName);
    }

    return (
        <Modal title={`Daire ${sakin.daireNo} - ${sakin.adSoyad} Detay`} isOpen={true} onClose={onClose}>
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Aidat Geçmişi</h4>
                    <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dönem</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tutar</th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {history.map(h => (
                                        <tr key={h.donem}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{h.donem}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 text-right">{formatCurrency(h.tutar)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                {h.odendi ? (
                                                    <span className="px-2 py-1 font-medium text-green-800 bg-green-100 rounded-full text-xs dark:bg-green-900/50 dark:text-green-300">Ödendi</span>
                                                ) : (
                                                    <span className="px-2 py-1 font-medium text-red-800 bg-red-100 rounded-full text-xs dark:bg-red-900/50 dark:text-red-300">Ödenmedi</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Finansal Özet</h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Toplam Ödenen Tutar:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Toplam Borç Tutarı:</span>
                            <span className="font-semibold text-red-600">{formatCurrency(totalDebt)}</span>
                        </div>
                        <div className="flex justify-between items-center text-md pt-2 border-t mt-2 dark:border-gray-600">
                            <span className="font-bold text-gray-800 dark:text-gray-100">Güncel Bakiye:</span>
                            <span className={`font-bold ${balance === 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-600'}`}>{formatCurrency(balance)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary">Kapat</button>
                </div>
            </div>
        </Modal>
    );
};

export default ResidentDetailModal;