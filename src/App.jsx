import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import MainLayout from './components/Layout';
import AdminPanel from './pages/AdminPanel';
import ExpenseForm from './pages/ExpenseForm';
import { AlertCircle, CreditCard, PieChart, FileText, Bell, PlusSquare, Edit3, X, Calendar, Upload } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Cards from './pages/Cards';
import AuditTrail from './pages/AuditTrail';
import ExpenseList from './pages/ExpenseList';
import TransactionDetailModal from './components/TransactionDetailModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Navigate to="/login" />;
    
    if (allowedRoles && !allowedRoles.map(r => r.toUpperCase()).includes(user.role?.toUpperCase())) {
        return <Navigate to="/" />;
    }

    return children;
};

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        monthlySpent: 0,
        monthlyLimit: 0,
        pendingNF: 0
    });
    const [chartData, setChartData] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [cards, setCards] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    // Detail Modal State
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDetailExpense, setSelectedDetailExpense] = useState(null);

    const openDetailModal = (expense) => {
        setSelectedDetailExpense(expense);
        setIsDetailModalOpen(true);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, trendRes, historyRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/stats/${user.id}`),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/chart/trend/${user.id}`),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/manager/${user.id}`)
                ]);
                setStats(statsRes.data);
                setChartData(trendRes.data);
                setHistory(historyRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
            // Fetch cards for edit modal
            const fetchCards = async () => {
                try {
                    const deptParam = user.department ? `?department=${encodeURIComponent(user.department)}` : '';
                    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/cards${deptParam}`);
                    setCards(response.data.filter(c => c.status === 'Active'));
                } catch (err) {
                    console.error('Error fetching cards:', err);
                }
            };
            fetchCards();
        }
    }, [user]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/${selectedExpense.id}`, {
                purchaseDate: selectedExpense.purchase_date,
                establishment: selectedExpense.establishment,
                value: selectedExpense.value,
                costCenter: selectedExpense.cost_center,
                cardLastFour: selectedExpense.card_last_four
            });
            setIsEditModalOpen(false);
            // Refresh dashboard data
            try {
                const [statsRes, trendRes, historyRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/stats/${user.id}`),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/chart/trend/${user.id}`),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/manager/${user.id}`)
                ]);
                setStats(statsRes.data);
                setChartData(trendRes.data);
                setHistory(historyRes.data);
            } catch (err) {
                console.error('Error refreshing data after edit:', err);
            }
            alert('Lançamento atualizado!');
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao atualizar lançamento');
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) return <div className="text-center p-20 text-slate-400">Carregando painel...</div>;

    const monthlyProgress = stats.monthlyLimit > 0 
        ? Math.min((stats.monthlySpent / stats.monthlyLimit) * 100, 100) 
        : 0;

    const trendData = {
        labels: chartData.map(d => d.label),
        datasets: [{
            label: 'Gastos Mensais',
            data: chartData.map(d => d.value),
            fill: true,
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            borderColor: '#2563eb',
            tension: 0.4,
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#fff',
            pointHoverRadius: 6,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { color: '#64748b', font: { size: 11 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 11 } }
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-bold text-slate-900 pb-1">Olá, {user.name}</h2>
                <p className="text-sm text-slate-500 font-medium">Aqui está o resumo das suas despesas corporativas.</p>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CreditCard size={18} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gasto Mensal</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">R$ {stats.monthlySpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                        <div 
                            className={`h-full transition-all duration-500 ${monthlyProgress > 90 ? 'bg-red-500' : 'bg-blue-600'}`} 
                            style={{ width: `${monthlyProgress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] font-bold text-slate-500">{monthlyProgress.toFixed(1)}% do uso</span>
                        <span className="text-[10px] font-bold text-slate-500">Limite: R$ {stats.monthlyLimit.toLocaleString('pt-BR')}</span>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <AlertCircle size={18} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notas Pendentes</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-slate-900">{stats.pendingNF}</span>
                        <span className="text-[10px] text-amber-600 font-bold mb-1">Ação Requerida</span>
                    </div>
                    <Link to="/history" className="text-[10px] text-slate-400 mt-2 hover:text-blue-600 transition-colors inline-block">Clique para ver detalhes</Link>
                </div>

                <div className={`card border ${stats.pendingNF > 0 ? 'border-red-200 bg-red-50/30' : 'border-transparent'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${stats.pendingNF > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <PieChart size={18} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Financeiro</span>
                    </div>
                    {stats.pendingNF > 0 ? (
                        <>
                            <span className="text-2xl font-bold text-red-600">Atenção</span>
                            <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1">
                                <AlertCircle size={12} /> Faltam notas fiscais
                            </p>
                        </>
                    ) : (
                        <>
                            <span className="text-2xl font-bold text-slate-900">Conformidade</span>
                            <p className="text-[10px] text-emerald-600 font-bold mt-2">Documentação em dia</p>
                        </>
                    )}
                </div>

                <div className="card bg-blue-600 border-none text-white shadow-blue-200">
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-2">Novo Lançamento</p>
                    <Link to="/expenses" className="flex items-center justify-between group mt-4">
                        <span className="text-lg font-bold">Registrar Agora</span>
                        <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                            <PlusSquare size={20} />
                        </div>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart */}
                <div className="lg:col-span-2 card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tendência de Gastos</h3>
                    </div>
                    <div className="h-[300px]">
                        <Line data={trendData} options={chartOptions} />
                    </div>
                </div>

                {/* Recent Items */}
                <div className="card">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Últimos Lançamentos</h3>
                    <div className="space-y-4">
                        {history.slice(0, 5).map(item => (
                            <div key={item.id} onClick={() => openDetailModal(item)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.establishment}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(item.purchase_date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-sm font-bold text-slate-900">R$ {item.value?.toFixed(2) || '0,00'}</span>
                                    {item.status === 'Open' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedExpense({...item}); setIsEditModalOpen(true); }}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                        >
                                            <Edit3 size={10} /> EDITAR
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && <p className="text-xs text-slate-400 italic py-4">Nenhum lançamento recente.</p>}
                    </div>
                    <Link to="/history" className="block text-center w-full mt-6 py-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:bg-blue-50 rounded-lg transition-colors">Ver tudo</Link>
                </div>
                </div>

                {/* Edit Modal */}
                {isEditModalOpen && selectedExpense && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold">Editar Lançamento</h3>
                                    <p className="text-blue-100 text-xs">Ajuste as informações da sua despesa.</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Calendar size={12} className="text-blue-500" /> Data
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                            value={selectedExpense.purchase_date ? new Date(selectedExpense.purchase_date).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setSelectedExpense({...selectedExpense, purchase_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <span className="text-blue-500 font-bold">$</span> Valor Total
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                                            value={selectedExpense.value}
                                            onChange={(e) => setSelectedExpense({...selectedExpense, value: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <FileText size={12} className="text-blue-500" /> Estabelecimento
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                        value={selectedExpense.establishment}
                                        onChange={(e) => setSelectedExpense({...selectedExpense, establishment: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <CreditCard size={12} className="text-blue-500" /> Cartão (4 Dígitos)
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                            value={selectedExpense.card_last_four}
                                            onChange={(e) => setSelectedExpense({...selectedExpense, card_last_four: e.target.value})}
                                        >
                                            {cards.map(c => <option key={c.id} value={c.last_four}>**** {c.last_four}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <PlusSquare size={12} className="text-blue-500" /> Centro de Custo
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                            value={selectedExpense.cost_center}
                                            onChange={(e) => setSelectedExpense({...selectedExpense, cost_center: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                <p className="text-[10px] text-slate-400 italic">Nota: Para alterar o anexo da nota fiscal, exclua este lançamento e realize um novo (se o período permitir).</p>

                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all">Cancelar</button>
                                    <button type="submit" disabled={editLoading} className="flex-2 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
                                        {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Detail Modal */}
                <TransactionDetailModal 
                    isOpen={isDetailModalOpen} 
                    expense={selectedDetailExpense} 
                    onClose={() => setIsDetailModalOpen(false)} 
                />
            </div>
    );
};

const RoleBasedDashboard = () => {
    const { user } = useAuth();
    if (user?.role?.toUpperCase() === 'FINANCEIRO') {
        return <AdminPanel view="dashboard" />;
    }
    return <Dashboard />;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route 
                        path="/*" 
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Routes>
                                        <Route index element={<RoleBasedDashboard />} />
                                        <Route path="expenses" element={<ExpenseForm />} />
                                        <Route path="cards" element={<Cards />} />
                                        <Route 
                                            path="admin/invoices" 
                                            element={
                                                <ProtectedRoute allowedRoles={['FINANCEIRO']}>
                                                    <AdminPanel view="invoices" />
                                                </ProtectedRoute>
                                            } 
                                        />
                                        <Route 
                                            path="admin/cards" 
                                            element={
                                                <ProtectedRoute allowedRoles={['FINANCEIRO']}>
                                                    <AdminPanel view="cards" />
                                                </ProtectedRoute>
                                            } 
                                        />
                                        <Route 
                                            path="admin/logs" 
                                            element={
                                                <ProtectedRoute allowedRoles={['FINANCEIRO']}>
                                                    <AuditTrail />
                                                </ProtectedRoute>
                                            } 
                                        />
                                        <Route path="history" element={<ExpenseList />} />
                                        <Route path="*" element={<Navigate to="/" />} />
                                    </Routes>
                                </MainLayout>
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
