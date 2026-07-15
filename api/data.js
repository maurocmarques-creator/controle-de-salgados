const { put, list } = require('@vercel/blob');
const SITE_PASSWORD = process.env.SITE_PASSWORD || 'mcm251177';
const BLOB_NAME = 'salgados-data.json';
const defaultData = {
  precos: { "Bauru":8,"Coxinha de frango":10,"Mini pizza de calabresa":10,"Dog":8,"Brownie":10,"Empada":8 },
  vendas: [], reposicoes: [],
  banco: { saldoInicial: 138, movimentos: [] }
};
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, x-site-password');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const password = req.headers['x-site-password'];
  if (!password || password !== SITE_PASSWORD) return res.status(401).json({ error: 'Senha incorreta.' });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: BLOB_NAME, token });
      if (!blobs || blobs.length === 0) {
        await put(BLOB_NAME, JSON.stringify(defaultData), { access:'public', allowOverwrite:true, contentType:'application/json', token });
        return res.status(200).json(defaultData);
      }
      const blobRes = await fetch(blobs[0].downloadUrl);
      if (!blobRes.ok) throw new Error('Blob fetch failed: ' + blobRes.status);
      const data = await blobRes.json();
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      await put(BLOB_NAME, JSON.stringify(body), { access:'public', allowOverwrite:true, contentType:'application/json', token });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Metodo nao permitido.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
};
