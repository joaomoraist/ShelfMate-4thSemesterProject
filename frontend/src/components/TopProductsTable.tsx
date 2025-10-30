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
  limit?: number;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({ className, limit }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const url = limit ? `${API_URLS.TOP_PRODUCTS}?limit=${limit}` : API_URLS.TOP_PRODUCTS;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Falha ao buscar top produtos');
        const data = await res.json();
        const rows = (data.rows || []) as Product[];
        setProducts(limit ? rows.slice(0, limit) : rows);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Erro ao carregar top produtos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className={cssModule.tableWrapper}>Carregando dados...</div>;
  if (error) return <div className={cssModule.tableWrapper}>Erro ao carregar dados: {error}</div>;

  return (
    <div className={`${className ?? ''} ${cssModule.tableWrapper}`}>
      <table className={cssModule.dataTable}>
        <thead>
          <tr>
            <th className={cssModule.skuCol}>SKU</th>
            <th className={cssModule.nameCol}>Descrição</th>
            <th className={cssModule.qtyCol}>Qntd</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.product_id}>
              <td className={cssModule.skuCol}>{product.product_id}</td>
              <td className={cssModule.nameCol}>{product.name}</td>
              <td className={cssModule.qtyCol}>{product.total_qntd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopProductsTable;