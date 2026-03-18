import React, { useState } from 'react';
import axios from 'axios';
import { X, Sparkles, AlertCircle, CheckCircle, FileX, LoaderCircle } from 'lucide-react';

const NfReconciliationModal = ({ isOpen, onClose, onRefreshData }) => {
    const [status, setStatus] = useState('idle'); // idle, scanning, complete, error
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    const runReconciliation = async () => {
        setStatus('scanning');
        setError('');
        try {
            const apiRes = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/reconciliation/run`);
            setResults(apiRes.data.results);
            setStatus('complete');
            if (onRefreshData) onRefreshData();
        } catch (err) {
            console.error('Erro na conciliação:', err);
            setError(err.response?.data?.error || 'Ocorreu um erro ao comunicar com a inteligência artificial.');
            setStatus('error');
        }
    };

    const handleClose = () => {
        setStatus('idle');
        setResults(null);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl shadow-indigo-500/10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                            <Sparkles size={24} className="text-blue-100" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg tracking-tight">Auditoria de Notas (IA)</h3>
                            <p className="text-xs text-indigo-100 font-medium">Motor Visual - v1.5</p>
                        </div>
                    </div>
                    {status !== 'scanning' && (
                        <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-8">
                    {status === 'idle' && (
                        <div className="text-center space-y-6">
                            <div className="mx-auto w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-indigo-50/50 dark:ring-indigo-500/5">
                                <Sparkles size={40} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Pronto para auditar notas</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    O VexFinance analisará fisicamente todos os recibos/NFs em anexo dos lançamentos pendentes, cruzando Valores, CNPJ e Datas para gerar aprovações automáticas.
                                </p>
                            </div>
                            <button 
                                onClick={runReconciliation}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2 uppercase text-sm"
                            >
                                <Sparkles size={18} /> Iniciar Varredura de Anexos
                            </button>
                        </div>
                    )}

                    {status === 'scanning' && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative">
                                <LoaderCircle size={64} className="text-indigo-600 dark:text-indigo-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={24} className="text-indigo-400 dark:text-indigo-300 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Analisando Documentos...</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 tracking-wider uppercase font-bold animate-pulse">
                                    Lendo OCR & Cruzando Dados
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'complete' && results && (
                        <div className="space-y-6 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Resultado da Auditoria</h4>
                                <span className="text-3xl font-black text-slate-800 dark:text-white">{results.processed} / {results.total}</span>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">Notas processadas com sucesso</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg"><CheckCircle size={16} /></div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Auto-Aprovadas (95%+)</span>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{results.approved}</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg"><AlertCircle size={16} /></div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Para Revisão Manual</span>
                                    </div>
                                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{results.review}</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg"><FileX size={16} /></div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Discrepâncias / Fraudes</span>
                                    </div>
                                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{results.discrepancy}</span>
                                </div>
                            </div>

                            <button onClick={handleClose} className="w-full mt-2 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-colors">
                                Fechar e Atualizar Painel
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-6">
                            <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Falha na Auditoria</h4>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">{error}</p>
                            <button onClick={handleClose} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-colors">
                                Voltar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NfReconciliationModal;
