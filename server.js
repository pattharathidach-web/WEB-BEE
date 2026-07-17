const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- เส้นทางหลัก & Login ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/logout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'logout.html')));

// --- เส้นทางของพยาบาล (สีน้ำเงิน) ---
app.get('/dashboard-nurse', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard-nurse.html')));
app.get('/record-health', (req, res) => res.sendFile(path.join(__dirname, 'public', 'record-health.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'public', 'history.html')));
app.get('/report', (req, res) => res.sendFile(path.join(__dirname, 'public', 'report.html')));

// --- เส้นทางของพนักงาน (สีเขียว) ---
app.get('/dashboard-emp', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard-emp.html')));
app.get('/record-health-emp', (req, res) => res.sendFile(path.join(__dirname, 'public', 'record-health-emp.html')));
app.get('/history-emp', (req, res) => res.sendFile(path.join(__dirname, 'public', 'history-emp.html')));
app.get('/csr-schedule', (req, res) => res.sendFile(path.join(__dirname, 'public', 'csr-schedule.html')));

// เส้นทางจำลองสำหรับหน้าอื่นๆ ที่เหลือ (ใช้ไฟล์เดียวกันชั่วคราวเพื่อให้กดได้)
app.get('/news', (req, res) => res.send('<h1 style="text-align:center; margin-top:50px;">หน้าข่าวสารประชาสัมพันธ์ (กำลังพัฒนา)</h1><a href="/dashboard-emp">กลับหน้าหลัก</a>'));
app.get('/profile', (req, res) => res.send('<h1 style="text-align:center; margin-top:50px;">หน้าโปรไฟล์ส่วนตัว (กำลังพัฒนา)</h1><a href="/dashboard-emp">กลับหน้าหลัก</a>'));
app.get('/health-guide', (req, res) => res.send('<h1 style="text-align:center; margin-top:50px;">หน้าคู่มือสุขภาพ (กำลังพัฒนา)</h1><a href="/dashboard-emp">กลับหน้าหลัก</a>'));

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'employee') {
        res.json({ success: true, role: 'employee', redirect: '/dashboard-emp' });
    } else if (username === 'nurse') {
        res.json({ success: true, role: 'nurse', redirect: '/dashboard-nurse' });
    } else {
        res.status(400).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});