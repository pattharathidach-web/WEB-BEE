const crypto = require('crypto');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_HEALTH_TABLE = process.env.SUPABASE_HEALTH_TABLE || 'health_records';
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const demoUsers = {
  nurse: {
    password: process.env.DEMO_NURSE_PASSWORD || '1234',
    role: 'nurse',
    roleLabel: 'พยาบาล',
    fullname: 'พยาบาลสมหญิง ใจดี',
  },
  employee: {
    password: process.env.DEMO_EMPLOYEE_PASSWORD || '1234',
    role: 'employee',
    roleLabel: 'พนักงาน',
    fullname: 'นายสมชาย รักสุข',
    idcard: '1-2345-67890-12-3',
  },
};

const demoRecords = [
  {
    id: 'r1',
    fullname: 'นายสมชาย รักสุข',
    idcard: '1-2345-67890-12-3',
    date: '2566-11-15',
    weight: 63,
    height: 170,
    bmi: 21.8,
    bp: '115/75',
    sugar: 98,
    note: '',
  },
  {
    id: 'r2',
    fullname: 'นายสมชาย รักสุข',
    idcard: '1-2345-67890-12-3',
    date: '2567-02-10',
    weight: 64,
    height: 170,
    bmi: 22.1,
    bp: '118/78',
    sugar: 105,
    note: '',
  },
  {
    id: 'r3',
    fullname: 'นายสมชาย รักสุข',
    idcard: '1-2345-67890-12-3',
    date: '2567-05-12',
    weight: 65,
    height: 170,
    bmi: 22.5,
    bp: '120/80',
    sugar: 110,
    note: '',
  },
];

let memoryRecords = [...demoRecords];

app.use(express.static(PUBLIC_DIR));
app.use(express.json({ limit: '128kb' }));

function page(file) {
  return (_req, res) => res.sendFile(path.join(PUBLIC_DIR, file));
}

function cleanText(value) {
  return String(value || '').trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function calcBmi(weightKg, heightCm) {
  const weight = toNumber(weightKg);
  const height = toNumber(heightCm);
  if (!weight || !height) return null;
  const meters = height / 100;
  return Math.round((weight / (meters * meters)) * 10) / 10;
}

function toIsoDate(value) {
  const input = cleanText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const thaiDate = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!thaiDate) return null;
  return `${thaiDate[3]}-${thaiDate[2]}-${thaiDate[1]}`;
}

function normalizeRecord(row) {
  const date = toIsoDate(row.date || row.checked_at);
  return {
    id: String(row.id || crypto.randomUUID()),
    fullname: cleanText(row.fullname),
    idcard: cleanText(row.idcard),
    date,
    weight: toNumber(row.weight),
    height: toNumber(row.height),
    bmi: toNumber(row.bmi),
    bp: cleanText(row.bp),
    sugar: toNumber(row.sugar),
    note: cleanText(row.note),
    created_at: row.created_at || null,
  };
}

function validateRecord(payload) {
  const record = normalizeRecord(payload);
  const errors = [];

  if (record.fullname.length < 2) errors.push('กรุณากรอกชื่อ-นามสกุล');
  if (record.idcard.length < 10) errors.push('กรุณากรอกเลขบัตรประชาชนให้ถูกต้อง');
  if (!record.date) errors.push('กรุณาเลือกวันที่ตรวจ');
  if (!record.weight || record.weight < 20 || record.weight > 250) errors.push('น้ำหนักควรอยู่ระหว่าง 20-250 kg');
  if (!record.height || record.height < 80 || record.height > 230) errors.push('ส่วนสูงควรอยู่ระหว่าง 80-230 cm');
  if (!/^\d{2,3}\/\d{2,3}$/.test(record.bp)) errors.push('ความดันโลหิตควรอยู่ในรูปแบบ 120/80');
  if (record.sugar == null || record.sugar < 40 || record.sugar > 500) errors.push('น้ำตาลในเลือดควรอยู่ระหว่าง 40-500 mg/dL');

  record.bmi = calcBmi(record.weight, record.height);
  return { record, errors };
}

function createToken(user) {
  const payload = Buffer.from(JSON.stringify({
    username: user.username,
    role: user.role,
    fullname: user.fullname,
    idcard: user.idcard || null,
    exp: Date.now() + 1000 * 60 * 60 * 8,
  })).toString('base64url');
  const secret = process.env.SESSION_SECRET || 'dev-only-secret-change-me';
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readToken(req) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const secret = process.env.SESSION_SECRET || 'dev-only-secret-change-me';
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return user.exp > Date.now() ? user : null;
  } catch {
    return null;
  }
}

function requireApiAuth(role) {
  return (req, res, next) => {
    const user = readToken(req);
    if (!user) return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบใหม่' });
    if (role && user.role !== role) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งานส่วนนี้' });
    req.user = user;
    next();
  };
}

function supabaseHeaders(prefer) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'content-type': 'application/json',
    ...(prefer ? { prefer } : {}),
  };
}

