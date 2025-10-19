import React, { useEffect, useState } from 'react';
import { API_URLS } from '../config/api';
import cssModule from '../styles/home.module.css';

interface Product {
  product_id: number;
  name: string;
  total_qntd: number;
}

interface TopProductsTableProps {
  className?: string;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({ className }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Buscar os 10 produtos mais vendidos
        const response = await fetch(API_URLS.TOP_PRODUCTS, { credentials: 'include' });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro na resposta:', errorData);
          throw new Error('Falha ao buscar produtos mais vendidos');
        }

        const data = await response.json();
        setProducts(data.rows);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Carregando dados...</div>;
  if (error) return <div>Erro ao carregar dados: {error}</div>;

  return (
    <div className={className}>
      <div className={cssModule.tableHeader}>
        <span className={cssModule.tableColumn}>SKU</span>
        <span className={cssModule.tableColumn}>Descrição</span>
        <span className={cssModule.tableColumn}>Qntd</span>
      </div>
      {products.map((product) => (
        <div key={product.product_id} className={cssModule.tableRow}>
          <span className={cssModule.tableCell}>{product.product_id}</span>
          <span className={cssModule.tableCell}>{product.name}</span>
          <span className={cssModule.tableCell}>{product.total_qntd}</span>
        </div>
      ))}
    </div>
  );
};

export default TopProductsTable;