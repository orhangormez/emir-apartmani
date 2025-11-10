
import React, { useState } from 'react';
import type { Masraf } from '../types';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ExpensesManagerProps {
    masraflar: Masraf[];
    onAddMasraf: (masraf: Omit<Masraf, 'id'>) => void;
    onUpdateMasraf: (masraf: Masraf) => void;
    onDeleteMasraf: (id: string) => void;
}

const initialMasrafState: Omit<Masraf, 'id'> = {
    aciklama: '',
    tutar: 0,
    tarih: new Date().toISOString().split('T')[0],
    kategori: 'Fatura',
};

const ExpenseManager: React.FC<ExpensesManagerProps> = ({ masraflar, onAddMasraf, onUpdateMasraf, onDeleteMasraf }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedMasraf, setSelectedMasraf] = useState<Masraf | null>(null);
    const [masrafToDeleteId, setMasrafToDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialMasrafState);
    const expenseCategories = ['Fatura', 'Bakım', 'Personel', 'Demirbaş', 'Diğer'];

    const openAddModal = () => {
        setSelectedMasraf(null);
        setFormData(initialMasrafState);
        setIsModalOpen(true);
    };

    const openEditModal = (masraf: Masraf) => {
        setSelectedMasraf(masraf);
        setFormData(masraf);
        setIsModalOpen(true);
    };

    const openDeleteConfirm = (id: string) => {
        setMasrafToDeleteId(id);
        setIsConfirmModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMasraf(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'tutar' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedMasraf) {
            onUpdateMasraf({ ...formData, id: selectedMasraf.id });
        } else {
            onAddMasraf(formData);
        }
        handleCloseModal();
    };

    const handleDelete = () => {
        if (masrafToDeleteId) {
            onDeleteMasraf(masrafToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setMasrafToDeleteId(null);
    };

    return (
        <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-lg border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Masraf Listesi</h3>
                <button onClick={openAddModal} className="px-4 py-2 bg-accent/80 text-white rounded-md hover:bg-accent backdrop-blur-sm border border-white/20">
                    <i className="fas fa-plus mr-2"></i>Yeni Masraf Ekle
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="border-b border-white/20">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tarih</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Açıklama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Kategori</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tutar</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...masraflar].sort((a,b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()).map(masraf => (
                            <tr key={masraf.id} className="border-b border-white/10 dark:border-black/10">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{formatDate(masraf.tarih)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{masraf.aciklama}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{masraf.kategori}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(masraf.tutar)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4 text-center">
                                    <button onClick={() => openEditModal(masraf)} className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => openDeleteConfirm(masraf.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal title={selectedMasraf ? 'Masraf Düzenle' : 'Yeni Masraf Ekle'} isOpen={isModalOpen} onClose={handleCloseModal}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="aciklama" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                        <input type="text" name="aciklama" id="aciklama" value={formData.aciklama} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                    <div>
                        <label htmlFor="tutar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tutar (₺)</label>
                        <input type="number" name="tutar" id="tutar" step="0.01" value={formData.tutar} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                    <div>
                        <label htmlFor="tarih" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tarih</label>
                        <input type="date" name="tarih" id="tarih" value={formData.tarih} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                    <div>
                        <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
                        <select name="kategori" id="kategori" value={formData.kategori} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200">
                           {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200/50 text-gray-800 rounded-md hover:bg-gray-300/50 border border-white/20">İptal</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary border border-white/20">Kaydet</button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDelete}
                title="Masrafı Sil"
                message="Bu masrafı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
            />
        </div>
    );
};

export default ExpenseManager;
