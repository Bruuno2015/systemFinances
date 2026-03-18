import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Search, Shield, Info, User, Terminal, Globe, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLog, setExpandedLog] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [auditPassword, setAuditPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            if (!isAuthenticated) return;
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/logs`);
                setLogs(response.data);
                setFilteredLogs(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching logs:', err);
                setFetchError(err.response?.data?.details || err.message || 'Erro ao carregar logs.');
                setLoading(false);
            }
        };
        fetchLogs();
    }, [isAuthenticated]);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = logs.filter(log => 
            (log.action_type || '').toLowerCase().includes(lowerTerm) ||
            (log.entity_type || '').toLowerCase().includes(lowerTerm) ||
            (log.user_name || '').toLowerCase().includes(lowerTerm) ||
            (log.ip_address || '').includes(searchTerm)
        );
        setFilteredLogs(filtered);
    }, [searchTerm, logs]);

    const getActionColor = (type) => {
        switch (type) {
            case 'CREATE': return 'bg-success/10 text-success border-success/20';
            case 'UPDATE': return 'bg-primary/10 text-primary border-primary/20';
            case 'DELETE': return 'bg-danger/10 text-danger border-danger/20';
            case 'SECURITY_ALERT': return 'bg-warning/10 text-warning border-warning/20';
            case 'LOGIN': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAuthError('');
        setFetchError('');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/system/verify-audit`, { password: auditPassword });
            setIsAuthenticated(true);
        } catch (error) {
            setAuthError('Senha incorreta. Acesso Negado.');
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in zoom-in-95">
                <form onSubmit={handleAuth} className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full space-y-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 border border-blue-100">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Área Restrita</h2>
                        <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mt-2">Logs de Auditoria do Sistema</p>
                    </div>
                    {authError && <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{authError}</div>}
                    <div className="space-y-4">
                        <input 
                            type="password" 
                            value={auditPassword}
                            onChange={(e) => setAuditPassword(e.target.value)}
                            placeholder="Insira a Senha Master" 
                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono tracking-widest text-slate-800"
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={loading || !auditPassword}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Verificando...' : 'Acessar Registros'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (loading) return <div className="p-10 text-center">Carregando trilha de auditoria...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-border pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-text-main pb-1 flex items-center gap-3">
                        <Shield className="text-blue-600" size={32} /> Audit Trail & Compliance
                    </h2>
                    <p className="text-sm text-text-muted italic">Monitoramento imutável de atividades do sistema (TISAX / LGPD / ISO 27001).</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por ação, usuário ou IP..." 
                        className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-80 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data / Hora</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ação</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entidade</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map(log => (
                                <React.Fragment key={log.id}>
                                    <tr className={`hover:bg-slate-50/80 transition-colors ${expandedLog === log.id ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{new Date(log.created_at).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">{log.user_name || 'Sistema / Anon'}</span>
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <Globe size={10} /> {log.ip_address || '0.0.0.0'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-wider uppercase ${getActionColor(log.action_type)}`}>
                                                {log.action_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                                className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                                            >
                                                {expandedLog === log.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedLog === log.id && (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-6 bg-slate-50/50 border-x border-slate-100">
                                                <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-blue-400 shadow-inner overflow-x-auto max-w-[calc(100vw-400px)]">
                                                    <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-slate-800 pb-2">
                                                        <Terminal size={14} /> Detailed Audit Context
                                                    </div>
                                                    <pre>{JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}</pre>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {filteredLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                        {fetchError ? (
                                            <div className="text-red-500 font-bold bg-red-50 p-4 rounded-2xl border border-red-100 max-w-md mx-auto">
                                                <p>Erro na Conexão:</p>
                                                <p className="text-[10px] mt-1 font-mono uppercase tracking-tighter opacity-70">{fetchError}</p>
                                            </div>
                                        ) : 'Nenhum registro de auditoria encontrado.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700">
                <Info size={18} />
                <p className="text-[11px] font-medium leading-relaxed">
                    <strong>Certificação de Conformidade:</strong> Todos os registros acima são criptografados em repouso e protegidos contra deleção por chaves de integridade do servidor. 
                    Este log atende plenamente aos requisitos da LGPD Art. 37 e VDA TISAX Controls Group 4.1.
                </p>
            </div>
        </div>
    );
};

export default AuditTrail;
