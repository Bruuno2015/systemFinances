import React, { useRef, useState } from 'react';
import { X, Shield, FileText, Eye, AlertTriangle, UploadCloud, Trash2, Unlock, Clock, Sparkles, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TransactionDetailModal = ({ isOpen, expense, onClose, isSystemMonthClosed }) => {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !expense) return null;

    // Installment Regex Matcher (e.g. "(1/3)")
    const installmentMatch = expense.establishment?.match(/\((\d+)\/(\d+)\)$/);
    let installmentText = null;
    let displayValue = expense.value;
    
    if (installmentMatch) {
        const totalInstallments = parseInt(installmentMatch[2]);
        const calculatedTotal = expense.value * totalInstallments;
        displayValue = calculatedTotal;
        installmentText = `${totalInstallments}x de R$ ${expense.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    const isLockedByMonth = isSystemMonthClosed && !expense.admin_unlocked;
    const isStatusEditable = ['Open', 'Paid'].includes(expense.status);
    const canEdit = expense.admin_unlocked || (!isLockedByMonth && isStatusEditable);
    const isAdmin = user?.role?.toUpperCase() === 'FINANCEIRO' || user?.role?.toUpperCase() === 'ADMIN';

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('nf', file);

        setIsProcessing(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/${expense.id}/attach-nf`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Arquivo anexado com sucesso!');
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao anexar arquivo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir permanentemente este lançamento?')) return;
        setIsProcessing(true);
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/${expense.id}`);
            toast.success('Lançamento excluído!');
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Erro ao deletar lançamento.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRequestUnlock = async () => {
        setIsProcessing(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/${expense.id}/unlock-request`);
            toast.success('Solicitação de edição enviada ao Administrador.');
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao solicitar liberação.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Detalhes do Lançamento</h3>
                        <p className="text-xs text-slate-400 font-medium">ID: #EXP-{expense.id.toString().padStart(4, '0')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</p>
                                <p className="font-bold text-slate-700">{new Date(expense.purchase_date).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</p>
                                <p className="text-xl font-black text-blue-600">R$ {displayValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                {installmentText && (
                                    <p className="text-[10px] font-bold text-slate-500 mt-1">
                                        {installmentText}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estabelecimento</p>
                                <p className="font-bold text-slate-700">{expense.establishment}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cartão (4 dígitos)</p>
                                <div className="flex items-center gap-2 font-mono font-bold text-slate-600">
                                    <Shield size={14} className="text-blue-500" /> **** {expense.card_last_four}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Responsabilidades</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500">Gestor Responsável</span>
                                    <span className="text-sm font-bold text-slate-700">{expense.managerName || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500">Setor</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">{expense.department || expense.userDepartment || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500">Comprador</span>
                                    <span className="text-sm font-bold text-slate-700">{expense.purchaser_name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500">Centro de Custo</span>
                                    <span className="text-sm font-bold text-slate-700">{expense.cost_center || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500">Auditoria IA</span>
                                    {expense.ai_score !== null && expense.ai_score !== undefined ? (
                                        <span title={expense.ai_analysis} className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase flex items-center gap-1 cursor-help border ${expense.ai_score >= 95 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : expense.ai_score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                            <Sparkles size={12} /> {expense.ai_score}% CONFIANÇA
                                        </span>
                                    ) : (
                                        <span className="text-sm font-bold text-slate-400">Pendente</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-500">Auditoria Conciliação</span>
                                    {expense.bank_reconciled ? (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                            <CheckCircle size={12} /> BANCÁRIO OK
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                            <Clock size={12} /> AGUARDANDO BANCO
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} className="text-blue-500" /> Comprovante / NF
                        </h4>
                        {expense.nf_attachment_path ? (
                            <div className="aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative group">
                                <iframe 
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/${expense.nf_attachment_path}`} 
                                    className="w-full h-full border-none"
                                    title="Nota Fiscal"
                                ></iframe>
                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a 
                                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/${expense.nf_attachment_path}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="w-full py-3 bg-white text-slate-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl mb-2"
                                    >
                                        <Eye size={16} /> Ver em Tela Cheia
                                    </a>
                                    {canEdit && (
                                        <>
                                            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf,image/*" />
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isProcessing}
                                                className="w-full py-3 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition"
                                            >
                                                <UploadCloud size={16} /> Substituir Anexo
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[3/4] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-6">
                                <AlertTriangle size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">NF não anexada</p>
                                <p className="text-[10px] mt-1 text-center">Este lançamento exige regularização.</p>
                                {canEdit && (
                                    <>
                                        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf,image/*" />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isProcessing}
                                            className="mt-6 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition"
                                        >
                                            <UploadCloud size={16} /> Anexar Documento
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Actions Matrix */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            {/* REJECT Button for Admin override (Special Request) */}
                            {isAdmin && expense.status !== 'Rejected' && (
                                <button 
                                    onClick={async () => {
                                        if (!window.confirm('Deseja REJEITAR este lançamento e estornar o processo?')) return;
                                        setIsProcessing(true);
                                        try {
                                            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses/bulk-status`, { 
                                                ids: [expense.id], 
                                                status: 'Rejected' 
                                            });
                                            toast.success('Lançamento Rejeitado.');
                                            window.location.reload();
                                        } catch (e) {
                                            toast.error('Erro ao rejeitar.');
                                        } finally { setIsProcessing(false); }
                                    }}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-rose-50 text-rose-600 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 transition border border-rose-200"
                                >
                                    <AlertTriangle size={16} /> Rejeitar (Estorno/Erro)
                                </button>
                            )}

                            {canEdit ? (
                                <button 
                                    onClick={handleDelete}
                                    disabled={isProcessing}
                                    className="w-full py-3 bg-red-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition shadow-lg shadow-red-200"
                                >
                                    <Trash2 size={16} /> Excluir Lançamento
                                </button>
                            ) : (
                                isSystemMonthClosed && !expense.admin_unlocked && (
                                    expense.unlock_requested ? (
                                        <div className="w-full py-3 bg-amber-50 text-amber-600 font-bold text-sm rounded-xl flex items-center justify-center gap-2 border border-amber-200 cursor-not-allowed">
                                            <Clock size={16} /> Edição Solicitada (Aguardando)
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleRequestUnlock}
                                            disabled={isProcessing}
                                            className="w-full py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition border border-slate-200"
                                            title="O mês está fechado. Solicite ao administrador a liberação para anexar ou excluir."
                                        >
                                            <Unlock size={16} /> Solicitar Liberação para Edição
                                        </button>
                                    )
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;
