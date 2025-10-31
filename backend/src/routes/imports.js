import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { parse } from 'csv-parse';
import sql from '../db.js';

const router = express.Router();
const upload = multer({ dest: '/tmp' });

function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user && req.session.user.company_id) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// Expect CSV with combined rows where product columns and sale columns exist.
// Required product cols: name, unit_price, inventory, status (status optional)
// Required sale cols: qntd, value (and either product_id or product_name)
router.post('/csv-sales', ensureAuthenticated, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file is required (field name: file)' });

  const companyId = req.session.user.company_id;
  const sessionUserId = req.session.user.id;
  const filePath = req.file.path;

  const records = [];
  const parser = fs.createReadStream(filePath).pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));

  for await (const record of parser) {
    records.push(record);
  }

  // Begin transaction
  const tx = await sql.begin(async (tx) => {
    const results = [];
    for (const row of records) {
      // Extract product fields
      const name = row.name || row.product_name;
      if (!name) throw new Error('Missing product name in CSV row');
      const unit_price = row.unit_price ? Number(row.unit_price) : null;
      const inventory = row.inventory ? Number(row.inventory) : 0;
      const status = row.status || row.product_status || 'Disponível';

      // Upsert product by name+company_id (simple approach)
      const existing = await tx`
        SELECT id FROM products WHERE name = ${name} AND company_id = ${companyId} LIMIT 1
      `;
      let productId;
      if (existing.length > 0) {
        productId = existing[0].id;
        // update basic fields
        await tx`
          UPDATE products SET unit_price = COALESCE(${unit_price}, unit_price), inventory = ${inventory}, status = ${status} WHERE id = ${productId}
        `;
      } else {
        const inserted = await tx`
          INSERT INTO products (name, unit_price, inventory, status, company_id)
          VALUES (${name}, ${unit_price}, ${inventory}, ${status}, ${companyId})
          RETURNING id
        `;
        productId = inserted[0].id;
      }

      // Insert sale if present
      if (row.qntd || row.value) {
        const qntd = row.qntd ? Number(row.qntd) : 0;
        const value = row.value ? Number(row.value) : 0;
        await tx`
          INSERT INTO sales (product_id, qntd, value)
          VALUES (${productId}, ${qntd}, ${value})
        `;
      }

      results.push({ productId, name });
    }

    return results;
  });

  // cleanup
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

  return res.json({ imported: tx.length, details: tx });
});

export default router;
