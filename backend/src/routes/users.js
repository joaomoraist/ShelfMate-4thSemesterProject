import express from 'express';
import sql from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

// ===============================================
// Configuração do nodemailer com suas credenciais
// ===============================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'semestretrabalhofecaf@gmail.com',
    pass: 'upzg yebt cdrg sgzz'
  }
});

// ===============================================
// 1. Verificar se um usuário existe pelo email e senha
// ===============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Buscar usuário pelo email
    const users = await sql`
      SELECT id, name, email, user_password, user_level, company_id, created_at 
      FROM users 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Verificar senha (comparar senha fornecida com a do banco)
    const isPasswordValid = password === user.user_password;

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Remover senha da resposta
    const { user_password, ...userWithoutPassword } = user;

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
        error: 'Name, email, password and company CNPJ are required'
      });
    }

    // Verificar se o email já existe
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Email already in use'
      });
    }

    let company_id = null;

    // Se CNPJ foi fornecido, verificar se a empresa existe
    if (company_cnpj) {
      const companies = await sql`
        SELECT id FROM companies WHERE cnpj = ${company_cnpj}
      `;

      if (companies.length === 0) {
        return res.status(404).json({
          error: 'Company not found with the provided CNPJ'
        });
      }

      company_id = companies[0].id;
    }

    // Inserir novo usuário
    const newUser = await sql`
      INSERT INTO users (name, email, user_password, company_id, user_level)
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
        error: 'Email is required'
      });
    }

    // Verificar se o usuário existe
    const users = await sql`
      SELECT id, name FROM users WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
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

    // Configurar email
    const mailOptions = {
      from: 'semestretrabalhofecaf@gmail.com',
      to: email,
      subject: 'Your code from the best Fecaf App!!!',
      text: `Your code is: ${recoveryCode}.`
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Recovery code sent successfully'
    });

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
      SET user_password = ${newPassword}, recovery_code = NULL
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

export default router;
