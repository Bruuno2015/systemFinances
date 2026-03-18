import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, FileText, CreditCard, Upload, PlusSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ExpenseForm = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        purchaseDate: '',
        establishment: '',
        value: '',
        installments: 1,
        cardLastFour: '',
        costCenter: '',
        purchaserName: '',
        responsible: user?.name || '',
        nf: null
    });
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isMonthClosed, setIsMonthClosed] = useState(false);

    useEffect(() => {
        const fetchSystemStatusAndCards = async () => {
            try {
                // Fetch System Config (Check if Month is Closed)
                const configResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/system/config`);
                setIsMonthClosed(configResponse.data.status === 'Closed');

                // Fetch cards filtered by user department (if any)
                const deptParam = user?.department ? `?department=${encodeURIComponent(user.department)}` : '';
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/cards${deptParam}`);
                setCards(response.data.filter(c => c.status === 'Active'));
            } catch (err) {
                console.error('Error fetching requirements:', err);
            }
        };
        fetchSystemStatusAndCards();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isMonthClosed) {
            alert('Não é possível realizar lançamentos. O mês financeiro atual está fechado.');
            return;
        }

        setLoading(true);
        
        try {
            const data = new FormData();
            data.append('user_id', user.id);
            data.append('purchase_date', formData.purchaseDate);
            data.append('establishment', formData.establishment);
            data.append('value', formData.value);
            data.append('installments', formData.installments);
            data.append('card_last_four', formData.cardLastFour);
            data.append('cost_center', formData.costCenter);
            data.append('responsible', formData.responsible);
            data.append('purchaser_name', formData.purchaserName);
            data.append('department', user.department); // Fixed from user
            if (formData.nf) data.append('nf', formData.nf);

            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/expenses`, data);
            setSuccess(true);
            setFormData({
                purchaseDate: '',
                establishment: '',
                value: '',
                installments: 1,
                cardLastFour: '',
                costCenter: '',
                purchaserName: '',
                responsible: user?.name || '',
                nf: null
            });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving expense:', err);
            alert('Erro ao salvar despesa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900 pb-1">Registrar Despesa</h2>
                <div className="flex gap-2 items-center mt-1">
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Setor Responsável:</p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">{user?.department}</span>
                </div>
            </header>

            <div className="card shadow-2xl shadow-blue-100/20">
                {isMonthClosed ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center font-bold text-3xl">🔒</div>
                        <div>
                            <h3 className="text-xl font-bold mb-1">Mês Financeiro Fechado</h3>
                            <p className="text-sm">Não é possível realizar novos lançamentos no momento. Aguarde a abertura pelo Administrador.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {success && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in-95">
                                <span className="font-bold">Despesa registrada com sucesso!</span>
                            </div>
                        )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1 */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar size={14} className="text-blue-500" /> Data da Compra
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FileText size={14} className="text-blue-500" /> Estabelecimento
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Amazon Brasil"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={formData.establishment}
                                    onChange={(e) => setFormData({...formData, establishment: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User size={14} className="text-blue-500" /> Responsável pela Compra
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nome de quem realizou a compra"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={formData.purchaserName}
                                    onChange={(e) => setFormData({...formData, purchaserName: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <CreditCard size={14} className="text-blue-500" /> Cartão Corporativo
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 cursor-pointer"
                                    value={formData.cardLastFour}
                                    onChange={(e) => setFormData({...formData, cardLastFour: e.target.value})}
                                >
                                    <option value="">Selecione um cartão de {user?.department}</option>
                                    {cards.map(card => (
                                        <option key={card.id} value={card.last_four}>
                                            **** **** **** {card.last_four}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 font-medium ml-1">Exibindo apenas cartões do setor {user?.department}.</p>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="space-y-2 flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <span className="text-blue-500 font-bold">$</span> Valor Total
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm">R$</div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0,00"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                            value={formData.value}
                                            onChange={(e) => setFormData({...formData, value: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 w-32">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <span className="text-blue-500 font-bold">x</span> Parcelas
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="48"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 text-center"
                                        value={formData.installments}
                                        onChange={(e) => setFormData({...formData, installments: parseInt(e.target.value) || ''})}
                                    />
                                </div>
                            </div>
                            {formData.installments > 1 && formData.value && (
                                <p className="text-[10px] text-blue-600 font-bold ml-1 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                                    Serão lançadas {formData.installments} parcelas de R$ {(parseFloat(formData.value) / formData.installments).toFixed(2).replace('.', ',')} nos próximos meses.
                                </p>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 border-2 border-blue-500 rounded-sm"></div> Centro de Custo
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Operações / Produção"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                                    value={formData.costCenter}
                                    onChange={(e) => setFormData({...formData, costCenter: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Upload size={14} className="text-blue-500" /> Nota Fiscal (Upload)
                                </label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 group hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        id="nf-upload"
                                        className="hidden"
                                        onChange={(e) => setFormData({...formData, nf: e.target.files[0]})}
                                    />
                                    <label htmlFor="nf-upload" className="flex flex-col items-center gap-2 cursor-pointer w-full text-slate-400 group-hover:text-blue-600 transition-colors">
                                        <Upload className="opacity-50 group-hover:opacity-100" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            {formData.nf ? formData.nf.name : 'Clique para selecionar PDF/Imagem'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <><PlusSquare size={20} /> Finalizar Lançamento</>
                            )}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </div>
    );
};

export default ExpenseForm;
