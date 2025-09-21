import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

sql`SELECT 1`.then(() => console.log('Conexão OK!')).catch(err => console.error('Erro de conexão:', err));

export default sql;
