import express from 'express';
import sql from '../db.js';
import crypto from 'crypto';
import { Resend } from 'resend';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// setup multer storage for user images
const uploadsDir = path.join(process.cwd(), 'backend', 'src', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `user_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// ===============================================
// Configuração do Resend
// ===============================================
const resend = new Resend(process.env.RESEND_API_KEY);

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
      SELECT id, name, email, password, user_level, company_id, created_at 
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
      company_id: userWithoutPassword.company_id
    };

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

    // Verificar se o email já existe
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Este email já esta sendo usado'
      });
    }

    let company_id = null;

    // Por enquanto, vamos permitir cadastro sem verificar empresa
    // TODO: Implementar verificação de empresa quando a tabela estiver disponível
    // if (company_cnpj) {
    //   const companies = await sql`
    //     SELECT id FROM companies WHERE cnpj = ${company_cnpj}
    //   `;
    //   if (companies.length === 0) {
    //     return res.status(404).json({
    //       error: 'Company not found with the provided CNPJ'
    //     });
    //   }
    //   company_id = companies[0].id;
    // }

    // Inserir novo usuário
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

    // Enviar email usando Resend
    try {
      await resend.emails.send({
        from: 'ShelfMate <noreply@semestralproject.com>',
        to: [email],
        subject: 'Seu código de recuperação - ShelfMate',
        text: `Seu código é: ${recoveryCode}.`,
        html: `<p>Seu código é: <strong>${recoveryCode}</strong>.</p>`
      });
      console.log('Email enviado com sucesso para:', email);
      
      res.json({
        message: 'Recovery code sent successfully'
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      
      // Tratar erros específicos do Resend
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
      
      res.status(500).json({
        error: 'Failed to send email',
        details: emailError.message
      });
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

    if (req.file) {
      // save relative path for serving via express.static
      imagePath = `/uploads/${req.file.filename}`;
    }

    // Build dynamic update
    const updates = [];
    if (name) updates.push(sql`name = ${name}`);
    if (email) updates.push(sql`email = ${email}`);
  if (newPassword) updates.push(sql`password = ${newPassword}`);
    if (imagePath) updates.push(sql`image = ${imagePath}`);

    if (updates.length > 0) {
      // Compose SET clause
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

export default router;

// Rota para obter usuário logado a partir da sessão
// GET /users/me
router.get('/me', (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.json({ user: req.session.user });
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
