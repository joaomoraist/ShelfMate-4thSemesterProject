import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import { API_URLS } from '../config/api';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  className?: string;
}

const BarChart: React.FC<BarChartProps> = ({ className }) => {
  const [chartData, setChartData] = useState<ChartData<'bar'>>({
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
        
        // Preparar dados para o gráfico - mostrar os top 6 produtos
        const topProducts = (data.rows || []).slice(0, 6);
        const labels = topProducts.map((item: any) => item.name);
        const values = topProducts.map((item: any) => item.total_qntd);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Quantidade Vendida',
              data: values,
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
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
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Vendas por Produto',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantidade Vendida'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Produtos'
        }
      }
    },
  };

  if (loading) return <div>Carregando dados...</div>;
  if (error) return <div>Erro ao carregar dados: {error}</div>;

  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default BarChart;
