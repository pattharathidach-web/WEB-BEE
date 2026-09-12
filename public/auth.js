/* auth.js
   ระบบ session แบบง่าย ใช้ localStorage จำลองการล็อกอิน
   (ของจริงควรทำฝั่ง server ด้วย session/JWT + hash รหัสผ่าน)
*/
const AUTH_KEY = 'csr_user';
const TOKEN_KEY = 'csr_token';
const ADMIN_SUPPORT = {
  phone: '0649414900',
  email: 'pattharathidach@gmail.com',
};

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
    window.location.href = user.role === 'admin' ? 'dashboard-admin.html' : user.role === 'nurse' ? 'dashboard-nurse.html' : 'dashboard-emp.html';
    return null;
  }
  return user;
}

function paintUser(user) {
  document.querySelectorAll('[data-user-fullname]').forEach(el => el.textContent = user.fullname);
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.roleLabel);
  renderSidebar(user);
  renderHelpMenu(user);
}

function logout() {
  clearUser();
  window.location.href = 'logout.html';
}

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
  document.documentElement.classList.add('ready');
  scheduleSidebar(user);
  return user;
}

function scheduleSidebar(user) {
  const render = () => {
    renderSidebar(user);
    renderHelpMenu(user);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
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

function helpGuideForRole(user) {
  if (user.role === 'admin') {
    return [
      ['จัดการผู้ใช้', 'เข้าเมนู “จัดการผู้ใช้” เพื่อเพิ่ม แก้ไข หรือลบบัญชีผู้ใช้งานในระบบ'],
      ['ดูข้อมูลสุขภาพทั้งหมด', 'เปิดเมนู “ข้อมูลสุขภาพทั้งหมด” เพื่อค้นหาประวัติจากชื่อหรือเลขบัตรประชาชน'],
      ['บันทึกข้อมูลสุขภาพ', 'ใช้เมนู “บันทึกข้อมูลสุขภาพ” เมื่อจำเป็นต้องกรอกข้อมูลสุขภาพให้ผู้ใช้งาน'],
      ['ดูรายงาน', 'เลือกช่วงวันที่ในเมนู “รายงาน” เพื่อดูจำนวนข้อมูลและสรุปสถานะสุขภาพ'],
    ];
  }
  if (user.role === 'nurse') {
    return [
      ['ดูภาพรวม', 'หน้าหลักแสดงจำนวนบันทึกสุขภาพ จำนวนผู้ป่วย และข้อมูลบันทึกล่าสุด'],
      ['ค้นหาประวัติผู้ป่วย', 'เข้าเมนู “ค้นหาประวัติผู้ป่วย” แล้วค้นหาด้วยชื่อ-นามสกุลหรือเลขบัตรประชาชน'],
      ['ดูรายงานสุขภาพ', 'เข้าเมนู “รายงานการตรวจสุขภาพ” และเลือกช่วงวันที่ที่ต้องการตรวจสอบ'],
    ];
  }
  return [
    ['ดูข้อมูลล่าสุด', 'หน้าหลักจะแสดงข้อมูลสุขภาพล่าสุดของคุณและทางลัดไปยังเมนูที่ใช้งานบ่อย'],
    ['บันทึกข้อมูลสุขภาพ', 'กรอกเลขบัตรประชาชน วันที่ น้ำหนัก ส่วนสูง ความดัน และน้ำตาลในเลือด จากนั้นกด “บันทึกข้อมูล” โดยระบบจะคำนวณ BMI ให้อัตโนมัติ'],
    ['ดูข้อมูลย้อนหลัง', 'เข้าเมนู “ข้อมูลสุขภาพย้อนหลัง” เพื่อดูประวัติการตรวจของคุณ'],
    ['ดูกิจกรรม CSR', 'เข้าเมนู “ตารางกิจกรรม CSR” เพื่อดูรายละเอียดกิจกรรมที่จัดขึ้น'],
  ];
}

function renderHelpMenu(user) {
  if (!user || document.getElementById('siteHelpWidget')) return;

  const widget = document.createElement('div');
  widget.id = 'siteHelpWidget';
  widget.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:10000;font-family:Sarabun,sans-serif;';
  widget.innerHTML = `
    <button id="siteHelpButton" type="button" aria-haspopup="true" aria-expanded="false"
      style="display:flex;align-items:center;gap:10px;border:1px solid #a7f3d0;background:#fff;color:#065f46;padding:14px 18px;border-radius:18px;font-size:16px;font-weight:700;box-shadow:0 12px 32px rgba(15,23,42,.16);cursor:pointer;min-width:150px;justify-content:center;">
      <span style="font-size:22px;line-height:1;">❔</span>
      <span>ช่วยเหลือ</span>
      <span style="font-size:12px;color:#64748b;">▲</span>
    </button>

    <div id="siteHelpDropdown" hidden
      style="position:absolute;right:0;bottom:calc(100% + 10px);width:320px;background:#fff;border:1px solid #d1fae5;border-radius:18px;padding:9px;box-shadow:0 20px 50px rgba(15,23,42,.20);">
      <button type="button" data-help-action="guide"
        style="width:100%;display:flex;gap:14px;align-items:flex-start;text-align:left;border:0;background:#fff;padding:15px;border-radius:14px;cursor:pointer;color:#1f2937;">
        <span style="font-size:24px;">📘</span>
        <span><strong style="display:block;font-size:15px;margin-bottom:3px;">วิธีใช้งานเว็บไซต์</strong><small style="color:#64748b;font-size:12px;">ดูขั้นตอนการใช้งานตามสิทธิ์ของคุณ</small></span>
      </button>
      <div style="height:1px;background:#f1f5f9;margin:2px 6px;"></div>
      <button type="button" data-help-action="contact"
        style="width:100%;display:flex;gap:14px;align-items:flex-start;text-align:left;border:0;background:#fff;padding:15px;border-radius:14px;cursor:pointer;color:#1f2937;">
        <span style="font-size:24px;">🛠️</span>
        <span><strong style="display:block;font-size:15px;margin-bottom:3px;">พบปัญหา / ติดต่อ Admin</strong><small style="color:#64748b;font-size:12px;">ติดต่อผู้ดูแลระบบได้ทันที</small></span>
      </button>
    </div>
  `;
  document.body.appendChild(widget);

  if (!document.getElementById('siteHelpResponsiveStyle')) {
    const helpStyle = document.createElement('style');
    helpStyle.id = 'siteHelpResponsiveStyle';
    helpStyle.textContent = `
      @media (max-width: 640px) {
        #siteHelpWidget { right: 14px !important; bottom: 14px !important; }
        #siteHelpDropdown { width: min(320px, calc(100vw - 28px)) !important; }
      }
    `;
    document.head.appendChild(helpStyle);
  }

  const overlay = document.createElement('div');
  overlay.id = 'siteHelpModal';
  overlay.hidden = true;
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.48);padding:24px;display:none;align-items:center;justify-content:center;font-family:Sarabun,sans-serif;';
  overlay.innerHTML = `
    <section role="dialog" aria-modal="true" aria-labelledby="siteHelpModalTitle"
      style="width:min(92vw,560px);max-height:82vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 24px 70px rgba(15,23,42,.28);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 22px 14px;border-bottom:1px solid #ecfdf5;position:sticky;top:0;background:#fff;">
        <h2 id="siteHelpModalTitle" style="margin:0;color:#065f46;font-size:19px;font-weight:700;"></h2>
        <button id="siteHelpClose" type="button" aria-label="ปิด"
          style="border:0;background:#f1f5f9;color:#475569;width:34px;height:34px;border-radius:10px;font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div id="siteHelpModalBody" style="padding:20px 22px 24px;color:#334155;font-size:14px;line-height:1.65;"></div>
    </section>
  `;
  document.body.appendChild(overlay);

  const button = widget.querySelector('#siteHelpButton');
  const dropdown = widget.querySelector('#siteHelpDropdown');
  const modalTitle = overlay.querySelector('#siteHelpModalTitle');
  const modalBody = overlay.querySelector('#siteHelpModalBody');
  const closeButton = overlay.querySelector('#siteHelpClose');

  function setDropdown(open) {
    dropdown.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  }

  function openModal(type) {
    setDropdown(false);
    if (type === 'guide') {
      modalTitle.textContent = '📘 วิธีใช้งานเว็บไซต์';
      const steps = helpGuideForRole(user);
      modalBody.innerHTML = `
        <p style="margin:0 0 14px;color:#64748b;">คู่มือสำหรับ <strong style="color:#065f46;">${user.roleLabel || user.role}</strong></p>
        <div style="display:grid;gap:10px;">
          ${steps.map((step, index) => `
            <div style="display:flex;gap:12px;padding:13px 14px;background:#f8fafc;border:1px solid #ecfdf5;border-radius:14px;">
              <div style="flex:0 0 30px;width:30px;height:30px;border-radius:9px;background:#d1fae5;color:#047857;font-weight:700;display:flex;align-items:center;justify-content:center;">${index + 1}</div>
              <div><strong style="display:block;color:#1f2937;margin-bottom:3px;">${step[0]}</strong><span style="color:#64748b;">${step[1]}</span></div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      modalTitle.textContent = '🛠️ ติดต่อ Admin';
      modalBody.innerHTML = `
        <p style="margin:0 0 16px;color:#64748b;">หากเว็บไซต์ใช้งานไม่ได้ บันทึกข้อมูลไม่สำเร็จ หรือพบข้อผิดพลาด สามารถติดต่อผู้ดูแลระบบได้โดยตรง</p>
        <div style="display:grid;gap:11px;">
          <a href="tel:${ADMIN_SUPPORT.phone}" style="display:flex;align-items:center;gap:12px;padding:14px 15px;border:1px solid #d1fae5;border-radius:14px;text-decoration:none;color:#065f46;background:#f0fdf4;">
            <span style="font-size:22px;">📞</span>
            <span><small style="display:block;color:#64748b;margin-bottom:2px;">โทรศัพท์</small><strong>064-941-4900</strong></span>
          </a>
          <a href="mailto:${ADMIN_SUPPORT.email}" style="display:flex;align-items:center;gap:12px;padding:14px 15px;border:1px solid #d1fae5;border-radius:14px;text-decoration:none;color:#065f46;background:#f0fdf4;word-break:break-word;">
            <span style="font-size:22px;">✉️</span>
            <span><small style="display:block;color:#64748b;margin-bottom:2px;">Email</small><strong>${ADMIN_SUPPORT.email}</strong></span>
          </a>
        </div>
      `;
    }
    overlay.hidden = false;
    overlay.style.display = 'flex';
  }

  function closeModal() {
    overlay.hidden = true;
    overlay.style.display = 'none';
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    setDropdown(dropdown.hidden);
  });

  widget.querySelectorAll('[data-help-action]').forEach(item => {
    item.addEventListener('mouseenter', () => { item.style.background = '#f0fdf4'; });
    item.addEventListener('mouseleave', () => { item.style.background = '#fff'; });
    item.addEventListener('click', () => openModal(item.dataset.helpAction));
  });

  closeButton.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  document.addEventListener('click', (event) => {
    if (!widget.contains(event.target)) setDropdown(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setDropdown(false);
      closeModal();
    }
  });
}
