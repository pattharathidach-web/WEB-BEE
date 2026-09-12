/* auth.js
   ระบบ session แบบง่าย ใช้ localStorage จำลองการล็อกอิน
   (ของจริงควรทำฝั่ง server ด้วย session/JWT + hash รหัสผ่าน)
*/
const AUTH_KEY = 'csr_user';
const TOKEN_KEY = 'csr_token';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch (e) {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearUser() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * เรียกทุกหน้าที่ต้องล็อกอินก่อนใช้งาน
 * @param {string|null} requiredRole 'nurse' | 'employee' | null (ไม่จำกัด role)
 * @returns {object|null} user object หรือ null ถ้าไม่ผ่าน (จะ redirect ไปเอง)
 */
function requireAuth(requiredRole) {
  const user = getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (user.role === 'admin') return user;
  if (requiredRole && user.role !== requiredRole) {
    // ล็อกอินอยู่ แต่ role ไม่ตรงกับหน้านี้ -> เด้งกลับ dashboard ของตัวเอง
    window.location.href = user.role === 'admin' ? 'dashboard-admin.html' : user.role === 'nurse' ? 'dashboard-nurse.html' : 'dashboard-emp.html';
    return null;
  }
  return user;
}

/** เติมชื่อผู้ใช้ปัจจุบันลงใน element ที่มี data-user-fullname / data-user-role */
function paintUser(user) {
  document.querySelectorAll('[data-user-fullname]').forEach(el => el.textContent = user.fullname);
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.roleLabel);
  renderSidebar(user);
}

function logout() {
  clearUser();
  window.location.href = 'logout.html';
}

/**
 * เรียกใน <head> ก่อน body จะ render เพื่อกัน "เนื้อหาแวบ" ก่อนโดน redirect
 * ทำงานแบบ synchronous เพราะ localStorage เป็น sync API
 * ต้องเรียกคู่กับ <html style="visibility:hidden"> แล้วค่อยเปิดทีหลังใน early-guard
 */
function guardPage(requiredRole) {
  const user = getUser();
  if (!user) {
    window.location.replace('login.html');
    return null;
  }
  if (user.role === 'admin') {
    document.documentElement.classList.add('ready');
    scheduleSidebar(user);
    return user;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.replace(user.role === 'admin' ? 'dashboard-admin.html' : user.role === 'nurse' ? 'dashboard-nurse.html' : 'dashboard-emp.html');
    return null;
  }
  // ผ่านการตรวจสอบแล้ว -> เปิดให้ page แสดงผลแบบ fade นุ่มๆ
  document.documentElement.classList.add('ready');
  scheduleSidebar(user);
  return user;
}

function scheduleSidebar(user) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderSidebar(user), { once: true });
  } else {
    renderSidebar(user);
  }
}

function sidebarMenus(user) {
  if (user.role === 'admin') {
    return [
      { href: 'dashboard-admin.html', icon: '🛠️', label: 'จัดการผู้ใช้' },
      { href: 'dashboard-nurse.html', icon: '📊', label: 'ภาพรวมพยาบาล' },
      { href: 'history.html', icon: '🔍', label: 'ข้อมูลสุขภาพทั้งหมด' },
      { href: 'record-health.html', icon: '📝', label: 'บันทึกข้อมูลสุขภาพ' },
      { href: 'report.html', icon: '📈', label: 'รายงาน' },
    ];
  }
  if (user.role === 'nurse') {
    return [
      { href: 'dashboard-nurse.html', icon: '🏠', label: 'หน้าหลัก' },
      { href: 'history.html', icon: '🔍', label: 'ค้นหาประวัติผู้ป่วย' },
      { href: 'report.html', icon: '📊', label: 'รายงานการตรวจสุขภาพ' },
    ];
  }
  return [
    { href: 'dashboard-emp.html', icon: '🏠', label: 'หน้าหลัก' },
    { href: 'record-health.html', icon: '📝', label: 'บันทึกข้อมูลสุขภาพ' },
    { href: 'history-emp.html', icon: '📊', label: 'ข้อมูลสุขภาพย้อนหลัง' },
    { href: 'csr-schedule.html', icon: '📅', label: 'ตารางกิจกรรม CSR' },
  ];
}

function renderSidebar(user) {
  const aside = document.querySelector('aside');
  if (!aside || !user) return;

  const current = (window.location.pathname.split('/').pop() || 'login.html').replace(/\.html$/, '');
  const links = sidebarMenus(user).map(item => {
    const target = item.href.replace(/\.html$/, '');
    const active = current === target;
    const className = active
      ? 'flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm shadow-sm transition'
      : 'flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-xl text-sm transition';
    return `<a href="${item.href}"${active ? ' aria-current="page"' : ''} class="${className}"><span class="w-5">${item.icon}</span> ${item.label}</a>`;
  }).join('');

  aside.className = 'w-64 bg-emerald-800 text-emerald-50 flex flex-col justify-between p-4';
  aside.innerHTML = `
    <div>
      <div class="flex justify-center p-3 mb-6 bg-white/10 rounded-xl">
        <img
          src="assets/bee-logo.webp"
          alt="ตลาดสดใส ใส่ใจน้ำตาล"
          class="w-28 h-28 object-contain"
          width="112"
          height="112"
        >
      </div>
      <nav class="space-y-1">${links}</nav>
    </div>
    <a href="#" onclick="logout(); return false;" class="flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 text-red-300 rounded-xl text-sm transition"><span>🚪</span> ออกจากระบบ</a>
  `;
}