async function supabaseFetch(pathname, options = {}) {
  const base = SUPABASE_URL.replace(/\/$/, '');
  const response = await fetch(`${base}/rest/v1/${pathname}`, {
    ...options,
    headers: { ...supabaseHeaders(options.prefer), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase error ${response.status}: ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function listRecords(filters = {}) {
  if (!hasSupabase) return applyRecordFilters(memoryRecords, filters);

  const params = new URLSearchParams({ select: '*', order: 'date.asc' });
  if (filters.fullname) params.set('fullname', `eq.${filters.fullname}`);
  if (filters.idcard) params.set('idcard', `eq.${filters.idcard}`);
  if (filters.from) params.set('date', `gte.${filters.from}`);
  if (filters.to) params.append('date', `lte.${filters.to}`);

  const rows = await supabaseFetch(`${SUPABASE_HEALTH_TABLE}?${params.toString()}`);
  return applyRecordFilters(rows.map(normalizeRecord), filters);
}

function applyRecordFilters(records, filters) {
  const q = cleanText(filters.search).toLowerCase();
  return records
    .map(normalizeRecord)
    .filter((record) => !filters.fullname || record.fullname === filters.fullname)
    .filter((record) => !filters.idcard || record.idcard === filters.idcard)
    .filter((record) => !filters.from || record.date >= filters.from)
    .filter((record) => !filters.to || record.date <= filters.to)
    .filter((record) => !q || record.fullname.toLowerCase().includes(q) || record.idcard.toLowerCase().includes(q))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function insertRecord(record) {
  const saved = { ...record, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  if (!hasSupabase) {
    memoryRecords.push(saved);
    return saved;
  }

  const rows = await supabaseFetch(SUPABASE_HEALTH_TABLE, {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify(saved),
  });
  return normalizeRecord(rows[0]);
}

function buildSummary(records) {
  const total = records.length;
  const normal = records.filter((r) => r.bmi >= 18.5 && r.bmi < 23 && r.sugar < 100).length;
  const abnormal = records.filter((r) => r.bmi >= 25 || r.sugar >= 126).length;
  const risk = Math.max(total - normal - abnormal, 0);
  return {
    total,
    patients: new Set(records.map((r) => r.idcard)).size,
    normal,
    risk,
    abnormal,
    latest: records[records.length - 1] || null,
  };
}

app.get('/', page('login.html'));
app.get('/logout', page('logout.html'));
app.get('/dashboard-nurse', page('dashboard-nurse.html'));
app.get('/record-health', page('record-health.html'));
app.get('/history', page('history.html'));
app.get('/report', page('report.html'));
app.get('/dashboard-emp', page('dashboard-emp.html'));
app.get('/record-health-emp', page('record-health.html'));
app.get('/history-emp', page('history-emp.html'));
app.get('/csr-schedule', page('csr-schedule.html'));

app.get('/news', (_req, res) => res.send('<h1 style="text-align:center; margin-top:50px;">หน้าข่าวสารประชาสัมพันธ์ (กำลังพัฒนา)</h1><a href="/dashboard-emp">กลับหน้าหลัก</a>'));
app.get('/profile', (_req, res) => res.send('<h1 style="text-align:center; margin-top:50px;">หน้าโปรไฟล์ส่วนตัว (กำลังพัฒนา)</h1><a href="/dashboard-emp">กลับหน้าหลัก</a>'));
app.get('/health-guide', (_req, res) => res.send('<h1 style="text-align:center; margin-top:50px;">หน้าคู่มือสุขภาพ (กำลังพัฒนา)</h1><a href="/dashboard-emp">กลับหน้าหลัก</a>'));

app.post('/api/login', (req, res) => {
  const username = cleanText(req.body.username).toLowerCase();
  const password = String(req.body.password || '');
  const match = demoUsers[username];

  if (!match || match.password !== password) {
    return res.status(400).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
  }

  const user = { username, role: match.role, roleLabel: match.roleLabel, fullname: match.fullname, idcard: match.idcard || null };
  res.json({ success: true, user, token: createToken(user), redirect: match.role === 'nurse' ? '/dashboard-nurse' : '/dashboard-emp' });
});

app.get('/api/me', requireApiAuth(), (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/api/health-records', requireApiAuth(), async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      fullname: req.user.role === 'employee' ? req.user.fullname : req.query.fullname,
      idcard: req.user.role === 'employee' ? req.user.idcard : req.query.idcard,
      from: toIsoDate(req.query.from),
      to: toIsoDate(req.query.to),
    };
    const records = await listRecords(filters);
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดข้อมูลสุขภาพได้' });
  }
});

app.post('/api/health-records', requireApiAuth('employee'), async (req, res) => {
  req.body.fullname = req.user.fullname;
  req.body.idcard = req.user.idcard;
  const { record, errors } = validateRecord(req.body);
  if (errors.length) return res.status(422).json({ success: false, message: errors[0], errors });

  try {
    const saved = await insertRecord(record);
    res.status(201).json({ success: true, record: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});

app.get('/api/reports/health-summary', requireApiAuth('nurse'), async (req, res) => {
  try {
    const records = await listRecords({ from: toIsoDate(req.query.from), to: toIsoDate(req.query.to) });
    res.json({ success: true, summary: buildSummary(records) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดรายงานได้' });
  }
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
