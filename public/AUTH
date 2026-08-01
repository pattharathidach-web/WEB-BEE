/* auth.js
   ระบบ session แบบง่าย ใช้ localStorage จำลองการล็อกอิน
   (ของจริงควรทำฝั่ง server ด้วย session/JWT + hash รหัสผ่าน)
*/
const AUTH_KEY = 'csr_user';

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

function clearUser() {
  localStorage.removeItem(AUTH_KEY);
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
  if (requiredRole && user.role !== requiredRole) {
    // ล็อกอินอยู่ แต่ role ไม่ตรงกับหน้านี้ -> เด้งกลับ dashboard ของตัวเอง
    window.location.href = user.role === 'nurse' ? 'dashboard-nurse.html' : 'dashboard-emp.html';
    return null;
  }
  return user;
}

/** เติมชื่อผู้ใช้ปัจจุบันลงใน element ที่มี data-user-fullname / data-user-role */
function paintUser(user) {
  document.querySelectorAll('[data-user-fullname]').forEach(el => el.textContent = user.fullname);
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.roleLabel);
}

function logout() {
  clearUser();
  window.location.href = 'logout.html';
}