import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface StatCardProps {
    icon: string;
    title: string;
    value: number;
    format?: 'currency' | 'number';
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, format = 'number', color }) => {
    const formattedValue = format === 'currency'
        ? formatCurrency(value)
        : value.toLocaleString('tr-TR');
    
    return (
        <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-lg border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-lg flex items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color} bg-opacity-70`}>
                <i className={`${icon} text-3xl text-white`}></i>
            </div>
            <div className="ml-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formattedValue}</p>
            </div>
        </div>
    );
};

export default StatCard;