import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  PointElement,
  LineElement
);

const AnalyticalCharts = ({ costCenterData, trendData }) => {
    const costCenterChartData = {
        labels: costCenterData.map(d => d.label),
        datasets: [{
            label: 'Gastos por Centro de Custo',
            data: costCenterData.map(d => d.value),
            backgroundColor: [
                'rgba(37, 99, 235, 0.7)',
                'rgba(56, 189, 248, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(239, 68, 68, 0.7)',
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
        }],
    };

    const trendChartData = {
        labels: trendData.map(d => d.label),
        datasets: [{
            label: 'Tendência Mensal',
            data: trendData.map(d => d.value),
            fill: true,
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderColor: '#2563eb',
            tension: 0.4,
            pointBackgroundColor: '#2563eb',
        }],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                labels: { color: '#64748b' }
            },
        },
        scales: {
            y: {
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(0, 0, 0, 0.05)' }
            },
            x: {
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(0, 0, 0, 0.05)' }
            }
        }
    };

    const DoughnutOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#64748b', font: { size: 11, weight: 'bold' }, padding: 20 }
            }
        },
        cutout: '70%'
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
            <div className="card">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Distribuição por Custo</h3>
                <div className="h-[300px] flex items-center justify-center">
                    <Doughnut data={costCenterChartData} options={DoughnutOptions} />
                </div>
            </div>
            <div className="card">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Tendência de Gastos</h3>
                <div className="h-[300px]">
                    <Line data={trendChartData} options={options} />
                </div>
            </div>
        </div>
    );
};

export default AnalyticalCharts;
