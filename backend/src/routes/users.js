import express from 'express';
import sql from '../db.js';
import crypto from 'crypto';
import { Resend } from 'resend';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// setup multer storage for user images (save by user ID under public/user_photos)
// Resolve path relative to this file location to avoid relying on process.cwd()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');
const userPhotosDir = path.join(publicDir, 'user_photos');
if (!fs.existsSync(userPhotosDir)) fs.mkdirSync(userPhotosDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, userPhotosDir); },
  filename: function (req, file, cb) {
    try {
      const userId = req.session && req.session.user && req.session.user.id;
      const ext = path.extname(file.originalname) || '.png';
      const name = userId ? `${userId}${ext}` : `user_${Date.now()}${ext}`;
      cb(null, name);
    } catch (e) {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `user_${Date.now()}${ext}`);
    }
  }
});
const upload = multer({ storage });

// ===============================================
// Configuração do Resend (lazy)
// Evita crash quando RESEND_API_KEY não está presente em produção.
// ===============================================
let resendClient = null;
const getResend = () => {
  try {
    if (resendClient) return resendClient;
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn('RESEND_API_KEY não configurado; envio de email será pulado.');
      return null;
    }
    resendClient = new Resend(key);
    return resendClient;
  } catch (e) {
    console.warn('Falha ao inicializar Resend:', e && e.message);
    return null;
  }
};

