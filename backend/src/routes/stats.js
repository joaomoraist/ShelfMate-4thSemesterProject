import express from 'express';
import sql from '../db.js';

const router = express.Router();

// Helper para resolver companyId (query/header/body/sessão)
const resolveCompanyId = (req) => {
  const q = req.query && (req.query.companyId ?? req.query.company_id);
  const h = req.headers && (req.headers['x-company-id'] ?? req.headers['x_company_id']);
  const b = req.body && (req.body.companyId ?? req.body.company_id);
  const s = req.session && req.session.user && req.session.user.company_id;
  const val = q ?? h ?? b ?? s;
  return val !== undefined && val !== null && val !== '' ? Number(val) : undefined;
};

// Middleware simples para garantir autenticação: aceita sessão OU companyId informado
function ensureAuthenticated(req, res, next) {
  const hasSession = !!(req.session && req.session.user);
  const companyId = resolveCompanyId(req);
  if (hasSession || companyId) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

// GET /stats/overview
router.get('/overview', async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);

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
    const companyId = resolveCompanyId(req);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastAccesses = companyId
      ? await sql`
        SELECT COALESCE(SUM(accesses),0) AS total_accesses
        FROM users
        WHERE company_id = ${companyId}
        AND created_at >= ${thirtyDaysAgo.toISOString()}
      `
      : await sql`
        SELECT COALESCE(SUM(accesses),0) AS total_accesses
        FROM users
        WHERE created_at >= ${thirtyDaysAgo.toISOString()}
      `;

    // Removido filtro por created_at em products pois a coluna não existe no schema atual
    const productsInserted = companyId
      ? await sql`SELECT COUNT(*)::int AS products_count FROM products WHERE company_id = ${companyId}`
      : await sql`SELECT COUNT(*)::int AS products_count FROM products`;

    const profileChanges = companyId
      ? await sql`SELECT COALESCE(SUM(changes),0) AS total_changes FROM users WHERE company_id = ${companyId}`
      : await sql`SELECT COALESCE(SUM(changes),0) AS total_changes FROM users`;

    const reportsDownloaded = companyId
      ? await sql`SELECT COALESCE(SUM(downloads),0) AS total_downloads FROM users WHERE company_id = ${companyId}`
      : await sql`SELECT COALESCE(SUM(downloads),0) AS total_downloads FROM users`;

    // Removido filtro por created_at em alerts pois a coluna não existe no schema atual
    const alertsIssued = companyId
      ? await sql`
        SELECT COUNT(a.*)::int AS alerts_count
        FROM alerts a
        JOIN products p ON p.id = a.product_id
        WHERE p.company_id = ${companyId}
      `
      : await sql`
        SELECT COUNT(a.*)::int AS alerts_count
        FROM alerts a
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
    const companyId = resolveCompanyId(req);
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
    const companyId = resolveCompanyId(req);
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    const rows = companyId
      ? await sql`
        SELECT 
          p.id AS product_id, 
          p.name, 
          p.unit_price,
          p.inventory,
          COALESCE(SUM(s.qntd),0) AS total_sold,
          COALESCE(SUM(s.value),0) AS total_revenue,
          COUNT(s.id) AS total_sales_count,
          COALESCE(AVG(s.qntd),0) AS avg_quantity_per_sale
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        WHERE p.company_id = ${companyId}
        GROUP BY p.id, p.name, p.unit_price, p.inventory
        ORDER BY total_sold DESC
        LIMIT ${limit}
      `
      : await sql`
        SELECT 
          p.id AS product_id, 
          p.name, 
          p.unit_price,
          p.inventory,
          COALESCE(SUM(s.qntd),0) AS total_sold,
          COALESCE(SUM(s.value),0) AS total_revenue,
          COUNT(s.id) AS total_sales_count,
          COALESCE(AVG(s.qntd),0) AS avg_quantity_per_sale
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        GROUP BY p.id, p.name, p.unit_price, p.inventory
        ORDER BY total_sold DESC
        LIMIT ${limit}
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
    const companyId = resolveCompanyId(req);
    const rows = companyId
      ? await sql`SELECT * FROM products WHERE company_id = ${companyId} ORDER BY id`
      : await sql`SELECT * FROM products ORDER BY id`;
    return res.json({ rows });
  } catch (err) {
    console.error('Erro em /stats/products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ CORRIGIDO: GET /stats/products-detailed (sem usar s.created_at)
router.get('/products-detailed', async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);

    const rows = companyId
      ? await sql`
        SELECT 
          p.id,
          p.name,
          p.unit_price,
          p.inventory,
          p.status,
          p.company_id,
          COALESCE(SUM(s.qntd), 0) AS total_sales,
          COALESCE(COUNT(DISTINCT a.id), 0) AS alerts_count
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        LEFT JOIN alerts a ON a.product_id = p.id
        WHERE p.company_id = ${companyId}
        GROUP BY p.id, p.name, p.unit_price, p.inventory, p.status, p.company_id
        ORDER BY total_sales DESC
      `
      : await sql`
        SELECT 
          p.id,
          p.name,
          p.unit_price,
          p.inventory,
          p.status,
          p.company_id,
          COALESCE(SUM(s.qntd), 0) AS total_sales,
          COALESCE(COUNT(DISTINCT a.id), 0) AS alerts_count
        FROM products p
        LEFT JOIN sales s ON s.product_id = p.id
        LEFT JOIN alerts a ON a.product_id = p.id
        GROUP BY p.id, p.name, p.unit_price, p.inventory, p.status, p.company_id
        ORDER BY total_sales DESC
      `;

    return res.json({ rows });
  } catch (err) {
    console.error('Erro em /stats/products-detailed:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


// POST /stats/products - Adicionar novo produto (usa company_id da sessão)
router.post('/products', ensureAuthenticated, async (req, res) => {
  try {
    const { 
      name, 
      price, 
      unit_price, 
      current_stock, 
      inventory, 
      category, 
      description, 
      status 
    } = req.body || {};

    // Validações
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nome do produto é obrigatório' });
    }

    // Usar price ou unit_price (compatibilidade)
    const productPrice = price != null ? Number(price) : (unit_price != null ? Number(unit_price) : 0);
    
    // Usar current_stock ou inventory (compatibilidade)
    const stockQty = current_stock != null ? Number(current_stock) : (inventory != null ? Number(inventory) : 0);
    
    const productStatus = status || 'Disponível';
    const productCategory = category || 'Geral';
    const productDescription = description || '';
    const companyId = resolveCompanyId(req) ?? null;

    // Verificar se produto já existe
    const existingProduct = await sql`
      SELECT id FROM products 
      WHERE LOWER(name) = LOWER(${name}) AND company_id = ${companyId}
    `;

    if (existingProduct.length > 0) {
      return res.status(409).json({ error: 'Produto com este nome já existe' });
    }

    // Inserir produto
    const rows = await sql`
      INSERT INTO products (name, unit_price, inventory, status, company_id)
      VALUES (${name.trim()}, ${productPrice}, ${stockQty}, ${productStatus}, ${companyId})
      RETURNING *
    `;

    return res.status(201).json({ 
      success: true,
      message: 'Produto adicionado com sucesso',
      product: rows[0] 
    });
  } catch (err) {
    console.error('Erro em POST /stats/products:', err);
    
    // Tratar erros específicos do banco
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Produto com este nome já existe' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /stats/products/bulk - Adicionar vários produtos de uma vez (usa company_id da sessão)
router.post('/products/bulk', ensureAuthenticated, async (req, res) => {
  try {
    const { rows } = req.body || {};

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Lista de produtos (rows) é obrigatória' });
    }

    const companyId = req.session.user.company_id;

    const results = [];

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i] || {};
      const name = (item.name || '').trim();
      const unit_price = item.unit_price != null ? Number(item.unit_price) : 0;
      const inventory = item.inventory != null ? Number(item.inventory) : 0;
      const status = item.status || 'Disponível';

      if (!name) {
        results.push({ index: i, status: 'error', name, reason: 'Nome é obrigatório' });
        continue;
      }

      try {
        // Checar duplicidade por nome dentro da empresa
        const existing = await sql`SELECT id FROM products WHERE LOWER(name) = LOWER(${name}) AND company_id = ${companyId}`;
        if (existing.length > 0) {
          results.push({ index: i, status: 'skipped', name, reason: 'Já existe produto com este nome' });
          continue;
        }

        const inserted = await sql`
          INSERT INTO products (name, unit_price, inventory, status, company_id)
          VALUES (${name}, ${unit_price}, ${inventory}, ${status}, ${companyId})
          RETURNING *
        `;
        results.push({ index: i, status: 'created', name, product: inserted[0] });
      } catch (err) {
        console.error('Erro ao inserir item bulk:', err);
        results.push({ index: i, status: 'error', name, reason: err.message || 'Erro ao inserir' });
      }
    }

    const createdCount = results.filter(r => r.status === 'created').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return res.status(201).json({
      success: true,
      summary: { createdCount, skippedCount, errorCount, total: rows.length },
      results
    });
  } catch (err) {
    console.error('Erro em POST /stats/products/bulk:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /stats/top-products-by-user/:userId - Produtos mais vendidos de um usuário específico
router.get('/top-products-by-user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const days = req.query.days ? parseInt(req.query.days) : null; // Filtro por período
    
    let dateFilter = '';
    if (days) {
      dateFilter = `AND s.sale_date >= NOW() - INTERVAL '${days} days'`;
    }
    
    const rows = await sql`
      SELECT 
        p.id AS product_id, 
        p.name AS product_name, 
        p.price,
        p.current_stock,
        p.category,
        COALESCE(SUM(s.qntd),0) AS total_sold,
        COALESCE(SUM(s.qntd * p.price),0) AS total_revenue,
        COUNT(s.id) AS total_sales_count,
        COALESCE(AVG(s.qntd),0) AS avg_quantity_per_sale,
        COALESCE(STDDEV(s.qntd),0) AS std_quantity,
        MAX(s.sale_date) AS last_sale_date,
        MIN(s.sale_date) AS first_sale_date,
        CASE 
          WHEN MAX(s.sale_date) IS NOT NULL THEN 
            EXTRACT(DAYS FROM (MAX(s.sale_date) - MIN(s.sale_date))) + 1
          ELSE 0 
        END AS days_selling,
        CASE 
          WHEN MAX(s.sale_date) IS NOT NULL AND EXTRACT(DAYS FROM (MAX(s.sale_date) - MIN(s.sale_date))) + 1 > 0 THEN 
            COALESCE(SUM(s.qntd),0) / (EXTRACT(DAYS FROM (MAX(s.sale_date) - MIN(s.sale_date))) + 1)
          ELSE 0 
        END AS sales_rate_per_day
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id ${days ? sql`AND s.sale_date >= NOW() - INTERVAL '${days} days'` : sql``}
      JOIN users u ON u.company_id = p.company_id
      WHERE u.id = ${userId}
      GROUP BY p.id, p.name, p.price, p.current_stock, p.category
      ORDER BY total_sold DESC
      LIMIT ${limit}
    `;
    
    return res.json({ 
      user_id: userId,
      period_days: days || 'all_time',
      products: rows 
    });
  } catch (err) {
    console.error('Erro em /stats/top-products-by-user:', err);
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
