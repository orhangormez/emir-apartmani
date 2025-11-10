import React, { useState } from 'react';
import type { Sakin, Aidat } from '../types';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import ResidentDetailModal from './ResidentDetailModal';

interface ResidentsListProps {
    sakinler: Sakin[];
    aidatlar: Aidat[];
    onAddSakin: (sakin: Omit<Sakin, 'id'>) => void;
    onUpdateSakin: (sakin: Sakin) => void;
    onDeleteSakin: (id: string) => void;
}

const initialSakinState: Omit<Sakin, 'id'> = {
    adSoyad: '',
    daireNo: 0,
    telefon: '',
    girisTarihi: new Date().toISOString().split('T')[0],
};

const ResidentsList: React.FC<ResidentsListProps> = ({ sakinler, aidatlar, onAddSakin, onUpdateSakin, onDeleteSakin }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSakin, setSelectedSakin] = useState<Sakin | null>(null);
    const [sakinToDeleteId, setSakinToDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState(initialSakinState);

    const openAddModal = () => {
        setSelectedSakin(null);
        setFormData(initialSakinState);
        setIsModalOpen(true);
    };

    const openEditModal = (sakin: Sakin) => {
        setSelectedSakin(sakin);
        setFormData(sakin);
        setIsModalOpen(true);
    };
    
    const openDeleteConfirm = (id: string) => {
        setSakinToDeleteId(id);
        setIsConfirmModalOpen(true);
    };
    
    const openDetailModal = (sakin: Sakin) => {
        setSelectedSakin(sakin);
        setIsDetailModalOpen(true);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSakin(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'daireNo' ? parseInt(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSakin) {
            onUpdateSakin({ ...formData, id: selectedSakin.id });
        } else {
            onAddSakin(formData);
        }
        handleCloseModal();
    };
    
    const handleDelete = () => {
        if (sakinToDeleteId) {
            onDeleteSakin(sakinToDeleteId);
        }
        setIsConfirmModalOpen(false);
        setSakinToDeleteId(null);
    };

    return (
        <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-lg border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Sakin Listesi</h3>
                <button onClick={openAddModal} className="px-4 py-2 bg-accent/80 text-white rounded-md hover:bg-accent backdrop-blur-sm border border-white/20">
                    <i className="fas fa-plus mr-2"></i>Yeni Sakin Ekle
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="border-b border-white/20">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Daire No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ad Soyad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Telefon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sakinler.sort((a,b) => a.daireNo - b.daireNo).map(sakin => (
                            <tr key={sakin.id} className="border-b border-white/10 dark:border-black/10">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{sakin.daireNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{sakin.adSoyad}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">{sakin.telefon}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                     <button onClick={() => openDetailModal(sakin)} className="text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-200"><i className="fas fa-info-circle"></i></button>
                                    <button onClick={() => openEditModal(sakin)} className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => openDeleteConfirm(sakin.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isDetailModalOpen && selectedSakin && (
                <ResidentDetailModal 
                    sakin={selectedSakin}
                    aidatlar={aidatlar}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}

            <Modal title={selectedSakin ? 'Sakin Düzenle' : 'Yeni Sakin Ekle'} isOpen={isModalOpen} onClose={handleCloseModal}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="daireNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Daire No</label>
                        <input type="number" name="daireNo" id="daireNo" value={formData.daireNo} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                    <div>
                        <label htmlFor="adSoyad" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ad Soyad</label>
                        <input type="text" name="adSoyad" id="adSoyad" value={formData.adSoyad} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                    <div>
                        <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
                        <input type="tel" name="telefon" id="telefon" value={formData.telefon} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
                    </div>
                     <div>
                        <label htmlFor="girisTarihi" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Giriş Tarihi</label>
                        <input type="date" name="girisTarihi" id="girisTarihi" value={formData.girisTarihi} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-gray-900 dark:text-gray-200" />
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
                title="Sakini Sil"
                message="Bu sakini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
            />
        </div>
    );
};

export default ResidentsList;