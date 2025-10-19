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
        // Buscar dados de vendas por produto
        const response = await fetch(API_URLS.SALES_PER_PRODUCT);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro na resposta:', errorData);
          throw new Error('Falha ao buscar dados de vendas');
        }

        const data = await response.json();
        
        // Preparar dados para o gráfico
        const labels = (data.rows || []).slice(0, 6).map((item: any) => item.name);
        const values = (data.rows || []).slice(0, 6).map((item: any) => item.total_qntd);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Vendas por Produto',
              data: values,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.3,
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
        text: 'Tendência de Vendas',
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