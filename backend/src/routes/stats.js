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

    const totalStockValue = companyId
      ? await sql`
        SELECT COALESCE(SUM(p.inventory * p.unit_price),0) AS total_value
        FROM products p
        WHERE p.company_id = ${companyId}
      `
      : await sql`
        SELECT COALESCE(SUM(p.inventory * p.unit_price),0) AS total_value
        FROM products p
      `;

    return res.json({
      accesses: userAgg[0].accesses_sum,
      products_count: productsCount[0].products_count,
      changes: userAgg[0].changes_sum,
      downloads: userAgg[0].downloads_sum,
      alerts_count: alertsCount[0].alerts_count,
      total_sold_qntd: Number(totalSold[0].total_qntd),
      total_stock_value: Number(totalStockValue[0].total_value)
    });
  } catch (err) {
    console.error('Erro em /stats/overview:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/activity-last-30-days
router.get('/activity-last-30-days', async (req, res) => {
  try {
    const companyId = req.session?.user?.company_id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastAccesses = companyId
      ? await sql`SELECT COALESCE(SUM(accesses),0) AS total_accesses FROM users WHERE company_id = ${companyId}`
      : await sql`SELECT COALESCE(SUM(accesses),0) AS total_accesses FROM users`;

    const productsInserted = companyId
      ? await sql`
        SELECT COUNT(*)::int AS products_count
        FROM products
        WHERE company_id = ${companyId} 
        AND created_at >= ${thirtyDaysAgo.toISOString()}
      `
      : await sql`
        SELECT COUNT(*)::int AS products_count
        FROM products
        WHERE created_at >= ${thirtyDaysAgo.toISOString()}
      `;

    const profileChanges = companyId
      ? await sql`SELECT COALESCE(SUM(changes),0) AS total_changes FROM users WHERE company_id = ${companyId}`
      : await sql`SELECT COALESCE(SUM(changes),0) AS total_changes FROM users`;

    const reportsDownloaded = companyId
      ? await sql`SELECT COALESCE(SUM(downloads),0) AS total_downloads FROM users WHERE company_id = ${companyId}`
      : await sql`SELECT COALESCE(SUM(downloads),0) AS total_downloads FROM users`;

    const alertsIssued = companyId
      ? await sql`
        SELECT COUNT(a.*)::int AS alerts_count
        FROM alerts a
        JOIN products p ON p.id = a.product_id
        WHERE p.company_id = ${companyId}
        AND a.created_at >= ${thirtyDaysAgo.toISOString()}
      `
      : await sql`
        SELECT COUNT(a.*)::int AS alerts_count
        FROM alerts a
        WHERE a.created_at >= ${thirtyDaysAgo.toISOString()}
      `;

    return res.json({
      last_accesses: lastAccesses[0].total_accesses,
      products_inserted: productsInserted[0].products_count,
      profile_changes: profileChanges[0].total_changes,
      reports_downloaded: reportsDownloaded[0].total_downloads,
      alerts_issued: alertsIssued[0].alerts_count
    });
  } catch (err) {
    console.error('Erro em /stats/activity-last-30-days:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/sales-per-product
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

// GET /stats/top-products
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

// GET /stats/products
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

// ✅ CORRIGIDO: GET /stats/products-detailed
router.get('/products-detailed', async (req, res) => {
  try {
    const companyId = req.session?.user?.company_id;

    let rows;
    if (companyId) {
      rows = await sql`
        SELECT 
          p.id,
          p.name,
          p.unit_price,
          p.inventory,
          p.status,
          p.company_id,
          COALESCE(SUM(s.qntd), 0) AS total_sales,
          COALESCE(COUNT(DISTINCT a.id), 0) AS alerts_count,
          COALESCE(MAX(s.created_at), p.created_at) AS last_sale_date
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        LEFT JOIN alerts a ON a.product_id = p.id
        WHERE p.company_id = ${companyId}
        GROUP BY p.id, p.name, p.unit_price, p.inventory, p.status, p.company_id, p.created_at
        ORDER BY p.id
      `;
    } else {
      rows = await sql`
        SELECT 
          p.id,
          p.name,
          p.unit_price,
          p.inventory,
          p.status,
          p.company_id,
          COALESCE(SUM(s.qntd), 0) AS total_sales,
          COALESCE(COUNT(DISTINCT a.id), 0) AS alerts_count,
          COALESCE(MAX(s.created_at), p.created_at) AS last_sale_date
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        LEFT JOIN alerts a ON a.product_id = p.id
        GROUP BY p.id, p.name, p.unit_price, p.inventory, p.status, p.company_id, p.created_at
        ORDER BY p.id
      `;
    }

    return res.json({ rows });
  } catch (err) {
    console.error('Erro em /stats/products-detailed:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /stats/products
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

// GET /stats/product/:id/sales
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
