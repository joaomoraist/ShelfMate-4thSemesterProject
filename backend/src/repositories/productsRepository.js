import sql from '../db.js';

export async function findByNameAndCompany(name, companyId) {
  return sql`SELECT id FROM products WHERE LOWER(name) = LOWER(${name}) AND company_id = ${companyId}`;
}

export async function insertProduct({ name, unit_price, inventory, status, company_id }) {
  const rows = await sql`
    INSERT INTO products (name, unit_price, inventory, status, company_id)
    VALUES (${name}, ${unit_price}, ${inventory}, ${status}, ${company_id})
    RETURNING *
  `;
  return rows[0];
}