// ===============================================
// 1. Verificar se um usuário existe pelo email e senha
// ===============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e Senha são obrigatórios'
      });
    }

    // Buscar usuário pelo email
    const users = await sql`
      SELECT id, name, email, password, user_level, company_id, created_at, image
      FROM users 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Email inválido'
      });
    }

    const user = users[0];

    // Verificar senha (comparar senha fornecida com a do banco)
  const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Senha errada'
      });
    }

    // Remover senha da resposta
  const { password: _pwd, ...userWithoutPassword } = user;

    // Criar sessão contendo dados essenciais do usuário
    req.session.user = {
      id: userWithoutPassword.id,
      name: userWithoutPassword.name,
      email: userWithoutPassword.email,
      user_level: userWithoutPassword.user_level,
      company_id: userWithoutPassword.company_id,
      image: userWithoutPassword.image || null
    };

    // Incrementar contador de acessos do usuário
    try {
      await sql`
        UPDATE users SET accesses = COALESCE(accesses, 0) + 1 WHERE id = ${userWithoutPassword.id}
      `;
    } catch (incErr) {
      console.warn('Falha ao incrementar accesses:', incErr && incErr.message);
      // Não interrompe o login em caso de falha no incremento
    }

    // Log session info for debugging (no password)
    try {
      console.log('Sessão criada:', req.sessionID, req.session.user);
    } catch (e) {
      console.warn('Não foi possível logar informações da sessão:', e && e.message);
    }

    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// =============================================
// 2. Inserir um novo usuário no banco de dados
// =============================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company_cnpj } = req.body;

    if (!name || !email || !password || !company_cnpj) {
      return res.status(400).json({
        error: 'Nome, email, senha e CNPJ são obrigatórios'
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Normalizar CNPJ (apenas dígitos)
    const cleanCnpj = String(company_cnpj).replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      return res.status(400).json({ error: 'CNPJ inválido. Informe 14 dígitos.' });
    }

    // Verificar se o email já existe
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Este email já esta sendo usado'
      });
    }

    // Buscar empresa por CNPJ; se não existir, criar
    let company_id = null;
    const companies = await sql`
      SELECT id FROM companies WHERE cnpj = ${cleanCnpj}
    `;

    if (companies.length > 0) {
      company_id = companies[0].id;
    } else {
      const companyName = `Empresa ${cleanCnpj}`;
      try {
        const created = await sql`
          INSERT INTO companies (name, cnpj)
          VALUES (${companyName}, ${cleanCnpj})
          RETURNING id
        `;
        company_id = created[0].id;
      } catch (err) {
        // Concorrência: outra requisição pode ter inserido o mesmo CNPJ
        if (err && err.code === '23505') { // unique_violation
          const existing = await sql`SELECT id FROM companies WHERE cnpj = ${cleanCnpj}`;
          if (existing.length === 0) throw err;
          company_id = existing[0].id;
        } else {
          throw err;
        }
      }
    }

    // Inserir novo usuário com company_id resolvido
    const newUser = await sql`
      INSERT INTO users (name, email, password, company_id, user_level)
      VALUES (${name}, ${email}, ${password}, ${company_id}, 1)
      RETURNING id, name, email, user_level, company_id, created_at
    `;

    res.status(201).json({
      message: 'User created successfully',
      user: newUser[0]
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// =============================================
// 3. Enviar código de verificação por email para reset de senha
// =============================================
router.post('/send-reset-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório'
      });
    }

    // Verificar se o usuário existe
    const users = await sql`
      SELECT id, name FROM users WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Usuario não encontrado'
      });
    }

    const user = users[0];

    // Gerar código de recuperação
    const recoveryCode = crypto.randomBytes(20).toString('hex').toUpperCase();

    // Salvar código no banco de dados
    await sql`
      UPDATE users 
      SET recovery_code = ${recoveryCode}
      WHERE email = ${email}
    `;

    // Preferir envio via serviço ML na AWS; fallback para Resend se necessário
    const mlBaseUrl = process.env.ML_BASE_URL || 'http://localhost:8001';
    try {
      const resp = await fetch(`${mlBaseUrl}/notify/email/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: email, code: recoveryCode })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`ML email notify failed: ${resp.status} ${text}`);
      }
      console.log('Email de recuperação solicitado ao ML com sucesso para:', email);
      return res.json({ message: 'Recovery code sent successfully via ML' });
    } catch (mlErr) {
      console.warn('Falha ao enviar via ML, tentando Resend como fallback:', mlErr && mlErr.message);
      try {
        const resend = getResend();
        if (!resend) {
          console.warn(`RESEND_API_KEY ausente; código de recuperação para ${email}: ${recoveryCode}`);
          return res.json({
            message: 'Código gerado. Email não enviado (serviço não configurado).',
            fallback: true
          });
        }
        await resend.emails.send({
          from: 'ShelfMate <noreply@semestralproject.com>',
          to: [email],
          subject: 'Seu código de recuperação - ShelfMate',
          text: `Seu código é: ${recoveryCode}.`,
          html: `<p>Seu código é: <strong>${recoveryCode}</strong>.</p>`
        });
        console.log('Email enviado com sucesso via Resend para:', email);
        return res.json({ message: 'Recovery code sent successfully' });
      } catch (emailError) {
        console.error('Erro ao enviar email via Resend:', emailError);
        if (emailError.message?.includes('Invalid API key')) {
          return res.status(500).json({
            error: 'Email service configuration error',
            details: 'Invalid API key'
          });
        }
        if (emailError.message?.includes('Invalid domain')) {
          return res.status(500).json({
            error: 'Email service configuration error',
            details: 'Invalid sender domain'
          });
        }
        return res.status(500).json({
          error: 'Failed to send recovery code email'
        });
      }
    }

  } catch (error) {
    console.error('Erro ao enviar código de recuperação:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// ======================================================
// 4. Verificar se o código de reset fornecido é correto
// ======================================================
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, recoveryCode } = req.body;

    if (!email || !recoveryCode) {
      return res.status(400).json({
        error: 'Email and recovery code are required'
      });
    }

    // Buscar usuário e verificar código
    const users = await sql`
      SELECT id, name, recovery_code
      FROM users 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = users[0];

    if (!user.recovery_code) {
      return res.status(400).json({
        error: 'No recovery code found for this user'
      });
    }

    if (user.recovery_code !== recoveryCode.toUpperCase()) {
      return res.status(401).json({
        error: 'Invalid recovery code'
      });
    }
    
    res.json({
      message: 'Recovery code is valid',
      valid: true
    });

  } catch (error) {
    console.error('Erro ao verificar código de recuperação:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// ======================================================
// 5. Reset de senha (após verificação do código)
// ======================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, recoveryCode, newPassword } = req.body;

    if (!email || !recoveryCode || !newPassword) {
      return res.status(400).json({
        error: 'Email, recovery code and new password are required'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar código primeiro
    const users = await sql`
      SELECT id, recovery_code
      FROM users 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = users[0];

    if (!user.recovery_code || user.recovery_code !== recoveryCode.toUpperCase()) {
      return res.status(401).json({
        error: 'Invalid recovery code'
      });
    }
    
    // Atualizar senha e limpar código de recuperação
    await sql`
      UPDATE users 
      SET password = ${newPassword}, recovery_code = NULL
      WHERE email = ${email}
    `;

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// PUT /users/me -> atualizar informações do usuário autenticado
router.put('/me', upload.single('image'), async (req, res) => {
  try {
    if (!req.session || !req.session.user) return res.status(401).json({ error: 'Not authenticated' });

    const userId = req.session.user.id;
    const { name, email, newPassword } = req.body;
    let imagePath = null;

    if (newPassword && String(newPassword).length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    if (req.file) {
      // save relative path for serving via express.static
      imagePath = `/user_photos/${req.file.filename}`;
    }

    // Build dynamic update
    const updates = [];
    if (name) updates.push(sql`name = ${name}`);
    if (email) updates.push(sql`email = ${email}`);
  if (newPassword) updates.push(sql`password = ${newPassword}`);
    if (imagePath) updates.push(sql`image = ${imagePath}`);

    if (updates.length > 0) {
      // Compose SET clause
      // Incrementar changes junto com qualquer atualização realizada
      updates.push(sql`changes = COALESCE(changes, 0) + 1`);
      const setClause = updates.reduce((prev, cur, idx) => idx === 0 ? cur : sql`${prev}, ${cur}`);
      await sql`
        UPDATE users SET ${setClause} WHERE id = ${userId}
      `;
    }

    // fetch updated user
    const rows = await sql`
      SELECT id, name, email, user_level, company_id, image FROM users WHERE id = ${userId}
    `;
    const updatedUser = rows[0];

    // update session
    req.session.user = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      user_level: updatedUser.user_level,
      company_id: updatedUser.company_id,
      image: updatedUser.image
    };

    return res.json({ message: 'User updated', user: req.session.user });
  } catch (err) {
    console.error('Erro em PUT /users/me:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota para obter usuário logado a partir da sessão
// GET /users/me
router.get('/me', (req, res) => {
  try {
    // Em desenvolvimento, permita prosseguir mesmo sem sessão, retornando usuário fake
    if (req.session && req.session.user) {
      return res.json({ user: req.session.user });
    }
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ user: null });
    }
    return res.status(401).json({ error: 'Not authenticated' });
  } catch (err) {
    console.error('Erro em /users/me:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rota para logout (destrói a sessão)
router.post('/logout', (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.error('Erro ao destruir sessão:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logged out' });
    });
  } catch (err) {
    console.error('Erro em /users/logout:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Excluir conta do usuário logado
// DELETE /users/me
router.delete('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.user.id;

    // Buscar imagem para remover do disco, se existir
    let imagePath = null;
    try {
      const rows = await sql`SELECT image FROM users WHERE id = ${userId}`;
      imagePath = rows && rows[0] ? rows[0].image : null;
    } catch (e) {
      console.warn('Falha ao buscar imagem do usuário antes da exclusão:', e && e.message);
    }

    // Excluir usuário
    await sql`DELETE FROM users WHERE id = ${userId}`;

    // Remover arquivo de imagem se estiver na pasta user_photos
    if (typeof imagePath === 'string' && imagePath.startsWith('/user_photos/')) {
      const filename = imagePath.replace('/user_photos/', '');
      const filepath = path.join(userPhotosDir, filename);
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (fileErr) {
        console.warn('Falha ao remover foto do usuário:', fileErr && fileErr.message);
      }
    }

    // Destruir sessão após exclusão
    req.session.destroy(err => {
      if (err) {
        console.error('Erro ao destruir sessão após excluir conta:', err);
        return res.status(500).json({ error: 'Account deleted but failed to end session' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Account deleted' });
    });
  } catch (err) {
    console.error('Erro em DELETE /users/me:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/home -> small helper for testing that user is logged in
router.get('/home', (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.json({ message: 'You are logged in', user: req.session.user });
    }
    return res.status(401).json({ error: 'Not authenticated' });
  } catch (err) {
    console.error('Erro em /users/home:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
