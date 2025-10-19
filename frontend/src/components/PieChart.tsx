import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import { API_URLS } from '../config/api';

// Registrar componentes do Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface PieChartProps {
  className?: string;
}

const PieChart: React.FC<PieChartProps> = ({ className }) => {
  const [chartData, setChartData] = useState<ChartData<'pie'>>({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Buscar dados de vendas por produto
        const response = await fetch(API_URLS.SALES_PER_PRODUCT);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro na resposta:', errorData);
          throw new Error('Falha ao buscar dados de vendas');
        }

        const data = await response.json();
        
        // Preparar dados para o gráfico
        const labels = (data.rows || []).slice(0, 5).map((item: any) => item.name);
        const values = (data.rows || []).slice(0, 5).map((item: any) => item.total_qntd);

        // Gerar cores aleatórias para cada fatia
        const backgroundColors = [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ];

        setChartData({
          labels,
          datasets: [
            {
              label: 'Vendas',
              data: values,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
              borderWidth: 1,
            }
          ]
        });
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Distribuição de Vendas',
      },
    },
  };

  if (loading) return <div>Carregando dados...</div>;
  if (error) return <div>Erro ao carregar dados: {error}</div>;

  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <Pie options={options} data={chartData} />
    </div>
  );
};

export default PieChart;