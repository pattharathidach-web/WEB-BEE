/* data.js
   ตัวกลางข้อมูลสุขภาพ: หน้าเว็บเรียก API ฝั่ง server แทนการเก็บข้อมูลใน browser
*/

function authHeader() {
  const token = localStorage.getItem('csr_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
  }
  return data;
}

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

async function getRecords(params) {
  const data = await apiJson(`/api/health-records${buildQuery(params)}`);
  return data.records || [];
}

async function addRecord(record) {
  const data = await apiJson('/api/health-records', {
    method: 'POST',
    body: JSON.stringify(record),
  });
  return data.record;
}

async function getHealthSummary(params) {
  const data = await apiJson(`/api/reports/health-summary${buildQuery(params)}`);
  return data.summary;
}

function calcBmi(weightKg, heightCm) {
  const weight = Number(weightKg);
  const height = Number(heightCm);
  if (!weight || !height) return null;
  const meters = height / 100;
  return Math.round((weight / (meters * meters)) * 10) / 10;
}

function bmiStatus(bmi) {
  if (bmi == null) return { label: '-', color: 'text-gray-500' };
  if (bmi < 18.5) return { label: 'น้ำหนักน้อย', color: 'text-blue-600' };
  if (bmi < 23) return { label: 'ปกติ', color: 'text-emerald-600' };
  if (bmi < 25) return { label: 'ท้วม', color: 'text-yellow-600' };
  return { label: 'อ้วน', color: 'text-red-600' };
}

function formatThaiDate(value) {
  if (!value) return '-';
  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function sortByDateAsc(records) {
  return records.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
