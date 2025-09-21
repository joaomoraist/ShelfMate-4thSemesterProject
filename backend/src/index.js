import express from 'express';
import dotenv from 'dotenv';
import usuariosRoutes from './routes/usuarios.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ============== ROTAS =================
app.use('/usuarios', usuariosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});