import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Carrega documentação local (README, OpenAPI e schema.sql) e produz um digest
// curto para enriquecer o contexto do chatbot sem estourar o limite de tokens.
// Mantém cache em memória.

let cachedDigest = null;
let lastError = null;

function getProjectRoot() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, '..', '..');
  } catch (err) {
    lastError = err;
    return null;
  }
}

function safeRead(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const text = fs.readFileSync(filePath, 'utf8');
    return String(text)
      .replace(/\r/g, '')
      .trim();
  } catch {
    return null;
  }
}

function summarizeText(text, maxChars = 1800) {
  if (!text) return null;
  const trimmed = text.slice(0, maxChars);
  const lastBreak = Math.max(trimmed.lastIndexOf('\n'), trimmed.lastIndexOf('.'));
  return lastBreak > 400 ? trimmed.slice(0, lastBreak + 1) : trimmed;
}

function summarizeOpenAPI(jsonText, maxItems = 40) {
  try {
    const obj = JSON.parse(jsonText);
    const lines = [];
    const paths = obj.paths || {};
    for (const p of Object.keys(paths)) {
      const methods = paths[p] || {};
      for (const method of Object.keys(methods)) {
        const summary = methods[method]?.summary || '';
        lines.push(`${method.toUpperCase()} ${p} – ${summary}`);
      }
    }
    return lines.slice(0, maxItems).join('\n');
  } catch {
    return null;
  }
}

export function getDocsDebug() {
  return { cachedDigest, lastError: lastError ? String(lastError) : null };
}

export async function getDocsDigest() {
  if (cachedDigest) return cachedDigest;
  const root = getProjectRoot();
  if (!root) return null;

  const frontendReadme = safeRead(path.join(root, 'frontend', 'README.md'));
  const backendReadme = safeRead(path.join(root, 'backend', 'README.md'));
  const repoReadme = safeRead(path.join(root, 'README.md'));
  const dbReadme = safeRead(path.join(root, 'database', 'README.md'));
  const schemaSql = safeRead(path.join(root, 'database', 'schema.sql'));
  const openapiJson = safeRead(path.join(root, 'backend', 'src', 'openapi.json'));

  const parts = [];
  if (repoReadme) parts.push('--- README do Repositório ---\n' + summarizeText(repoReadme, 1200));
  if (backendReadme) parts.push('--- Backend README ---\n' + summarizeText(backendReadme, 800));
  if (frontendReadme) parts.push('--- Frontend README ---\n' + summarizeText(frontendReadme, 800));
  if (dbReadme) parts.push('--- Database README ---\n' + summarizeText(dbReadme, 600));
  if (schemaSql) parts.push('--- Trecho do schema.sql ---\n' + summarizeText(schemaSql, 1200));
  if (openapiJson) {
    const apiSummary = summarizeOpenAPI(openapiJson, 60);
    if (apiSummary) parts.push('--- OpenAPI Endpoints ---\n' + apiSummary);
  }

  const digest = parts.join('\n\n');
  cachedDigest = digest || null;
  return cachedDigest;
}