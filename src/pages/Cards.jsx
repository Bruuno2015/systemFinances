import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Cards = () => {
    const { user } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                // Fetch cards for the user's department
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/cards?department=${user.department}`);
                setCards(response.data);
            } catch (err) {
                console.error('Error fetching cards:', err);
            } finally {
                setLoading(false);
            }
        };
        if (user?.department) fetchCards();
        else setLoading(false);
    }, [user]);

    if (loading) return <div className="p-10 text-center text-slate-400">Carregando cartões...</div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h2 className="text-3xl font-bold text-slate-900 pb-1">Cartões Corporativos</h2>
                <div className="flex gap-2 items-center mt-1">
                    <p className="text-sm text-slate-500 font-medium">Setor:</p>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">{user?.department}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cards.map(card => (
                    <div key={card.id} className="group relative overflow-hidden bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-1 transition-all duration-300">
                        {/* Glassmorphic Card Background */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
                        
                        <div className="flex justify-between items-start mb-12">
                            <div className={`p-3 rounded-2xl ${card.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                <CreditCard size={24} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${card.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                {card.status === 'Active' ? 'Ativo' : 'Bloqueado'}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Número do Cartão</p>
                            <h3 className="text-2xl font-bold text-slate-800 tracking-wider">
                                <span className="opacity-20">•••• •••• ••••</span> {card.last_four}
                            </h3>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <div className="flex items-center gap-2">
                                <Shield size={12} className="text-blue-500" />
                                <span>Seguro Corporativo 24h</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                <span>Frequência VIP</span>
                            </div>
                        </div>
                    </div>
                ))}

                {cards.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">Nenhum cartão vinculado ao seu setor.</p>
                        <p className="text-xs mt-1">Entre em contato com o Financeiro se houver erro.</p>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 rounded-[2rem] p-8 border border-blue-100 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="space-y-2">
                    <h4 className="text-blue-900 font-bold">Instruções de Uso</h4>
                    <p className="text-sm text-blue-700/70 font-medium max-w-xl">
                        Estes cartões são para uso exclusivo em compras corporativas do seu setor. Lembre-se de sempre solicitar a Nota Fiscal e realizar o lançamento no sistema imediatamente após a compra.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white text-blue-600 font-bold text-xs rounded-xl shadow-sm cursor-help hover:shadow-md transition-all">Manual do Cartão</div>
                    <div className="px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-200 cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all">Solicitar Novo</div>
                </div>
            </div>
        </div>
    );
};

export default Cards;
