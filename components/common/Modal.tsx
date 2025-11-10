import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-border-light dark:border-border-dark rounded-2xl shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-light dark:border-border-dark">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;