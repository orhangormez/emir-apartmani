import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-gray-700 dark:text-gray-300">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-gray-800 bg-gray-200/50 hover:bg-gray-300/50 dark:bg-gray-600/50 dark:text-gray-200 dark:hover:bg-gray-500/50 border border-white/20"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-md text-white bg-red-600/80 hover:bg-red-700 border border-white/20"
                    >
                        Onayla
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;