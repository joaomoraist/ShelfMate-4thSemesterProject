import { findByNameAndCompany, insertProduct } from '../repositories/productsRepository.js';

const allowedStatus = ['Disponível','Estoque Baixo','Estoque Alto','Estoque Zerado'];

export async function createProduct(payload, companyId) {
  const { name, price, unit_price, current_stock, inventory, status } = payload || {};
  if (!name || String(name).trim() === '') {
    return { error: 'Nome do produto é obrigatório' };
  }

  const productPrice = price != null ? Number(price) : (unit_price != null ? Number(unit_price) : 0);
  const stockQty = current_stock != null ? Number(current_stock) : (inventory != null ? Number(inventory) : 0);
  let productStatus = status || 'Disponível';
  if (!allowedStatus.includes(productStatus)) {
    if (stockQty === 0) productStatus = 'Estoque Zerado';
    else if (stockQty < 10) productStatus = 'Estoque Baixo';
    else if (stockQty > 100) productStatus = 'Estoque Alto';
    else productStatus = 'Disponível';
  }

  const existing = await findByNameAndCompany(name, companyId);
  if (existing.length > 0) {
    return { conflict: true };
  }

  const unitPriceFixed = Number.isFinite(productPrice) ? Number(productPrice.toFixed(2)) : null;
  const product = await insertProduct({
    name: String(name).trim(),
    unit_price: unitPriceFixed,
    inventory: stockQty,
    status: productStatus,
    company_id: companyId
  });
  return { product };
}