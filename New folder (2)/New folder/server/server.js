const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const { predictImage }       = require('./services/cvModel');
const { router: authRouter, requireAuth } = require('./routes/auth');
const { stmts }              = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Auth routes (public — no JWT required) ────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Static uploads ────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_JSON     = path.join(__dirname, 'data', 'db.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

app.use('/uploads', express.static(UPLOADS_DIR));

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + suffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// ── JSON DB helpers ───────────────────────────────────────────────────────────
function readDb()     { try { return JSON.parse(fs.readFileSync(DB_JSON, 'utf8') || '[]'); } catch { return []; } }
function writeDb(data){ fs.writeFileSync(DB_JSON, JSON.stringify(data, null, 2)); }

// ── Protected API routes (require JWT) ────────────────────────────────────────

// POST /api/predict
app.post('/api/predict', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

    const {
      hospitalName  = 'City General Hospital',
      block         = 'A',
      floorNumber   = '1',
      roomNumber    = '101',
      bathroomId    = 'N/A',
      inspectorName = req.user.name,
    } = req.body;

    const evaluation = await predictImage(req.file);

    const record = {
      id:            `INS-${Math.floor(1000 + Math.random() * 9000)}-${block.toUpperCase()}`,
      timestamp:     new Date().toISOString(),
      hospitalName,
      block,
      floorNumber,
      roomNumber,
      bathroomId,
      inspectorName,
      score:         evaluation.score,
      status:        evaluation.status,
      confidence:    evaluation.confidence,
      issues:        evaluation.issues,
      recommendations: evaluation.recommendations,
      imageUrl:      `/uploads/${req.file.filename}`,
      inspectorId:   req.user.id,
    };

    const db = readDb();
    db.unshift(record);
    writeDb(db);

    res.json(record);
  } catch (err) {
    console.error('Predict error:', err);
    res.status(500).json({ error: 'Failed to analyse image.' });
  }
});

// GET /api/inspections
app.get('/api/inspections', requireAuth, (req, res) => {
  const db = readDb();
  // Inspectors only see their own; managers/admins see all
  const filtered = (req.user.role === 'inspector')
    ? db.filter(r => r.inspectorId === req.user.id)
    : db;
  res.json(filtered);
});

// POST /api/inspections
app.post('/api/inspections', requireAuth, (req, res) => {
  try {
    const r = req.body;
    if (!r.hospitalName || r.score == null) {
      return res.status(400).json({ error: 'hospitalName and score are required.' });
    }
    const record = { ...r, id: r.id || `INS-${Date.now()}`, timestamp: r.timestamp || new Date().toISOString() };
    const db = readDb();
    db.unshift(record);
    writeDb(db);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save inspection.' });
  }
});

// GET /api/trends
app.get('/api/trends', requireAuth, (req, res) => {
  try {
    const db = readDb();
    const data = (req.user.role === 'inspector')
      ? db.filter(r => r.inspectorId === req.user.id)
      : db;

    const total = data.length;
    if (total === 0) {
      return res.json({ todayCount: 0, avgScore: 0,
        statusCounts: { 'Very Clean': 0, Clean: 0, 'Needs Attention': 0, Dirty: 0 },
        issueFrequency: {}, dailyTrends: [] });
    }

    const todayStr  = new Date().toISOString().split('T')[0];
    const todayCount = data.filter(r => r.timestamp.startsWith(todayStr)).length;
    const avgScore   = Math.round(data.reduce((a, r) => a + r.score, 0) / total);
    const statusCounts = { 'Very Clean': 0, 'Clean': 0, 'Needs Attention': 0, 'Dirty': 0 };
    data.forEach(r => { if (statusCounts[r.status] !== undefined) statusCounts[r.status]++; });

    const issueFrequency = {};
    data.forEach(r => (r.issues || []).forEach(i => { issueFrequency[i] = (issueFrequency[i] || 0) + 1; }));

    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dailyMap[d.toISOString().split('T')[0]] = { count: 0, sum: 0 };
    }
    data.forEach(r => {
      const ds = r.timestamp.split('T')[0];
      if (dailyMap[ds]) { dailyMap[ds].count++; dailyMap[ds].sum += r.score; }
    });
    const dailyTrends = Object.keys(dailyMap).map(ds => ({
      date: ds.split('-').slice(1).join('/'),
      avgScore: dailyMap[ds].count > 0 ? Math.round(dailyMap[ds].sum / dailyMap[ds].count) : null,
      count: dailyMap[ds].count,
    }));

    res.json({ todayCount, avgScore, statusCounts, issueFrequency, dailyTrends });
  } catch (err) {
    res.status(500).json({ error: 'Failed to aggregate trends.' });
  }
});

// ── Public Visitor/Patient Complaint Endpoint (NO LOGIN REQUIRED) ──────────────
app.post('/api/client-report', upload.single('image'), (req, res) => {
  try {
    const {
      block = 'A',
      floorNumber = '1',
      roomNumber = '101',
      bathroomId = 'CGH-A-101-B1',
      hospitalName = 'City General Hospital',
      issueType = 'Unclean Surfaces / Spill',
      notes = ''
    } = req.body;

    const report_id = `ALERT-${Math.floor(1000 + Math.random() * 9000)}-${block.toUpperCase()}`;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    stmts.createClientReport.run({
      report_id,
      block,
      floor_number: floorNumber,
      room_number: roomNumber,
      bathroom_id: bathroomId,
      hospital_name: hospitalName,
      issue_type: issueType,
      notes,
      image_url
    });

    const created = {
      report_id,
      block,
      floor_number: floorNumber,
      room_number: roomNumber,
      bathroom_id: bathroomId,
      hospital_name: hospitalName,
      issue_type: issueType,
      notes,
      image_url,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    console.log(`[CLIENT ALERT] 🚨 New complaint received for Block ${block}, Room ${roomNumber}`);
    res.status(201).json(created);
  } catch (err) {
    console.error('Client report error:', err);
    res.status(500).json({ error: 'Failed to submit alert to staff.' });
  }
});

// ── Worker Alert Notification Endpoints (Protected) ──────────────────────────
app.get('/api/client-reports', requireAuth, (req, res) => {
  try {
    const reports = stmts.listClientReports.all();
    // Filter by block access if inspector
    const filtered = (req.user.role === 'inspector' && req.user.block_access !== 'ALL')
      ? reports.filter(r => req.user.block_access.split(',').includes(r.block.toUpperCase()))
      : reports;
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch client alerts.' });
  }
});

app.post('/api/client-reports/:reportId/resolve', requireAuth, (req, res) => {
  try {
    stmts.resolveClientReport.run(req.user.name, req.params.reportId);
    res.json({ message: 'Alert resolved by staff.', reportId: req.params.reportId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert.' });
  }
});

// ── Serve React build in production ──────────────────────────────────────────
const frontendBuild = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));
}

app.listen(PORT, () => console.log(`CleanVision backend → http://localhost:${PORT}`));
