/* data.js
   จำลองฐานข้อมูล "บันทึกสุขภาพ" ด้วย localStorage
   (ของจริงควรเก็บใน database ฝั่ง server)
*/
const RECORDS_KEY = 'health_records';

function seedRecordsIfEmpty() {
  if (localStorage.getItem(RECORDS_KEY)) return;
  const seed = [
    { id: 'r1', fullname: 'นายสมชาย รักสุข', idcard: '1-2345-67890-12-3', date: '15/11/2566', weight: 63, height: 170, bmi: 21.8, bp: '115/75', sugar: 98, note: '' },
    { id: 'r2', fullname: 'นายสมชาย รักสุข', idcard: '1-2345-67890-12-3', date: '10/02/2567', weight: 64, height: 170, bmi: 22.1, bp: '118/78', sugar: 105, note: '' },
    { id: 'r3', fullname: 'นายสมชาย รักสุข', idcard: '1-2345-67890-12-3', date: '12/05/2567', weight: 65, height: 170, bmi: 22.5, bp: '120/80', sugar: 110, note: '' }
  ];
  localStorage.setItem(RECORDS_KEY, JSON.stringify(seed));
}

function getRecords() {
  seedRecordsIfEmpty();
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function addRecord(record) {
  const records = getRecords();
  record.id = 'r' + Date.now();
  records.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  return record;
}

function calcBmi(weightKg, heightCm) {
  const h = heightCm / 100;
  if (!h) return null;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

function bmiStatus(bmi) {
  if (bmi == null) return { label: '-', color: 'text-gray-500' };
  if (bmi < 18.5) return { label: 'น้ำหนักน้อย', color: 'text-blue-600' };
  if (bmi < 23) return { label: 'ปกติ', color: 'text-emerald-600' };
  if (bmi < 25) return { label: 'ท้วม', color: 'text-yellow-600' };
  return { label: 'อ้วน', color: 'text-red-600' };
}
