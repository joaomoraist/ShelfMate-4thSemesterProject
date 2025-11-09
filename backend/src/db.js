import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL safely and normalize for cloud providers (e.g., Supabase Pooler)
const rawUrl = process.env.DATABASE_URL;
let connectionUrl = rawUrl;
let dbHost = 'unknown';
let dbPort = 'unknown';

if (rawUrl) {
  try {
    const urlObj = new URL(rawUrl);
    dbHost = urlObj.hostname;
    dbPort = urlObj.port || (urlObj.protocol === 'postgres:' || urlObj.protocol === 'postgresql:' ? '5432' : 'unknown');

    // Supabase Pooler normalmente usa porta 6543; se estiver faltando/5432, ajusta.
    const isSupabasePooler = /\.pooler\.supabase\.com$/i.test(urlObj.hostname);
    if (false && isSupabasePooler && (!urlObj.port || urlObj.port === '5432')) {
      console.warn('Detectado host Supabase Pooler sem porta 6543; ajustando porta para 6543.');
      urlObj.port = '6543';
    }

    // Garante SSL em ambientes cloud
    if (!urlObj.searchParams.get('sslmode')) {
      urlObj.searchParams.set('sslmode', 'require');
    }

    connectionUrl = urlObj.toString();
    const finalObj = new URL(connectionUrl);
    console.log(`DB host: ${finalObj.hostname}, DB port: ${finalObj.port || 'n/a'}, sslmode: ${finalObj.searchParams.get('sslmode')}`);
  } catch (err) {
    console.warn('Failed to parse DATABASE_URL for normalization:', err.message);
  }
} else {
  console.warn('DATABASE_URL is not set');
}

// Força SSL requerido (compatível com providers gerenciados)
const sql = postgres(connectionUrl, { ssl: 'require' });

sql`SELECT 1`
  .then(() => console.log('Conexão OK!'))
  .catch(err => console.error('Erro de conexão:', err));

export default sql;
