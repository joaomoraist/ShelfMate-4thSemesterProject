import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL safely to log only host and port (avoid leaking credentials)
const dbUrl = process.env.DATABASE_URL;
let dbHost = 'unknown';
let dbPort = 'unknown';
if (dbUrl) {
	try {
		const urlObj = new URL(dbUrl);
		dbHost = urlObj.hostname;
		dbPort = urlObj.port || (urlObj.protocol === 'postgres:' || urlObj.protocol === 'postgresql:' ? '5432' : 'unknown');
		console.log(`DB host: ${dbHost}, DB port: ${dbPort}`);
	} catch (err) {
		console.warn('Failed to parse DATABASE_URL for host/port:', err.message);
	}
} else {
	console.warn('DATABASE_URL is not set');
}

const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

sql`SELECT 1`
	.then(() => console.log('Conexão OK!'))
	.catch(err => console.error('Erro de conexão:', err));

export default sql;
