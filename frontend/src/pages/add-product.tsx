import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/add-product.module.css';
import { API_URLS } from '../config/api';
import { useNavigation } from '../context/NavigationContext';

interface ProductFormData {
  name: string;
  unit_price: number;
  inventory: number;
  status: string;
}

const AddProduct: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    unit_price: 0,
    inventory: 0,
    status: 'Disponível'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'unit_price' || name === 'inventory' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validações básicas
      if (!formData.name.trim()) {
        throw new Error('Nome do produto é obrigatório');
      }

      if (formData.unit_price < 0) {
        throw new Error('Preço não pode ser negativo');
      }

      if (formData.inventory < 0) {
        throw new Error('Estoque não pode ser negativo');
      }

      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      const companyId = user?.company_id;

      const response = await fetch(API_URLS.STATS_PRODUCTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(companyId ? { 'x-company-id': String(companyId) } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ ...formData, company_id: companyId ?? undefined })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar produto');
      }

      setSuccess('Produto adicionado com sucesso!');
      
      // Limpar formulário
      setFormData({
        name: '',
        unit_price: 0,
        inventory: 0,
        status: 'Disponível'
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigateTo('products');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigateTo('products');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Adicionar Novo Produto</h1>
        <p>Preencha as informações do produto abaixo</p>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Nome do Produto *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Digite o nome do produto"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="unit_price" className={styles.label}>
                Preço Unitário (R$) *
              </label>
              <input
                type="number"
                id="unit_price"
                name="unit_price"
                value={formData.unit_price === 0 ? '' : formData.unit_price}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="inventory" className={styles.label}>
                Quantidade em Estoque *
              </label>
              <input
                type="number"
                id="inventory"
                name="inventory"
                value={formData.inventory === 0 ? '' : formData.inventory}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.label}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="Disponível">Disponível</option>
              <option value="Estoque Baixo">Estoque Baixo</option>
              <option value="Estoque Alto">Estoque Alto</option>
              <option value="Indisponível">Indisponível</option>
            </select>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              {success}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Adicionando...' : 'Adicionar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;