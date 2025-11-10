
export type View = 'dashboard' | 'residents' | 'dues' | 'expenses' | 'settings';
export type Theme = 'light' | 'dark' | 'system';

export interface Sakin {
    id: string;
    adSoyad: string;
    daireNo: number;
    telefon: string;
    girisTarihi: string; // YYYY-MM-DD
}

export interface AidatOdeme {
    sakinId: string;
    odendi: boolean;
}

export interface Aidat {
    id: string;
    donem: string; // "Ay Yıl", e.g., "Ocak 2024"
    tutar: number;
    sonOdemeTarihi: string; // YYYY-MM-DD
    sakinler: AidatOdeme[];
}

export interface Masraf {
    id: string;
    aciklama: string;
    tutar: number;
    tarih: string; // YYYY-MM-DD
    kategori: string;
}

export interface Notification {
    id: number;
    message: string;
    read: boolean;
}

export interface AppSettings {
    apartmentName: string;
    defaultDueAmount: number;
}
