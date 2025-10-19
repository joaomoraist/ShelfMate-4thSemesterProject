import express from 'express';
import sql from '../db.js';

const router = express.Router();

// Middleware simples para garantir autenticação via sessão
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user && req.session.user.company_id) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

// GET /stats/overview
// Retorna: accesses (soma de accesses da empresa), products_count, changes (soma), downloads (soma), alerts_count, total_sold (soma qntd)
router.get('/overview', async (req, res) => {
  try {
    const companyId = req.session?.user?.company_id;

    const userAgg = companyId
      ? await sql`
        SELECT COALESCE(SUM(accesses),0) AS accesses_sum, COALESCE(SUM(changes),0) AS changes_sum, COALESCE(SUM(downloads),0) AS downloads_sum
        FROM users
        WHERE company_id = ${companyId}
      `
      : await sql`
        SELECT COALESCE(SUM(accesses),0) AS accesses_sum, COALESCE(SUM(changes),0) AS changes_sum, COALESCE(SUM(downloads),0) AS downloads_sum
        FROM users
      `;

    const productsCount = companyId
      ? await sql`SELECT COUNT(*)::int AS products_count FROM products WHERE company_id = ${companyId}`
      : await sql`SELECT COUNT(*)::int AS products_count FROM products`;

    const alertsCount = companyId
      ? await sql`
        SELECT COUNT(a.*)::int AS alerts_count
        FROM alerts a
        JOIN products p ON p.id = a.product_id
        WHERE p.company_id = ${companyId}
      `
      : await sql`
        SELECT COUNT(a.*)::int AS alerts_count
        FROM alerts a
        JOIN products p ON p.id = a.product_id
      `;

    const totalSold = companyId
      ? await sql`
        SELECT COALESCE(SUM(s.qntd),0) AS total_qntd
        FROM sales s
        JOIN products p ON p.id = s.product_id
        WHERE p.company_id = ${companyId}
      `
      : await sql`
        SELECT COALESCE(SUM(s.qntd),0) AS total_qntd
        FROM sales s
        JOIN products p ON p.id = s.product_id
      `;

    return res.json({
      accesses: userAgg[0].accesses_sum,
      products_count: productsCount[0].products_count,
      changes: userAgg[0].changes_sum,
      downloads: userAgg[0].downloads_sum,
      alerts_count: alertsCount[0].alerts_count,
      total_sold_qntd: Number(totalSold[0].total_qntd)
    });
  } catch (err) {
    console.error('Erro em /stats/overview:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/sales-per-product -> [{ product_id, name, total_qntd }]
router.get('/sales-per-product', async (req, res) => {
  try {
    const companyId = req.session?.user?.company_id;
    const rows = companyId
      ? await sql`
        SELECT p.id AS product_id, p.name, COALESCE(SUM(s.qntd),0) AS total_qntd
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        WHERE p.company_id = ${companyId}
        GROUP BY p.id, p.name
        ORDER BY total_qntd DESC
      `
      : await sql`
        SELECT p.id AS product_id, p.name, COALESCE(SUM(s.qntd),0) AS total_qntd
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY total_qntd DESC
      `;
    return res.json({ rows });
  } catch (err) {
    console.error('Erro em /stats/sales-per-product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/top-products -> top 10 produtos mais vendidos (por qntd)
router.get('/top-products', async (req, res) => {
  try {
    const companyId = req.session?.user?.company_id;
    const rows = companyId
      ? await sql`
        SELECT p.id AS product_id, p.name, COALESCE(SUM(s.qntd),0) AS total_qntd
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        WHERE p.company_id = ${companyId}
        GROUP BY p.id, p.name
        ORDER BY total_qntd DESC
        LIMIT 10
      `
      : await sql`
        SELECT p.id AS product_id, p.name, COALESCE(SUM(s.qntd),0) AS total_qntd
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY total_qntd DESC
        LIMIT 10
      `;
    return res.json({ rows });
  } catch (err) {
    console.error('Erro em /stats/top-products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/products -> todos os produtos e colunas da tabela products para a empresa
router.get('/products', async (req, res) => {
  try {
    const companyId = req.session?.user?.company_id;
    const rows = companyId
      ? await sql`SELECT * FROM products WHERE company_id = ${companyId} ORDER BY id`
      : await sql`SELECT * FROM products ORDER BY id`;
    return res.json({ rows });
  } catch (err) {
    console.error('Erro em /stats/products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /stats/products -> criar novo produto
// body: { name, unit_price, inventory, status }
router.post('/products', async (req, res) => {
  try {
    const { name, unit_price, inventory, status } = req.body || {};

    if (!name) return res.status(400).json({ error: 'name é obrigatório' });

    const unitPrice = unit_price != null ? Number(unit_price) : 0;
    const inventoryQty = inventory != null ? Number(inventory) : 0;
    const productStatus = status || 'Disponível';
    const companyId = req.session?.user?.company_id || null;

    const rows = await sql`
      INSERT INTO products (name, unit_price, inventory, status, company_id)
      VALUES (${name}, ${unitPrice}, ${inventoryQty}, ${productStatus}, ${companyId})
      RETURNING *
    `;

    return res.status(201).json({ product: rows[0] });
  } catch (err) {
    console.error('Erro em POST /stats/products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/product/:id/sales -> vendas do produto (qntd, value, total qntd)
router.get('/product/:id/sales', async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const prod = await sql`SELECT id, name, company_id FROM products WHERE id = ${productId}`;
    if (prod.length === 0) return res.status(404).json({ error: 'Product not found' });

    const salesRows = await sql`
      SELECT id, qntd, value FROM sales WHERE product_id = ${productId}
    `;

    const agg = await sql`
      SELECT COALESCE(SUM(qntd),0) AS total_qntd, COALESCE(SUM(value),0) AS total_value
      FROM sales WHERE product_id = ${productId}
    `;

    return res.json({ product: prod[0], sales: salesRows, totals: agg[0] });
  } catch (err) {
    console.error('Erro em /stats/product/:id/sales:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
