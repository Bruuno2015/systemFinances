import React, { useState } from 'react';
import axios from 'axios';
import { X, CheckCircle, AlertTriangle, Ghost, FileCheck, Layers, CreditCard, ChevronRight, UploadCloud, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ReconciliationModal = ({ isOpen, onClose, onReconciled }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setReport(null);

        const formData = new FormData();
        formData.append('invoice', file);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/invoices/reconcile`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setReport(response.data);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Erro ao processar fatura via IA.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReconciliation = async () => {
        if (!report || !report.reconciled.length) return;
        setBulkLoading(true);
        
        const updates = report.reconciled.map(tx => ({
            id: tx.systemId,
            status: tx.suggestedStatus || 'Paid'
        }));

        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/bulk-dynamic-status`, {
                updates
            });
            toast.success(`${updates.length} despesas foram conciliadas com sucesso!`);
            onReconciled(); // Refresh parent data
            onClose();
        } catch (error) {
            toast.error('Falha ao confirmar conciliação no lote.');
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className={`bg-white rounded-[2rem] w-full max-w-6xl shadow-2xl transition-all duration-500 flex flex-col ${report ? 'h-[90vh]' : 'h-auto'} overflow-hidden relative`}>
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Layers size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Motor de Conciliação Autônoma (IA)</h2>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">Cruzamento inteligente de faturas bancárias.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-8">
                    
                    {/* Step 1: Upload Zone (Hidden if report exists) */}
                    {!report && !loading && (
                        <div className="max-w-2xl mx-auto py-12">
                            <label className="flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-indigo-200 rounded-3xl bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer group">
                                <div className="w-20 h-20 rounded-full bg-white shadow-xl shadow-indigo-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <UploadCloud size={32} className="text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">Importar Fatura Bancária</h3>
                                <p className="text-sm text-slate-500 font-medium mb-6 px-12 text-center">Faça o upload do PDF ou Imagem da Fatura original do cartão de crédito. A Inteligência Artificial fará a leitura e o cruzamento automático.</p>
                                <span className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md">
                                    {file ? file.name : 'Selecionar Arquivo'}
                                </span>
                                <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                            </label>
                            
                            <div className="mt-8 flex justify-center">
                                <button 
                                    onClick={handleUpload} 
                                    disabled={!file}
                                    className="px-8 py-4 bg-slate-900 text-white font-black text-lg rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-3"
                                >
                                    Puxar Extrato e Analisar <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Loading State */}
                    {loading && (
                        <div className="flex flex-col justify-center items-center h-full py-20 animate-in fade-in duration-500">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-indigo-100"></div>
                                <div className="w-24 h-24 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
                                <Layers size={32} className="text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mt-8">Lendo Fatura Bancária...</h3>
                            <p className="text-slate-500 font-medium mt-2 max-w-sm text-center">A IA do Gemini está extraindo as transações e aplicando *Fuzzy Matching* bilionário nas suas despesas.</p>
                        </div>
                    )}

                    {/* Step 3: Reconciliation Report */}
                    {report && !loading && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                            
                            {/* Diagnostic Hero */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white border border-emerald-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center group">
                                    <div className="absolute top-0 w-full h-2 bg-emerald-500"></div>
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                                        <CheckCircle size={28} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Match Perfeito</p>
                                    <h4 className="text-4xl font-black text-slate-800">{report.reconciled.length}</h4>
                                    <p className="text-[11px] font-bold text-emerald-600 mt-2 bg-emerald-50 px-3 py-1 rounded-full">Pronto para fechar</p>
                                </div>

                                <div className="bg-white border border-rose-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center group">
                                    <div className="absolute top-0 w-full h-2 bg-rose-500"></div>
                                    <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 group-hover:scale-110 transition-transform">
                                        <Ghost size={28} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Gastos Fantasmas</p>
                                    <h4 className="text-4xl font-black text-slate-800">{report.ghosts.length}</h4>
                                    <p className="text-[11px] font-bold text-rose-600 mt-2 bg-rose-50 px-3 py-1 rounded-full">Faturado mas não declarado</p>
                                </div>

                                <div className="bg-white border border-amber-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-center items-center text-center group">
                                    <div className="absolute top-0 w-full h-2 bg-amber-500"></div>
                                    <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                                        <AlertTriangle size={28} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Despesas Órfãs</p>
                                    <h4 className="text-4xl font-black text-slate-800">{report.orphans.length}</h4>
                                    <p className="text-[11px] font-bold text-amber-600 mt-2 bg-amber-50 px-3 py-1 rounded-full">Declarado mas não faturou</p>
                                </div>
                            </div>

                            {/* Tables Container */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                
                                {/* Matched Section */}
                                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col h-[500px]">
                                    <div className="p-6 border-b border-slate-100 bg-emerald-50/50 flex items-center gap-3 shrink-0">
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={20} /></div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">Transações Sincronizadas</h3>
                                            <p className="text-xs font-medium text-slate-500">Batem perfeitamente em Data, Valor e Estabelecimento.</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto w-full p-2">
                                        {report.reconciled.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                Nenhum match encontrado.
                                            </div>
                                        ) : (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local (Banco vs Sis)</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {report.reconciled.map((tx, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-4 text-xs font-bold text-slate-600 whitespace-nowrap">
                                                                {new Date(tx.purchaseDate).toLocaleDateString('pt-BR')}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{tx.bankEstablishment}</div>
                                                                <div className="text-[10px] text-emerald-600 font-medium truncate max-w-[200px]">Sis: {tx.systemEstablishment}</div>
                                                            </td>
                                                            <td className="px-4 py-4 text-right">
                                                                <span className="text-sm font-black text-slate-800">R$ {tx.bankValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>

                                {/* Divergences Section (Ghosts & Orphans) */}
                                <div className="flex flex-col gap-6 h-[500px]">
                                    
                                    {/* Ghosts */}
                                    <div className="bg-white border border-rose-100 rounded-[1.5rem] overflow-hidden flex flex-col flex-1">
                                        <div className="px-5 py-4 border-b border-rose-50 bg-rose-50/50 flex items-center gap-3 shrink-0">
                                            <Ghost size={18} className="text-rose-600" />
                                            <h3 className="text-sm font-bold text-rose-900">Fantasmas (Na Fatura, Não no App)</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto w-full">
                                            {report.ghosts.length === 0 ? (
                                                <div className="flex items-center justify-center h-full text-[11px] font-bold uppercase tracking-widest text-emerald-500">
                                                    Limpo
                                                </div>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <tbody className="divide-y divide-rose-50">
                                                        {report.ghosts.map((tx, idx) => (
                                                            <tr key={idx} className="hover:bg-rose-50/30">
                                                                <td className="px-4 py-3 text-[11px] font-medium text-slate-500">{new Date(tx.purchase_date).toLocaleDateString('pt-BR')}</td>
                                                                <td className="px-4 py-3 text-xs font-bold text-rose-800 truncate max-w-[150px]">{tx.establishment}</td>
                                                                <td className="px-4 py-3 text-xs font-black text-slate-700 text-right">R$ {tx.value.toLocaleString('pt-BR', { minimumFractionDigits:2 })}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    {/* Orphans */}
                                    <div className="bg-white border border-amber-100 rounded-[1.5rem] overflow-hidden flex flex-col flex-1">
                                        <div className="px-5 py-4 border-b border-amber-50 bg-amber-50/50 flex items-center gap-3 shrink-0">
                                            <AlertTriangle size={18} className="text-amber-600" />
                                            <h3 className="text-sm font-bold text-amber-900">Órfãs (No App, Não na Fatura)</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto w-full">
                                             {report.orphans.length === 0 ? (
                                                <div className="flex items-center justify-center h-full text-[11px] font-bold uppercase tracking-widest text-emerald-500">
                                                    Limpo
                                                </div>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <tbody className="divide-y divide-amber-50">
                                                        {report.orphans.map((tx, idx) => (
                                                            <tr key={idx} className="hover:bg-amber-50/30">
                                                                <td className="px-4 py-3 text-[11px] font-medium text-slate-500">{new Date(tx.purchase_date).toLocaleDateString('pt-BR')}</td>
                                                                <td className="px-4 py-3 text-xs font-bold text-amber-800 truncate max-w-[150px]">{tx.establishment}</td>
                                                                <td className="px-4 py-3 text-xs font-black text-slate-700 text-right">R$ {tx.value.toLocaleString('pt-BR', { minimumFractionDigits:2 })}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                {report && (
                    <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                            <CreditCard size={18} /> Conciliação gerada via Inteligência Artificial
                        </div>
                        <button 
                            onClick={handleConfirmReconciliation}
                            disabled={bulkLoading || report.reconciled.length === 0}
                            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[13px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-200 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                        >
                            {bulkLoading ? <Loader2 size={18} className="animate-spin" /> : <FileCheck size={18} />}
                            {bulkLoading ? 'Aprovando Lote...' : `Concluir ${report.reconciled.length} Match(es)`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReconciliationModal;
