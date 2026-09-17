const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const puppeteer = require('puppeteer');
const { PowerShell } = require('node-powershell');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/items', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id, name, created_at FROM items ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post('/api/items', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await pool.query(
      'INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get('/api/screenshot', async (req, res, next) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'url query param is required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    const screenshot = await page.screenshot({ encoding: 'base64' });
    res.json({ screenshot: `data:image/png;base64,${screenshot}` });
  } catch (err) {
    next(err);
  } finally {
    if (browser) await browser.close();
  }
});

app.post('/api/photo-to-pdf', upload.single('photo'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'photo file is required' });
  }

  let browser;
  try {
    const base64Image = req.file.buffer.toString('base64');
    const html = `
      <html>
        <body style="margin:0">
          <img src="data:${req.file.mimetype};base64,${base64Image}" style="width:100%" />
        </body>
      </html>
    `;

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    res.contentType('application/pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    next(err);
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/api/config-check', (req, res) => {
  const appApiKey = process.env.APP_API_KEY;
  if (!appApiKey) {
    throw new Error('Missing required environment variable: APP_API_KEY');
  }
  res.json({ message: 'API key is configured', key_length: appApiKey.length });
});

app.get('/api/system-info', async (req, res, next) => {
  let ps;
  try {
    ps = new PowerShell();
    const result = await ps.invoke('Get-ComputerInfo | ConvertTo-Json');
    res.json({ info: result });
  } catch (err) {
    next(err);
  } finally {
    if (ps) await ps.dispose();
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

async function start() {
  await ensureSchema();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
