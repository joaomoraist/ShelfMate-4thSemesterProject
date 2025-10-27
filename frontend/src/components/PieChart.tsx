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
  const [hasData, setHasData] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Buscar dados dos produtos mais vendidos
        const stored = localStorage.getItem('user');
        const companyId = stored ? (JSON.parse(stored)?.company_id) : undefined;
        const url = companyId ? `${API_URLS.TOP_PRODUCTS}?companyId=${companyId}` : API_URLS.TOP_PRODUCTS;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro na resposta:', errorData);
          throw new Error('Falha ao buscar dados de produtos mais vendidos');
        }

        const data = await response.json();

        // Preparar dados para o gráfico:
        // - considerar somente produtos com vendas (> 0)
        // - ordenar por quantidade vendida desc
        // - limitar ao Top 5
        const rows = (data.rows || []) as any[];
        const filtered = rows.filter((item) => (item?.total_qntd ?? 0) > 0);
        const sorted = filtered.sort((a, b) => (b.total_qntd ?? 0) - (a.total_qntd ?? 0));
        const topProducts = sorted.slice(0, 5);

        const labels = topProducts.map((item: any) => item.name);
        const values = topProducts.map((item: any) => item.total_qntd);

        // Gerar cores para cada fatia
        const backgroundColors = [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ];

        if (topProducts.length === 0) {
          setHasData(false);
          setChartData({ labels: [], datasets: [] });
        } else {
          setHasData(true);
          const bg = backgroundColors.slice(0, topProducts.length);
          setChartData({
            labels,
            datasets: [
              {
                label: 'Quantidade Vendida',
                data: values,
                backgroundColor: bg,
                borderColor: bg.map(color => color.replace('0.8', '1')),
                borderWidth: 2,
              }
            ]
          });
        }
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
        text: 'Top 5 Produtos Mais Vendidos',
      },
    },
  };

  if (loading) return <div>Carregando dados...</div>;
  if (error) return <div>Erro ao carregar dados: {error}</div>;
  if (!hasData) return <div>Sem vendas registradas no período para montar o gráfico.</div>;

  return (
    <div className={className} style={{ height: '100%', width: '100%' }}>
      <Pie options={options} data={chartData} />
    </div>
  );
};

export default PieChart;