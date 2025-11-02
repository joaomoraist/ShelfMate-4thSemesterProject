import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';

// Carrega e resume o PDF "Requisitos funcionais do projeto.pdf" em appresentation/
// Mantém cache em memória para evitar reprocessamento em cada requisição.

let cachedSummary = null;
let cachedFullText = null;
let lastError = null;

function getPdfAbsolutePath() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Caminho do projeto raiz: backend/src -> volta duas pastas
    const projectRoot = path.resolve(__dirname, '..', '..');
    // Nome do arquivo conforme estrutura do repo
    const pdfPath = path.join(projectRoot, 'appresentation', 'Requisitos funcionais do projeto.pdf');
    return pdfPath;
  } catch (err) {
    lastError = err;
    return null;
  }
}

async function parsePdfToText(absPath) {
  const dataBuffer = fs.readFileSync(absPath);
  const result = await pdfParse(dataBuffer);
  // result.text pode conter muitas quebras; normalizar levemente
  const normalized = String(result.text || '')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return normalized;
}

function summarize(text, maxChars = 1500) {
  // Estratégia simples: usa cabeçalho e primeiros caracteres para evitar tokens excessivos.
  // Em seguida, faz um recorte por parágrafo próximo ao limite.
  if (!text) return null;
  const trimmed = text.slice(0, maxChars);
  // Tentar cortar no fim de parágrafo
  const lastBreak = Math.max(trimmed.lastIndexOf('\n'), trimmed.lastIndexOf('.'));
  const final = lastBreak > 500 ? trimmed.slice(0, lastBreak + 1) : trimmed; // evita resumo muito curto
  return final;
}

export async function getRequirementsText() {
  if (cachedSummary) return cachedSummary;
  const abs = getPdfAbsolutePath();
  if (!abs || !fs.existsSync(abs)) {
    lastError = new Error('Arquivo de requisitos não encontrado no caminho esperado');
    return null;
  }
  try {
    const text = await parsePdfToText(abs);
    cachedFullText = text;
    cachedSummary = summarize(text);
    return cachedSummary;
  } catch (err) {
    lastError = err;
    return null;
  }
}

export function getRequirementsDebug() {
  return { cachedSummary, hasFullText: !!cachedFullText, lastError: lastError ? String(lastError) : null };
}