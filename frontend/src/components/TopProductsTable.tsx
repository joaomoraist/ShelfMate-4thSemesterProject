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
    const load = async () => {
      try {
        setLoading(true);
        const stored = localStorage.getItem('user');
        const companyId = stored ? (JSON.parse(stored)?.company_id) : undefined;
        const url = companyId ? `${API_URLS.TOP_PRODUCTS}?companyId=${companyId}` : API_URLS.TOP_PRODUCTS;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Falha ao buscar top produtos');
        const data = await res.json();
        setProducts(data.rows || []);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Erro ao carregar top produtos');
      } finally {
        setLoading(false);
      }
    };
    load();
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