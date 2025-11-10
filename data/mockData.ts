import type { Sakin, Aidat, Masraf } from '../types';

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export const initialSakinler: Sakin[] = [
    { id: 'sakin-1', adSoyad: 'Ahmet Yılmaz', daireNo: 1, telefon: '0555 123 4567', girisTarihi: '2022-01-15' },
    { id: 'sakin-2', adSoyad: 'Ayşe Kaya', daireNo: 2, telefon: '0555 234 5678', girisTarihi: '2021-03-20' },
    { id: 'sakin-3', adSoyad: 'Mehmet Demir', daireNo: 3, telefon: '0555 345 6789', girisTarihi: '2023-07-01' },
    { id: 'sakin-4', adSoyad: 'Fatma Çelik', daireNo: 4, telefon: '0555 456 7890', girisTarihi: '2020-11-10' },
    { id: 'sakin-5', adSoyad: 'Ali Vural', daireNo: 5, telefon: '0555 567 8901', girisTarihi: '2023-09-05' },
];

export const initialAidatlar: Aidat[] = Array.from({ length: 3 }).map((_, i) => {
    const d = new Date(currentYear, currentMonth - i, 1);
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    const lastDay = new Date(year, d.getMonth() + 1, 0).getDate();
    
    return {
        id: `aidat-${i + 1}`,
        donem: `${monthName} ${year}`,
        tutar: 550 + i * 25,
        sonOdemeTarihi: `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${lastDay}`,
        sakinler: initialSakinler.map(sakin => ({
            sakinId: sakin.id,
            odendi: Math.random() > 0.3, // Randomly set payment status
        })),
    };
}).reverse();


export const initialMasraflar: Masraf[] = [
    { id: 'masraf-1', aciklama: 'Elektrik Faturası', tutar: 450.75, tarih: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`, kategori: 'Fatura' },
    { id: 'masraf-2', aciklama: 'Asansör Aylık Bakım', tutar: 300.00, tarih: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`, kategori: 'Bakım' },
    { id: 'masraf-3', aciklama: 'Temizlik Personeli Maaş', tutar: 1200.00, tarih: `${currentYear}-${String(currentMonth).padStart(2, '0')}-28`, kategori: 'Personel' },
    { id: 'masraf-4', aciklama: 'Bahçe Peyzaj Düzenlemesi', tutar: 600.50, tarih: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`, kategori: 'Bakım' },
];
