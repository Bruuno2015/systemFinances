import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download, FileText, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TransactionDetailModal from '../components/TransactionDetailModal';
import * as XLSX from 'xlsx';

const ExpenseList = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState(''); // YYYY-MM

    // Detail Modal
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isSystemMonthClosed, setIsSystemMonthClosed] = useState(false);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const endpoint = user.role?.toUpperCase() === 'FINANCEIRO' || user.role?.toUpperCase() === 'ADMIN'
                    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/all`
                    : `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/manager/${user.id}`;
                
                const [expenseRes, configRes] = await Promise.all([
                    axios.get(endpoint),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/system/config`)
                ]);

                setExpenses(expenseRes.data);
                setIsSystemMonthClosed(configRes.data.status === 'Closed');
                
                // Set default month to current month
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                setMonthFilter(currentMonth);
                
            } catch (err) {
                console.error('Error fetching expenses:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchExpenses();
        }
    }, [user]);

    useEffect(() => {
        let result = expenses;

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(e => {
                const statusStr = e.status === 'Open' ? 'pendente' : (e.status === 'Approved' ? 'aprovado' : 'rejeitado');
                const searchString = `${e.establishment || ''} ${e.cost_center || ''} ${e.managerName || ''} ${statusStr}`.toLowerCase();
                return searchString.includes(lowerSearch);
            });
        }

        if (monthFilter) {
            result = result.filter(e => {
                if (!e.purchase_date) return false;
                const reqMonth = e.purchase_date.substring(0, 7); // Safe extraction 'YYYY-MM'
                return reqMonth === monthFilter;
            });
        }

        setFilteredExpenses(result);
    }, [expenses, searchTerm, monthFilter]);

    const handleExportXLSX = () => {
        if (filteredExpenses.length === 0) return alert('Nenhum dado para exportar.');
        
        const exportData = filteredExpenses.map(e => ({
            'ID': e.id,
            'Data': new Date(e.purchase_date).toLocaleDateString('pt-BR'),
            'Estabelecimento': e.establishment,
            'Centro de Custo': e.cost_center || '-',
            'Gestor Responsável': e.managerName || e.user_id,
            'Comprador': e.purchaser_name || '-',
            'Status': e.status === 'Open' ? 'Pendente' : (e.status === 'Approved' ? 'Aprovado' : 'Rejeitado'),
            'Valor (R$)': e.value
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        // Ajustar largura das colunas
        const colWidths = [
            { wch: 8 },  // ID
            { wch: 12 }, // Data
            { wch: 30 }, // Estabelecimento
            { wch: 20 }, // Centro de Custo
            { wch: 25 }, // Gestor
            { wch: 20 }, // Comprador
            { wch: 15 }, // Status
            { wch: 15 }  // Valor
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas");
        XLSX.writeFile(workbook, `Relatorio_Despesas_${monthFilter || 'Geral'}.xlsx`);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved': return <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase"><CheckCircle size={10} /> Aprovado</span>;
            case 'Rejected': return <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase"><AlertCircle size={10} /> Rejeitado</span>;
            default: return <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase"><Clock size={10} /> Pendente</span>;
        }
    };

    const renderAmountColumn = (item) => {
        const installmentMatch = item.establishment?.match(/\((\d+)\/(\d+)\)$/);
        if (installmentMatch) {
            const totalInstallments = parseInt(installmentMatch[2]);
            const calculatedTotal = item.value * totalInstallments;
            return (
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-blue-600 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-lg mb-1">
                        R$ {calculatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                        {totalInstallments}x de R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            );
        }
        return <span className="text-sm font-black text-slate-900">R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>;
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Carregando histórico...</div>;

    const totalFilteredValue = filteredExpenses.reduce((acc, curr) => acc + (curr.value || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 pb-1 flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} /> Despesas Lançadas
                    </h2>
                    <p className="text-sm text-slate-500">Histórico completo e detalhado dos lançamentos.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={handleExportXLSX} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 border border-green-700 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition-colors shadow-sm shadow-green-200">
                        <Download size={16} /> Exportar XLSX
                    </button>
                </div>
            </header>

            <div className="card p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6 pt-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar por estabelecimento, centro de custo, gestor ou status..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-auto">
                        <select 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-700 cursor-pointer"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                        >
                            <option value="">Todo o Período</option>
                            <option value="2026-03">Mar/2026</option>
                            <option value="2026-02">Fev/2026</option>
                            <option value="2026-01">Jan/2026</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4 flex items-center justify-between text-sm px-2">
                    <span className="text-slate-500 font-medium">Exibindo <strong className="text-slate-900">{filteredExpenses.length}</strong> resultados</span>
                    <span className="font-bold text-slate-900">Total: <span className="text-blue-600">R$ {totalFilteredValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
                </div>

                <div className="overflow-x-auto w-full border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Estabelecimento / CC</th>
                                <th className="px-6 py-4">Gestor</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.map(item => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => { setSelectedExpense(item); setIsDetailModalOpen(true); }}
                                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-700">{new Date(item.purchase_date).toLocaleDateString('pt-BR')}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.establishment}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">{item.cost_center}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-700">{item.managerName || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {renderAmountColumn(item)}
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                        Nenhum lançamento encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TransactionDetailModal 
                isOpen={isDetailModalOpen} 
                expense={selectedExpense} 
                onClose={() => setIsDetailModalOpen(false)} 
                isSystemMonthClosed={isSystemMonthClosed}
            />
        </div>
    );
};

export default ExpenseList;
