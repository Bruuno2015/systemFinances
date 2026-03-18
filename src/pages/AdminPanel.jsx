import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, CreditCard, Lock, Unlock, AlertTriangle, FileText, Send, AlertCircle, PieChart, Settings, Eye, X, Shield, Layers } from 'lucide-react';
import AnalyticalCharts from '../components/AnalyticalCharts';
import TransactionDetailModal from '../components/TransactionDetailModal';
import ReconciliationModal from '../components/ReconciliationModal';

const AdminPanel = ({ view = 'dashboard' }) => {
    const [stats, setStats] = useState({ totalSpent: 0, pendingNFs: 0, activeManagers: 0 });
    const [managers, setManagers] = useState([]);
    const [cards, setCards] = useState([]);
    const [globalHistory, setGlobalHistory] = useState([]);
    const [invoicesData, setInvoicesData] = useState({ invoices: [], globalTotal: 0 });
    const [isMonthClosed, setIsMonthClosed] = useState(false);
    const [fixedClosingDay, setFixedClosingDay] = useState('');
    const [chartData, setChartData] = useState({ costCenter: [], trend: [] });
    const [loading, setLoading] = useState(true);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [newCard, setNewCard] = useState({ lastFour: '', department: 'TI' });
    const [selectedExpenses, setSelectedExpenses] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    
    // Management Modals State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', department: 'Operações', monthlyLimit: 5000, totalLimit: 50000 });
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [selectedManager, setSelectedManager] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);
    const [selectedInvoiceCard, setSelectedInvoiceCard] = useState(null);
    const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);

    const departments = ['Produção', 'TI', 'Financeiro', 'RH', 'Comercial', 'Logística', 'Operações'];

    const refreshData = async () => {
        try {
            const [statusRes, statsRes, usersRes, cardsRes, historyRes, ccRes, trendRes, invoiceRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/system/config`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/stats-global`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/users`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/cards`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/all`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/chart/cost-center`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/chart/trend`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/invoices/current`)
            ]);
            setIsMonthClosed(statusRes.data.status === 'Closed');
            setFixedClosingDay(statusRes.data.closingDay || '');
            setStats(statsRes.data);
            setManagers(usersRes.data);
            setCards(cardsRes.data);
            setGlobalHistory(historyRes.data);
            setChartData({ costCenter: ccRes.data, trend: trendRes.data });
            setInvoicesData(invoiceRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setLoading(false);
        }
    };

    const handleSendAlert = async (userId, type) => {
        const message = type === 'limit' 
            ? 'Você atingiu 90% do seu limite mensal. Por favor, revise seus gastos.'
            : 'Existem valores gastos no seu cartão ainda não lançados no sistema. Por favor, regularize para evitar o bloqueio.';
        
        const endpoint = type === 'limit' ? 'limit-alert' : 'unrecorded-alert';
        
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/notifications/${endpoint}`, { userId, message });
            alert('Alerta enviado com sucesso!');
        } catch (err) {
            alert('Erro ao enviar alerta');
        }
    };

    const handleToggleSelectAll = (e) => {
        if (e.target.checked) {
            const pendingIds = globalHistory.filter(h => h.status === 'Open').map(h => h.id);
            setSelectedExpenses(pendingIds);
        } else {
            setSelectedExpenses([]);
        }
    };

    const handleToggleSelect = (id) => {
        if (selectedExpenses.includes(id)) {
            setSelectedExpenses(selectedExpenses.filter(eId => eId !== id));
        } else {
            setSelectedExpenses([...selectedExpenses, id]);
        }
    };

    const handleBulkStatus = async (status) => {
        if (!selectedExpenses.length) return;
        setBulkLoading(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/bulk-status`, {
                ids: selectedExpenses,
                status
            });
            setSelectedExpenses([]);
            refreshData();
        } catch (err) {
            alert('Erro ao atualizar status em lote.');
        } finally {
            setBulkLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const toggleMonthStatus = async () => {
        const password = window.prompt(`Digite a Senha Financeira para ${isMonthClosed ? 'reabrir' : 'encerrar'} o período:`);
        if (!password) return;

        const nextState = !isMonthClosed;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/system/close-month`, { close: nextState, password });
            setIsMonthClosed(nextState);
            alert(`Mês ${nextState ? 'fechado' : 'reaberto'}!`);
            refreshData();
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao alterar status do mês');
        }
    };

    const handleToggleCardStatus = async (card) => {
        if (!window.confirm(`Deseja realmente ${card.status === 'Active' ? 'bloquear' : 'ativar'} este cartão?`)) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/cards/${card.id}/toggle-status`);
            refreshData();
        } catch (err) {
            alert('Erro ao alterar status do cartão');
        }
    };

    const handleApproveUnlock = async (expense) => {
        if (!window.confirm(`Liberar a edição para o lançamento de R$ ${expense.value} (${expense.establishment})?`)) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/${expense.id}/unlock-approve`);
            refreshData();
            alert('Liberação concedida com sucesso.');
        } catch (err) {
            alert('Erro ao aprovar liberação.');
        }
    };

    const handleRegisterCard = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/cards`, {
                lastFour: newCard.lastFour,
                department: newCard.department
            });
            setIsCardModalOpen(false);
            setNewCard({ lastFour: '', department: 'TI' });
            refreshData();
            alert('Cartão registrado com sucesso!');
        } catch (err) {
            alert('Erro ao registrar cartão');
        }
    };

    const handleAddManager = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/users`, newUser);
            setIsUserModalOpen(false);
            setNewUser({ name: '', email: '', password: '', department: 'Operações', role: 'GESTOR', monthlyLimit: 5000, totalLimit: 50000 });
            refreshData();
            alert('Gestor cadastrado com sucesso!');
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao cadastrar gestor');
        }
    };

    const handleUpdateLimits = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/users/${selectedManager.id}/limits`, {
                monthlyLimit: selectedManager.monthly_limit,
                totalLimit: selectedManager.total_limit
            });
            setIsLimitModalOpen(false);
            refreshData();
            alert('Limites atualizados com sucesso!');
        } catch (err) {
            alert('Erro ao atualizar limites');
        }
    };

    const handleUpdateClosingDay = async (e) => {
        const value = e.target.value;
        setFixedClosingDay(value);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/system/closing-day`, { day: value });
        } catch (err) {
            console.error('Erro ao salvar dia de fechamento', err);
        }
    };

    const renderAmountColumn = (item) => {
        const installmentMatch = item.establishment?.match(/\((\d+)\/(\d+)\)$/);
        if (installmentMatch) {
            const totalInstallments = parseInt(installmentMatch[2]);
            const calculatedTotal = item.value * totalInstallments;
            return (
                <div className="flex flex-col">
                    <span className="font-bold text-blue-600">R$ {calculatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">{totalInstallments}x de R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
            );
        }
        return <span className="font-bold text-primary">R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>;
    };

    if (loading) return <div className="p-10 text-center">Carregando painel administrativo...</div>;

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row justify-between md:items-end border-b border-border pb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-text-main pb-1">
                        {view === 'dashboard' && 'Dashboard Financeiro'}
                        {view === 'cards' && 'Cartões e Gestores'}
                        {view === 'invoices' && 'Painel de Faturas'}
                    </h2>
                    <p className="text-sm text-text-muted italic">
                        {view === 'dashboard' && 'Monitoramento global e indicadores de performance.'}
                        {view === 'cards' && 'Gerenciamento de acessos corporativos e emissões.'}
                        {view === 'invoices' && 'Fechamento de faturas e consolidação de gastos.'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {view === 'invoices' && (
                        <>
                            {/* Dia Fixo removido via patch de melhorias UX */}
                            <button 
                                onClick={toggleMonthStatus}
                                className={`btn px-6 py-2.5 shadow-lg ${isMonthClosed ? 'bg-danger shadow-danger/20' : 'bg-success shadow-success/20'} text-white rounded-xl h-[42px] self-end flex items-center gap-2`}
                            >
                                {isMonthClosed ? <Lock size={18} /> : <Unlock size={18} />}
                                <span className="hidden sm:inline">{isMonthClosed ? 'Reabrir Mês' : 'Encerrar Período'}</span>
                            </button>
                        </>
                    )}
                </div>
            </header>

            {view === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Desembolso Total</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-text-main">R$ {stats.totalSpent?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-success font-bold mb-1">↑ 12%</span>
                    </div>
                </div>
                <div className={`card ${stats.pendingNFs > 0 ? 'bg-danger/5 border-danger/20' : 'bg-blue-50 border-blue-200'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${stats.pendingNFs > 0 ? 'text-danger' : 'text-blue-600'}`}>Notas Pendentes</p>
                    <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${stats.pendingNFs > 0 ? 'text-danger' : 'text-blue-700'}`}>{stats.pendingNFs}</span>
                        {stats.pendingNFs > 0 ? (
                            <div className="px-2 py-0.5 bg-danger/10 text-danger text-[10px] font-bold rounded">Ação necessária</div>
                        ) : (
                            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">Limpo</div>
                        )}
                    </div>
                </div>
                <div className="card">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Gestores Ativos</p>
                    <span className="text-2xl font-bold text-text-main">{stats.activeManagers}</span>
                </div>
                <div className="card bg-amber-50 border-amber-200">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Liberações Pendentes</p>
                    <span className="text-2xl font-bold text-amber-700">{globalHistory.filter(h => h.unlock_requested).length}</span>
                </div>
            </div>

            <div className="card">
                <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                    <PieChart size={20} className="text-primary" /> Análise de Custos por Unidade
                </h3>
                <AnalyticalCharts costCenterData={chartData.costCenter} trendData={chartData.trend} />
            </div>

                </div>
            )}

            {view === 'cards' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    {/* User Management */}
                <div className="card w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-border pb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <UserPlus size={18} className="text-primary" /> Gestores Registrados
                        </h3>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => setIsUserModalOpen(true)}
                                className="flex-1 sm:flex-none text-[10px] font-bold text-white bg-primary px-3 py-2 rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 text-center"
                            >
                                Adicionar Gestor
                            </button>
                            <button className="flex-1 sm:flex-none text-[10px] font-bold text-primary border border-primary/20 bg-primary/5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-all text-center">Exportar CSV</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Nome / Perfil</th>
                                    <th>Setor</th>
                                    <th>Limite Disp.</th>
                                    <th>Ações de Controle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="font-medium text-text-main">{user.name}</div>
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold ${user.role === 'FINANCEIRO' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                {user.role === 'FINANCEIRO' ? 'ADMINISTRADOR' : 'GESTOR'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="px-2 py-0.5 bg-background-alt text-text-muted text-[10px] font-bold rounded uppercase">
                                                {user.department || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.role === 'FINANCEIRO' ? (
                                                <span className="text-[10px] font-bold text-text-muted italic">Ilimitado</span>
                                            ) : (
                                                <span className={`font-bold ${user.available_limit < 1000 ? 'text-danger' : 'text-success'}`}>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(user.available_limit)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="flex gap-2">
                                            <button 
                                                title="Alerta de Limite" 
                                                onClick={() => handleSendAlert(user.id, 'limit')}
                                                className="p-2 text-primary hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/20 transition-all"
                                            >
                                                <Send size={14} />
                                            </button>
                                            <button 
                                                title="Alerta de Não Lançado" 
                                                onClick={() => handleSendAlert(user.id, 'unrecorded')}
                                                className="p-2 text-danger hover:bg-danger/5 rounded-lg border border-transparent hover:border-danger/20 transition-all"
                                            >
                                                <AlertCircle size={14} />
                                            </button>
                                            {user.role !== 'FINANCEIRO' && (
                                                <button 
                                                    title="Ajustar Limites" 
                                                    onClick={() => { setSelectedManager({...user}); setIsLimitModalOpen(true); }}
                                                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                                >
                                                    <Settings size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card Management */}
                <div className="card">
                    <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CreditCard size={18} className="text-primary" /> Cartões Corporativos
                        </h3>
                        <button 
                            onClick={() => setIsCardModalOpen(true)}
                            className="text-[10px] font-bold text-white bg-primary px-3 py-1.5 rounded-lg shadow-md transition-all hover:scale-105 active:scale-95"
                        >
                            Novo Cartão
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Nº Final</th>
                                    <th>Status</th>
                                    <th>Habilitação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cards.map(card => (
                                    <tr key={card.id}>
                                        <td className="font-mono font-bold">**** {card.last_four}</td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${card.status === 'Active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                {card.status === 'Active' ? 'ATIVO' : 'BLOQUEADO'}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => handleToggleCardStatus(card)}
                                                className={`text-[10px] font-bold uppercase ${card.status === 'Active' ? 'text-danger' : 'text-primary'} hover:underline`}
                                            >
                                                {card.status === 'Active' ? 'Bloquear' : 'Ativar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            )}

            {view === 'invoices' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Invoices per Card & Total Monthly Payment */}
                    <div className="card w-full overflow-hidden bg-slate-50 border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-6">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <CreditCard size={24} className="text-blue-600" /> Faturas do Mês Atual
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Soma de parcelas e lançamentos projetados para este mês.</p>
                    </div>
                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 min-w-[250px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">Total a Pagar no Mês</p>
                        <h4 className="text-3xl font-black">
                            <span className="text-blue-300 mr-1 text-2xl font-bold block md:inline">R$</span>
                            {invoicesData.globalTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h4>
                        <div className="mt-4 pt-4 border-t border-blue-500/30">
                            <button 
                                onClick={() => setIsReconciliationModalOpen(true)}
                                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Layers size={14} /> Conciliação Inteligente (IA)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {invoicesData.invoices.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-slate-400 font-medium">Nenhuma fatura projetada para o mês atual.</div>
                    ) : (
                        invoicesData.invoices.map((inv, idx) => {
                            // Find the manager name handling this card from history
                            const associatedExpense = globalHistory.find(h => h.card_last_four === inv.card_last_four);
                            const managerName = associatedExpense ? associatedExpense.managerName : 'Desconhecido';

                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => { setSelectedInvoiceCard(inv.card_last_four); setIsInvoicesModalOpen(true); }}
                                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-bl-[40px] -z-0"></div>
                                    <div className="relative z-10 flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <CreditCard size={14} className="text-slate-500" />
                                            </div>
                                            <span className="font-mono font-bold text-slate-700 tracking-wider">**** {inv.card_last_four}</span>
                                        </div>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Fatura</span>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Responsável: {managerName}</p>
                                        <p className="text-xl font-black text-slate-800">
                                            R$ {inv.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

                </div>
            )}

            {view === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Pending Unlock Requests Alert */}
            {globalHistory.filter(h => h.unlock_requested).length > 0 && (
                <div className="card w-full overflow-hidden bg-amber-50 border border-amber-200">
                    <div className="flex justify-between items-center mb-6 border-b border-amber-200/50 pb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-amber-800">
                            <Unlock size={20} className="text-amber-600" /> Solicitações de Liberação de Lançamentos
                        </h3>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="history-table shadow-sm rounded-lg overflow-hidden border-none text-amber-900">
                            <thead>
                                <tr className="bg-amber-100/50 border-b border-amber-200">
                                    <th className="text-amber-800">Data</th>
                                    <th className="text-amber-800">Gestor</th>
                                    <th className="text-amber-800">Estabelecimento</th>
                                    <th className="text-amber-800">Valor</th>
                                    <th className="text-amber-800">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {globalHistory.filter(h => h.unlock_requested).map(req => (
                                    <tr key={req.id} className="border-b border-amber-100 last:border-0 hover:bg-amber-100/50">
                                        <td className="font-medium text-amber-700">{new Date(req.purchase_date).toLocaleDateString('pt-BR')}</td>
                                        <td className="font-bold">{req.managerName}</td>
                                        <td>{req.establishment}</td>
                                        <td className="font-bold">R$ {req.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td>
                                            <button 
                                                onClick={() => handleApproveUnlock(req)}
                                                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 hover:bg-amber-700 transition"
                                            >
                                                Aprovar Liberação
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Global Filings */}
            <div className="card w-full overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FileText size={20} className="text-primary" /> Transações Recentes
                    </h3>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="history-table shadow-sm rounded-lg overflow-hidden">
                        <thead>
                            <tr>
                                <th className="w-8">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        checked={selectedExpenses.length > 0 && selectedExpenses.length === globalHistory.filter(h => h.status === 'Open').length}
                                        onChange={handleToggleSelectAll}
                                        disabled={globalHistory.filter(h => h.status === 'Open').length === 0}
                                    />
                                </th>
                                <th>Emissão</th>
                                <th>Gestor / Setor</th>
                                <th>Estabelecimento</th>
                                <th>Comprador</th>
                                <th>Valor Bruto</th>
                                <th>Comprovante</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {globalHistory.map(item => (
                                <tr key={item.id} className={selectedExpenses.includes(item.id) ? 'bg-blue-50/50' : ''}>
                                    <td>
                                        {item.status === 'Open' && (
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                checked={selectedExpenses.includes(item.id)}
                                                onChange={() => handleToggleSelect(item.id)}
                                            />
                                        )}
                                    </td>
                                    <td className="text-text-muted">{new Date(item.purchase_date).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <div className="font-bold">{item.managerName}</div>
                                        <div className="text-[10px] text-text-muted uppercase font-medium">
                                            {item.department || item.userDepartment || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="text-text-main">{item.establishment}</td>
                                    <td className="text-text-muted font-medium italic">{item.purchaser_name || '-'}</td>
                                    <td>{renderAmountColumn(item)}</td>
                                    <td>
                                        <div className="flex flex-col gap-1.5">
                                            {item.nf_attachment_path ? (
                                                <div className="flex items-center gap-2">
                                                    <a 
                                                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/${item.nf_attachment_path}`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="px-2 py-1 bg-primary/5 text-primary rounded text-[10px] font-bold border border-primary/20 hover:bg-primary/10 transition-all"
                                                    >VER NF</a>
                                                    {item.extracted_nf_number && (
                                                        <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="NF Extraída via IA">
                                                            Nº {item.extracted_nf_number}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-text-muted font-medium italic mb-1">S/ NF</span>
                                            )}
                                            <button 
                                                onClick={() => { setSelectedExpense(item); setIsDetailModalOpen(true); }}
                                                className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[10px] font-bold border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-1 self-start"
                                            >
                                                <Eye size={10} /> DETALHES
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Open' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                                            {item.status === 'Open' ? 'PENDENTE' : 'CONCILIADO'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

                </div>
            )}

            {/* Modal Novo Cartão */}
            {isCardModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Registrar Novo Cartão</h3>
                            <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleRegisterCard} className="p-6 lg:p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Últimos 4 Dígitos</label>
                                <input
                                    type="text"
                                    maxLength="4"
                                    required
                                    placeholder="Ex: 1234"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-lg font-bold text-slate-700"
                                    value={newCard.lastFour}
                                    onChange={(e) => setNewCard({...newCard, lastFour: e.target.value.replace(/\D/g, '')})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Setor Responsável</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={newCard.department}
                                    onChange={(e) => setNewCard({...newCard, department: e.target.value})}
                                >
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCardModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Novo Gestor */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 lg:p-8 bg-blue-600 text-white flex justify-between items-start lg:items-center">
                            <div>
                                <h3 className="text-xl font-bold">Cadastrar Novo Gestor</h3>
                                <p className="text-blue-100 text-xs">Acesso administrativo e definição de verba.</p>
                            </div>
                            <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors mt-1 lg:mt-0">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddManager} className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                >
                                    <option value="GESTOR">Gestor de Área (Limitado)</option>
                                    <option value="FINANCEIRO">Administrador (Acesso Total)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Setor</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={newUser.department}
                                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                                >
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            {newUser.role !== 'FINANCEIRO' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Limite Mensal (R$)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                        value={newUser.monthlyLimit}
                                        onChange={(e) => setNewUser({...newUser, monthlyLimit: e.target.value})}
                                    />
                                </div>
                            )}
                            <div className="md:col-span-2 pt-4 lg:pt-6 flex flex-col sm:flex-row gap-4">
                                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all order-2 sm:order-1">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all order-1 sm:order-2">Salvar Gestor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Ajustar Limites */}
            {isLimitModalOpen && selectedManager && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">Ajustar Limites</h3>
                            <p className="text-xs text-slate-500 mt-1">Gestor: <span className="font-bold text-blue-600">{selectedManager.name}</span></p>
                        </div>
                        <form onSubmit={handleUpdateLimits} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Limite Mensal (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                                    value={selectedManager.monthly_limit}
                                    onChange={(e) => setSelectedManager({...selectedManager, monthly_limit: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Limite Total (Projeto/Ano)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                                    value={selectedManager.total_limit}
                                    onChange={(e) => setSelectedManager({...selectedManager, total_limit: e.target.value})}
                                />
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsLimitModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-100">Atualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detalhes da Transação */}
            <TransactionDetailModal 
                isOpen={isDetailModalOpen} 
                expense={selectedExpense} 
                onClose={() => setIsDetailModalOpen(false)} 
            />

            {/* Modal Faturas (Lançamentos por Cartão) */}
            {isInvoicesModalOpen && selectedInvoiceCard && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                    <CreditCard size={20} className="text-blue-600" /> Detalhamento da Fatura
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Cartão: <span className="font-mono font-bold text-slate-700">**** {selectedInvoiceCard}</span></p>
                            </div>
                            <button onClick={() => setIsInvoicesModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <table className="history-table shadow-sm rounded-lg overflow-hidden w-full text-sm">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Estabelecimento</th>
                                        <th>Valor</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {globalHistory
                                        .filter(h => h.card_last_four === selectedInvoiceCard && 
                                                     new Date(h.purchase_date).getMonth() === new Date().getMonth() && 
                                                     new Date(h.purchase_date).getFullYear() === new Date().getFullYear())
                                        .map(item => (
                                            <tr key={item.id}>
                                                <td className="text-slate-500">{new Date(item.purchase_date).toLocaleDateString('pt-BR')}</td>
                                                <td className="font-bold text-slate-700">{item.establishment}</td>
                                                <td className="text-blue-600 font-bold">R$ {item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Open' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                                                        {item.status === 'Open' ? 'PENDENTE' : 'CONCILIADO'}
                                                    </span>
                                                </td>
                                            </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedExpenses.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center justify-between gap-8 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-slate-700">
                    <span className="font-bold text-sm tracking-wide">{selectedExpenses.length} selecionado{selectedExpenses.length > 1 ? 's' : ''}</span>
                    <div className="flex gap-2 text-xs">
                        <button 
                            disabled={bulkLoading}
                            onClick={() => handleBulkStatus('Rejected')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full font-bold transition-all disabled:opacity-50"
                        >Rejeitar Pendências</button>
                        <button 
                            disabled={bulkLoading}
                            onClick={() => handleBulkStatus('Approved')}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 tracking-wider"
                        >APROVAR LOTE</button>
                    </div>
                </div>
            )}
            
            {/* Modal de Conciliação AI */}
            <ReconciliationModal 
                isOpen={isReconciliationModalOpen}
                onClose={() => setIsReconciliationModalOpen(false)}
                onReconciled={refreshData}
            />
        </div>
    );
};

export default AdminPanel;
