import React, { useState, useEffect, useRef } from 'react';
import type { Theme, AppSettings, Sakin, Aidat, Masraf } from '../types';
import ConfirmationModal from './common/ConfirmationModal';

// TypeScript declarations for global libraries
declare const XLSX: any;
declare const docx: any;
declare const saveAs: any;
declare global {
    interface Window {
        jspdf: any;
    }
}

interface SettingsProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    sakinler: Sakin[];
    aidatlar: Aidat[];
    masraflar: Masraf[];
    onBulkUpdate: (data: { sakinler: Sakin[], aidatlar: Aidat[], masraflar: Masraf[] }) => void;
    addNotification: (message: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, settings, onUpdateSettings, sakinler, aidatlar, masraflar, onBulkUpdate, addNotification }) => {
    const [formData, setFormData] = useState<AppSettings>(settings);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [importedData, setImportedData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'defaultDueAmount' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings(formData);
    };
    
    const handleExport = (format: 'excel' | 'pdf' | 'word') => {
        setIsExportMenuOpen(false);
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `${settings.apartmentName.replace(' ', '_')}_Veri_${timestamp}`;

        // Prepare flattened data
        const sakinlerData = sakinler.map(({ id, ...rest }) => rest);
        const masraflarData = masraflar.map(({ id, ...rest }) => ({...rest, tarih: new Date(rest.tarih).toLocaleDateString('tr-TR')}));
        const aidatlarData = aidatlar.flatMap(aidat => 
            aidat.sakinler.map(odeme => {
                const sakin = sakinler.find(s => s.id === odeme.sakinId);
                return {
                    'Dönem': aidat.donem,
                    'Aidat Tutarı': aidat.tutar,
                    'Son Ödeme Tarihi': new Date(aidat.sonOdemeTarihi).toLocaleDateString('tr-TR'),
                    'Daire No': sakin?.daireNo || 'N/A',
                    'Ad Soyad': sakin?.adSoyad || 'Bilinmeyen Sakin',
                    'Ödeme Durumu': odeme.odendi ? 'Ödendi' : 'Ödenmedi'
                }
            })
        );
        
        if (format === 'excel') {
            const wb = XLSX.utils.book_new();
            wb.Props = { Title: "Apartman Yönetim Verileri", Author: "Emir Apartmanı Yönetim Uygulaması", CreatedDate: new Date() };
            
            wb.SheetNames.push("Sakinler");
            const sakinlerWS = XLSX.utils.json_to_sheet(sakinlerData);
            wb.Sheets["Sakinler"] = sakinlerWS;

            wb.SheetNames.push("Masraflar");
            const masraflarWS = XLSX.utils.json_to_sheet(masraflarData);
            wb.Sheets["Masraflar"] = masraflarWS;

            wb.SheetNames.push("Aidatlar");
            const aidatlarWS = XLSX.utils.json_to_sheet(aidatlarData);
            wb.Sheets["Aidatlar"] = aidatlarWS;
            
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } else if (format === 'pdf') {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text("Sakin Listesi", 14, 15);
            (doc as any).autoTable({
                startY: 20,
                head: [['Daire No', 'Ad Soyad', 'Telefon', 'Giriş Tarihi']],
                body: sakinlerData.map(Object.values)
            });
            doc.addPage();
            doc.text("Masraf Listesi", 14, 15);
            (doc as any).autoTable({
                startY: 20,
                head: [['Açıklama', 'Tutar', 'Tarih', 'Kategori']],
                body: masraflarData.map(Object.values)
            });
            doc.addPage();
            doc.text("Aidat Detayları", 14, 15);
            (doc as any).autoTable({
                startY: 20,
                head: [['Dönem', 'Tutar', 'Son Ödeme', 'Daire', 'Ad Soyad', 'Durum']],
                body: aidatlarData.map(Object.values)
            });
            doc.save(`${filename}.pdf`);
        } else if (format === 'word') {
            const createTable = (data: any[]) => {
                if (data.length === 0) return new docx.Table({ rows: [] });
                const header = new docx.TableRow({
                    children: Object.keys(data[0]).map(key => new docx.TableCell({
                        children: [new docx.Paragraph({ text: key, bold: true })],
                    })),
                });
                const rows = data.map(item => new docx.TableRow({
                    children: Object.values(item).map(val => new docx.TableCell({
                        children: [new docx.Paragraph(String(val))],
                    })),
                }));
                return new docx.Table({
                    rows: [header, ...rows],
                    width: { size: 100, type: docx.WidthType.PERCENTAGE }
                });
            };

            const doc = new docx.Document({
                sections: [{
                    children: [
                        new docx.Paragraph({ text: "Sakin Listesi", heading: docx.HeadingLevel.HEADING_1 }),
                        createTable(sakinlerData),
                        new docx.Paragraph({ text: "Masraf Listesi", heading: docx.HeadingLevel.HEADING_1 }),
                        createTable(masraflarData),
                        new docx.Paragraph({ text: "Aidat Detayları", heading: docx.HeadingLevel.HEADING_1 }),
                        createTable(aidatlarData),
                    ],
                }],
            });

            docx.Packer.toBlob(doc).then((blob: any) => {
                saveAs(blob, `${filename}.docx`);
            });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                const sakinlerSheet = workbook.Sheets['Sakinler'];
                const masraflarSheet = workbook.Sheets['Masraflar'];
                const aidatlarSheet = workbook.Sheets['Aidatlar'];

                if (!sakinlerSheet || !masraflarSheet || !aidatlarSheet) {
                    throw new Error("Excel dosyasında 'Sakinler', 'Masraflar', ve 'Aidatlar' sayfaları bulunmalıdır.");
                }

                const importedSakinlerJSON = XLSX.utils.sheet_to_json(sakinlerSheet);
                const importedMasraflarJSON = XLSX.utils.sheet_to_json(masraflarSheet);
                const importedAidatlarFlatJSON: any[] = XLSX.utils.sheet_to_json(aidatlarSheet);
                
                const newSakinler: Sakin[] = importedSakinlerJSON.map((s: any) => ({
                    id: crypto.randomUUID(),
                    adSoyad: s['Ad Soyad'],
                    daireNo: s['Daire No'],
                    telefon: s['Telefon'],
                    girisTarihi: new Date((s['Giriş Tarihi'] - (25567 + 2)) * 86400 * 1000).toISOString().split('T')[0]
                }));
                
                const newMasraflar: Masraf[] = importedMasraflarJSON.map((m: any) => ({
                    id: crypto.randomUUID(),
                    aciklama: m['Açıklama'],
                    tutar: m['Tutar'],
                    tarih: new Date((m['Tarih'] - (25567 + 2)) * 86400 * 1000).toISOString().split('T')[0],
                    kategori: m['Kategori']
                }));

                const aidatlarGrouped = importedAidatlarFlatJSON.reduce((acc, row) => {
                    const donem = row['Dönem'];
                    if (!acc[donem]) {
                        acc[donem] = {
                            id: crypto.randomUUID(),
                            donem: row['Dönem'],
                            tutar: row['Aidat Tutarı'],
                            sonOdemeTarihi: new Date((row['Son Ödeme Tarihi'] - (25567 + 2)) * 86400 * 1000).toISOString().split('T')[0],
                            sakinler: []
                        };
                    }
                    const sakin = newSakinler.find(s => s.daireNo === row['Daire No']);
                    if(sakin) {
                       acc[donem].sakinler.push({
                           sakinId: sakin.id,
                           odendi: row['Ödeme Durumu'] === 'Ödendi'
                       });
                    }
                    return acc;
                }, {} as { [key: string]: Aidat });
                
                const newAidatlar = Object.values(aidatlarGrouped);
                
                setImportedData({ sakinler: newSakinler, aidatlar: newAidatlar, masraflar: newMasraflar });
                setIsImportConfirmOpen(true);

            } catch (error) {
                console.error(error);
                addNotification(`Hata: ${error instanceof Error ? error.message : 'Dosya okunamadı.'}`);
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const confirmImport = () => {
        if (importedData) {
            onBulkUpdate(importedData);
        }
        setIsImportConfirmOpen(false);
        setImportedData(null);
    };

    const themeOptions = [
        { value: 'light', label: 'Açık', icon: 'fa-sun' },
        { value: 'dark', label: 'Koyu', icon: 'fa-moon' },
        { value: 'system', label: 'Sistem', icon: 'fa-desktop' }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-lg border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Uygulama Ayarları</h3>
                
                <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-border-light dark:divide-border-dark">
                    {/* General Settings */}
                    <div className="pt-4">
                        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-300 mb-3">Yönetim Ayarları</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label htmlFor="apartmentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apartman Adı</label>
                                <input 
                                    type="text" 
                                    name="apartmentName" 
                                    id="apartmentName" 
                                    value={formData.apartmentName} 
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"
                                />
                            </div>
                            <div>
                                <label htmlFor="defaultDueAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Varsayılan Aidat Tutarı (₺)</label>
                                <input 
                                    type="number" 
                                    name="defaultDueAmount" 
                                    id="defaultDueAmount" 
                                    value={formData.defaultDueAmount} 
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Theme Settings */}
                    <div className="pt-8">
                        <label className="block text-lg font-medium text-gray-800 dark:text-gray-300 mb-3">Tema Seçimi</label>
                        <div className="flex flex-wrap gap-4">
                            {themeOptions.map(option => (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => setTheme(option.value as Theme)}
                                    className={`flex items-center justify-center w-32 h-20 rounded-lg border-2 transition-colors ${
                                        theme === option.value
                                            ? 'border-accent bg-accent/20'
                                            : 'border-border-light dark:border-border-dark bg-white/20 dark:bg-black/20 hover:border-accent/50'
                                    }`}
                                >
                                    <div className="text-center">
                                        <i className={`fas ${option.icon} text-2xl mb-1 ${theme === option.value ? 'text-accent' : 'text-gray-600 dark:text-gray-400'}`}></i>
                                        <span className={`block text-sm font-medium ${theme === option.value ? 'text-accent' : 'text-gray-700 dark:text-gray-300'}`}>{option.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="pt-8 flex justify-end">
                        <button type="submit" className="px-6 py-2 bg-primary text-white rounded-md hover:bg-secondary border border-white/20">
                            Ayarları Kaydet
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-lg border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-lg">
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-300">Veri Yönetimi</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                     <div className="relative inline-block text-left" ref={exportMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsExportMenuOpen(prev => !prev)}
                            className="px-4 py-2 text-sm bg-green-600/80 text-white rounded-md hover:bg-green-700 border border-white/20 inline-flex items-center"
                        >
                            Verileri Dışa Aktar
                            <i className="fas fa-chevron-down ml-2 -mr-1 h-5 w-5"></i>
                        </button>
                        {isExportMenuOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-border-light dark:border-border-dark ring-1 ring-black ring-opacity-5 z-20">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleExport('excel'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50" role="menuitem">Excel (.xlsx)</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleExport('pdf'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50" role="menuitem">PDF (.pdf)</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleExport('word'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50" role="menuitem">Word (.docx)</a>
                                </div>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={handleImportClick}
                        className="px-4 py-2 text-sm bg-blue-600/80 text-white rounded-md hover:bg-blue-700 border border-white/20"
                    >
                        Verileri İçe Aktar
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".xlsx" />
                </div>
                 <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">İçe aktarma işlemi sadece Excel (.xlsx) formatını destekler.</p>
            </div>
            <ConfirmationModal
                isOpen={isImportConfirmOpen}
                onClose={() => setIsImportConfirmOpen(false)}
                onConfirm={confirmImport}
                title="Verileri İçe Aktar"
                message="Bu işlem mevcut tüm verileri silecek ve dosyadakilerle değiştirecektir. Emin misiniz?"
            />
        </div>
    );
};

export default Settings;