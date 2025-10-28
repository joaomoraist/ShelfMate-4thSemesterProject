import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({ className }) => {
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Buscar dados de produtos para mostrar evolução do estoque
        const stored = localStorage.getItem('user');
        const companyId = stored ? (JSON.parse(stored)?.company_id) : undefined;
        const url = companyId ? `${API_URLS.STATS_PRODUCTS}?companyId=${companyId}` : API_URLS.STATS_PRODUCTS;
        const response = await fetch(url, { credentials: 'include' });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro na resposta:', errorData);
          throw new Error('Falha ao buscar dados de produtos');
        }

        const data = await response.json();
        
        // Preparar dados para o gráfico - mostrar os produtos com maior estoque
        const sortedProducts = (data.rows || [])
          .sort((a: any, b: any) => b.inventory - a.inventory)
          .slice(0, 6);
        
        const labels = sortedProducts.map((item: any) => item.name);
        const inventoryValues = sortedProducts.map((item: any) => item.inventory);
        const stockValues = sortedProducts.map((item: any) => item.inventory * item.unit_price);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Quantidade em Estoque',
              data: inventoryValues,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.3,
              yAxisID: 'y',
            },
            {
              label: 'Valor do Estoque (R$)',
              data: stockValues,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              tension: 0.3,
              yAxisID: 'y1',
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
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Produtos'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Quantidade'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Valor (R$)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolução do Estoque por Produto',
      },
    },
  };

  if (loading) return <div>Carregando dados...</div>;
  if (error) return <div>Erro ao carregar dados: {error}</div>;

  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <Line options={options} data={chartData} />
    </div>
  );
};

export default LineChart;