import React, { useMemo } from 'react';
import type { Aidat, Masraf, Sakin } from '../types';
import StatCard from './common/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/formatters';

interface DashboardProps {
    aidatlar: Aidat[];
    masraflar: Masraf[];
    sakinler: Sakin[];
}

const Dashboard: React.FC<DashboardProps> = ({ aidatlar, masraflar, sakinler }) => {
    const { totalIncome, totalExpense, balance, unpaidDuesCount, totalDuesAmount } = useMemo(() => {
        let totalIncome = 0;
        let unpaidDuesCount = 0;
        let totalDuesAmount = 0;

        aidatlar.forEach(aidat => {
            aidat.sakinler.forEach(s => {
                if (s.odendi) {
                    totalIncome += aidat.tutar;
                } else {
                    unpaidDuesCount++;
                }
                totalDuesAmount += aidat.tutar;
            });
        });

        const totalExpense = masraflar.reduce((acc, masraf) => acc + masraf.tutar, 0);
        const balance = totalIncome - totalExpense;

        return { totalIncome, totalExpense, balance, unpaidDuesCount, totalDuesAmount };
    }, [aidatlar, masraflar]);

    const borcluSakinler = useMemo(() => {
        if (!aidatlar || aidatlar.length === 0) return [];
        
        // Create a copy before sorting to prevent state mutation
        const sortedAidatlar = [...aidatlar].sort((a, b) => {
            const dateB = new Date(parseInt(b.donem.split(' ')[1], 10), getMonthIndex(b.donem.split(' ')[0]));
            const dateA = new Date(parseInt(a.donem.split(' ')[1], 10), getMonthIndex(a.donem.split(' ')[0]));
            return dateB.getTime() - dateA.getTime();
        });
        
        const latestAidat = sortedAidatlar[0];
        
        if (!latestAidat) return [];

        return latestAidat.sakinler
            .filter(s => !s.odendi)
            .map(s => sakinler.find(sakin => sakin.id === s.sakinId))
            .filter((s): s is Sakin => s !== undefined);
    }, [aidatlar, sakinler]);

    function getMonthIndex(monthName: string) {
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return months.indexOf(monthName);
    }

    const chartData = useMemo(() => {
        const dataByMonth: { [key: string]: { name: string, gelir: number, gider: number } } = {};

        aidatlar.forEach(aidat => {
            const month = aidat.donem;
            if (!dataByMonth[month]) {
                dataByMonth[month] = { name: month.split(' ')[0], gelir: 0, gider: 0 };
            }
            dataByMonth[month].gelir += aidat.sakinler.filter(s => s.odendi).length * aidat.tutar;
        });

        masraflar.forEach(masraf => {
            const date = new Date(masraf.tarih);
            const monthYear = date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
             if (!dataByMonth[monthYear]) {
                dataByMonth[monthYear] = { name: monthYear.split(' ')[0], gelir: 0, gider: 0 };
            }
            dataByMonth[monthYear].gider += masraf.tutar;
        });

        return Object.values(dataByMonth).reverse();
    }, [aidatlar, masraflar]);
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon="fas fa-hand-holding-dollar" title="Kasadaki Toplam Para" value={balance} format="currency" color="bg-blue-500" />
                <StatCard icon="fas fa-arrow-up" title="Toplam Gelir (Aidat)" value={totalIncome} format="currency" color="bg-green-500" />
                <StatCard icon="fas fa-arrow-down" title="Toplam Gider (Masraf)" value={totalExpense} format="currency" color="bg-red-500" />
                <StatCard icon="fas fa-file-invoice-dollar" title="Ödenmemiş Aidat Sayısı" value={unpaidDuesCount} color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-glass-light dark:bg-glass-dark backdrop-blur-lg border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Aylık Gelir/Gider Durumu</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                            <XAxis dataKey="name" tick={{ fill: 'currentColor' }} className="text-gray-700 dark:text-gray-300" />
                            <YAxis tickFormatter={(value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value as number)} tick={{ fill: 'currentColor' }} className="text-gray-700 dark:text-gray-300" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    backdropFilter: 'blur(10px)',
                                }}
                                itemStyle={{ color: '#e5e7eb' }}
                                labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }}
                                formatter={(value) => formatCurrency(value as number)} />
                            <Legend wrapperStyle={{ color: 'currentColor' }} />
                            <Bar dataKey="gelir" fill="#4ade80" name="Gelir" />
                            <Bar dataKey="gider" fill="#f87171" name="Gider" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-lg border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-lg">
                     <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Güncel Borçlular ({aidatlar.length > 0 ? [...aidatlar].sort((a,b) => new Date(parseInt(b.donem.split(' ')[1], 10), getMonthIndex(b.donem.split(' ')[0])).getTime() - new Date(parseInt(a.donem.split(' ')[1], 10), getMonthIndex(a.donem.split(' ')[0])).getTime())[0].donem : ''})</h3>
                    <div className="space-y-4 overflow-y-auto h-[300px] pr-2">
                        {borcluSakinler.length > 0 ? borcluSakinler.map(sakin => (
                            <div key={sakin.id} className="flex items-center justify-between p-3 bg-white/20 dark:bg-black/20 rounded-md">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">Daire {sakin.daireNo}: {sakin.adSoyad}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-400">{sakin.telefon}</p>
                                </div>
                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                    {formatCurrency(aidatlar[0].tutar)}
                                </span>
                            </div>
                        )) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-600 dark:text-gray-400">Bu ay borçlu sakin bulunmamaktadır.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;