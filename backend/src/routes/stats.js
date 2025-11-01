import express from 'express';
import sql from '../db.js';
import { createProduct } from '../services/productsService.js';

const router = express.Router();

// Helper para resolver companyId APENAS da sessão do usuário
const resolveCompanyId = (req) => {
  const s = req.session && req.session.user && req.session.user.company_id;
  return s !== undefined && s !== null && s !== '' ? Number(s) : undefined;
};

// Middleware simples para garantir autenticação: exige sessão
function ensureAuthenticated(req, res, next) {
  const hasSession = !!(req.session && req.session.user);
  if (hasSession) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

// GET /stats/overview
router.get('/overview', ensureAuthenticated, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const sessionUserId = req.session?.user?.id; // não será usado para filtrar

    const userAgg = await sql`
      SELECT COALESCE(SUM(accesses),0) AS accesses_sum, COALESCE(SUM(changes),0) AS changes_sum, COALESCE(SUM(downloads),0) AS downloads_sum
      FROM users
      WHERE company_id = ${companyId}
    `;

    const productsCount = await sql`SELECT COUNT(*)::int AS products_count FROM products WHERE company_id = ${companyId}`;

    const alertsCount = await sql`
      SELECT COUNT(a.*)::int AS alerts_count
      FROM alerts a
      JOIN products p ON p.id = a.product_id
      WHERE p.company_id = ${companyId}
    `;

    // Vendas no período considerando toda a empresa
    const totalSold = await sql`
      SELECT COALESCE(SUM(s.qntd),0) AS total_qntd
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id
      WHERE p.company_id = ${companyId}
    `;

    const totalStockValue = await sql`
      SELECT COALESCE(SUM(p.inventory * p.unit_price),0) AS total_value
      FROM products p
      WHERE p.company_id = ${companyId}
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
router.get('/activity-last-30-days', ensureAuthenticated, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastAccesses = await sql`
      SELECT COALESCE(SUM(accesses),0) AS total_accesses
      FROM users
      WHERE company_id = ${companyId}
      AND created_at >= ${thirtyDaysAgo.toISOString()}
    `;

    // Removido filtro por created_at em products pois a coluna não existe no schema atual
    const productsInserted = await sql`SELECT COUNT(*)::int AS products_count FROM products WHERE company_id = ${companyId}`;

    const profileChanges = await sql`SELECT COALESCE(SUM(changes),0) AS total_changes FROM users WHERE company_id = ${companyId}`;

    const reportsDownloaded = await sql`SELECT COALESCE(SUM(downloads),0) AS total_downloads FROM users WHERE company_id = ${companyId}`;

    // Removido filtro por created_at em alerts pois a coluna não existe no schema atual
    const alertsIssued = await sql`
      SELECT COUNT(a.*)::int AS alerts_count
      FROM alerts a
      JOIN products p ON p.id = a.product_id
      WHERE p.company_id = ${companyId}
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
router.get('/sales-per-product', ensureAuthenticated, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const sessionUserId = req.session?.user?.id; // não será usado para filtrar
  const rows = await sql`
      SELECT p.id AS product_id, p.name, COALESCE(SUM(s.qntd),0) AS total_qntd
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id AND s.company_id = ${companyId}
      WHERE p.company_id = ${companyId}
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
router.get('/top-products', ensureAuthenticated, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const sessionUserId = req.session?.user?.id; // não será usado para filtrar
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    const rows = await sql`
      SELECT 
        p.id AS product_id, 
        p.name, 
        p.unit_price,
        p.inventory,
        COALESCE(SUM(s.qntd),0) AS total_qntd,
        COALESCE(SUM(s.value),0) AS total_revenue,
        COUNT(s.id) AS total_sales_count,
        COALESCE(AVG(s.qntd),0) AS avg_quantity_per_sale
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id AND s.company_id = ${companyId}
      WHERE p.company_id = ${companyId}
      GROUP BY p.id, p.name, p.unit_price, p.inventory
      ORDER BY total_qntd DESC
      LIMIT ${limit}
    `;
    return res.json({ rows });
  } catch (err) {
    console.error('Erro em /stats/top-products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/products
router.get('/products', ensureAuthenticated, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const sessionUserId = req.session?.user?.id; // não será usado para filtrar
    const rows = await sql`SELECT * FROM products WHERE company_id = ${companyId} ORDER BY id`;
    return res.json({ rows });
  } catch (err) {
    console.error('Erro em /stats/products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ CORRIGIDO: GET /stats/products-detailed (sem usar s.created_at)
router.get('/products-detailed', ensureAuthenticated, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const sessionUserId = req.session?.user?.id; // não será usado para filtrar

    const rows = await sql`
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
      LEFT JOIN sales s ON s.product_id = p.id AND s.company_id = ${companyId}
      LEFT JOIN alerts a ON a.product_id = p.id AND a.company_id = ${companyId}
      WHERE p.company_id = ${companyId}
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
    const companyId = resolveCompanyId(req) ?? null;
    const result = await createProduct(req.body, companyId);
    if (result.error) return res.status(400).json({ error: result.error });
    if (result.conflict) return res.status(409).json({ error: 'Produto com este nome já existe' });
    return res.status(201).json({ success: true, message: 'Produto adicionado com sucesso', product: result.product });
  } catch (err) {
    console.error('Erro em POST /stats/products:', err);
    
    // Tratar erros específicos do banco
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Produto com este nome já existe' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /stats/products/:id - Remove produto da empresa (e dependências)
router.delete('/products/:id', ensureAuthenticated, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const productId = Number(req.params.id);

    if (!companyId) return res.status(400).json({ error: 'Empresa não identificada na sessão' });
    if (!Number.isFinite(productId)) return res.status(400).json({ error: 'ID de produto inválido' });

    const prod = await sql`SELECT id, company_id FROM products WHERE id = ${productId}`;
    if (prod.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    if (Number(prod[0].company_id) !== Number(companyId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Apagar dependências (alerts, sales) antes para evitar violação de FK
    await sql`DELETE FROM alerts WHERE product_id = ${productId}`;
    await sql`DELETE FROM sales WHERE product_id = ${productId}`;

    const del = await sql`DELETE FROM products WHERE id = ${productId} AND company_id = ${companyId} RETURNING id`;
    if (del.length === 0) return res.status(404).json({ error: 'Produto não encontrado para esta empresa' });

    return res.json({ success: true, deleted_id: del[0].id });
  } catch (err) {
    console.error('Erro em DELETE /stats/products/:id:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
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
    const createdBy = req.session.user.id;

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
router.get('/top-products-by-user/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const sessionUserId = req.session.user.id;
    const companyId = resolveCompanyId(req);

    if (userId !== sessionUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    const rows = await sql`
      SELECT 
        p.id AS product_id, 
        p.name AS product_name, 
        p.price,
        p.current_stock,
        p.category,
        COALESCE(SUM(s.qntd),0) AS total_qntd,
        COALESCE(SUM(s.qntd * p.price),0) AS total_revenue,
        COUNT(s.id) AS total_sales_count,
        COALESCE(AVG(s.qntd),0) AS avg_quantity_per_sale,
        COALESCE(STDDEV(s.qntd),0) AS std_quantity
      FROM products p
      LEFT JOIN sales s ON s.product_id = p.id AND s.company_id = ${companyId}
      JOIN users u ON u.company_id = p.company_id
      WHERE u.id = ${sessionUserId} AND p.company_id = ${companyId}
      GROUP BY p.id, p.name, p.price, p.current_stock, p.category
      ORDER BY total_qntd DESC
      LIMIT ${limit}
    `;
    
    return res.json({ 
      user_id: userId,
      period_days: 'all_time',
      products: rows 
    });
  } catch (err) {
    console.error('Erro em /stats/top-products-by-user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats/product/:id/sales
router.get('/product/:id/sales', ensureAuthenticated, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const companyId = resolveCompanyId(req);

    const prod = await sql`SELECT id, name, company_id FROM products WHERE id = ${productId}`;
    if (prod.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (Number(prod[0].company_id) !== Number(companyId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const salesRows = await sql`
      SELECT id, qntd, value FROM sales WHERE product_id = ${productId} AND company_id = ${companyId}
    `;

    const agg = await sql`
      SELECT COALESCE(SUM(qntd),0) AS total_qntd, COALESCE(SUM(value),0) AS total_value
      FROM sales WHERE product_id = ${productId} AND company_id = ${companyId}
    `;

    return res.json({ product: prod[0], sales: salesRows, totals: agg[0] });
  } catch (err) {
    console.error('Erro em /stats/product/:id/sales:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /stats/reports-exported - incrementa contador de relatórios exportados para a empresa do usuário
router.post('/reports-exported', ensureAuthenticated, async (req, res) => {
  try {
    const companyId = resolveCompanyId(req);
    const sessionUser = req.session && req.session.user;
    if (!companyId) {
      return res.status(400).json({ error: 'Empresa não identificada na sessão' });
    }

    // Incrementa contador na tabela de empresas
    const rows = await sql`
      UPDATE companies
      SET reports_exported = COALESCE(reports_exported, 0) + 1
      WHERE id = ${companyId}
      RETURNING id, name, cnpj, reports_exported
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Também incrementa contador de downloads do usuário que exportou
    let userUpdate = null;
    if (sessionUser && sessionUser.id) {
      const userRows = await sql`
        UPDATE users
        SET downloads = COALESCE(downloads, 0) + 1
        WHERE id = ${sessionUser.id} AND company_id = ${companyId}
        RETURNING id, name, email, company_id, downloads
      `;
      userUpdate = userRows && userRows[0] ? userRows[0] : null;
    }

    return res.json({ success: true, company: rows[0], user: userUpdate });
  } catch (err) {
    console.error('Erro em POST /stats/reports-exported:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
