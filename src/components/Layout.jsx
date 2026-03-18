import React from 'react';
import { LayoutDashboard, FileText, CreditCard, ShieldCheck, LogOut, History, PieChart, Bell, List, Sun, Moon, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={onClose}
                />
            )}
            
            <aside className={`fixed lg:sticky top-0 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 lg:p-8 flex items-center justify-between">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-blue-600 dark:text-blue-500 tracking-tight">
                        <div className="p-1.5 bg-blue-600 dark:bg-blue-500 rounded-lg text-white">
                            <PieChart size={20} />
                        </div>
                        FinControl
                    </h1>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Principal</p>
                    <NavLink to="/" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                        <LayoutDashboard size={18} /> Dashboard
                    </NavLink>
                    {user?.role?.toUpperCase() !== 'FINANCEIRO' && (
                        <NavLink to="/expenses" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                            <FileText size={18} /> Novo Lançamento
                        </NavLink>
                    )}
                    <NavLink to="/history" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                        <List size={18} /> Consultar Histórico
                    </NavLink>
                    
                    {(user?.role?.toUpperCase() === 'FINANCEIRO' || user?.role?.toUpperCase() === 'GESTOR') && (
                        <>
                            <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-6 mb-2">Recursos</p>
                            <NavLink to={user?.role?.toUpperCase() === 'FINANCEIRO' ? "/admin/cards" : "/cards"} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                <CreditCard size={18} /> {user?.role?.toUpperCase() === 'FINANCEIRO' ? 'Cartões e gestores' : 'Cartões'}
                            </NavLink>
                        </>
                    )}

                    {user?.role?.toUpperCase() === 'FINANCEIRO' && (
                        <>
                            <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-6 mb-2">Administração</p>
                            <NavLink to="/admin/invoices" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                <ShieldCheck size={18} /> Painel Financeiro
                            </NavLink>
                            <NavLink to="/admin/logs" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                <History size={18} /> Logs de Auditoria
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                    <button 
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 font-medium text-sm transition-all"
                    >
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </aside>
        </>
    );
};

const Header = ({ onMenuClick }) => {
    const { user, theme, toggleTheme } = useAuth();

    return (
        <header className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                    <Menu size={24} />
                </button>
                <div className="text-sm font-medium text-slate-400 dark:text-slate-500 hidden sm:block">
                    Acesso: <span className="text-slate-900 dark:text-white font-bold">{user?.role}</span>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{user?.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-100 ring-2 ring-white">
                        {user?.name?.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
};

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 w-full overflow-x-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="p-4 lg:p-8 max-w-[1400px] w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
