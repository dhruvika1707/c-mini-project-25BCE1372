// ─────────────────────────────────────────
//  PAYROLL MANAGEMENT SYSTEM — app.js
//  Mirrors all functions from C source
// ─────────────────────────────────────────

const OT_RATE = 200;
const STORAGE_KEY = 'payroll_employees';

let employees = [];   // in-memory array (mirrors emp[MAX])

// ─── Utility ───────────────────────────────

function generateId() {
  return employees.length > 0
    ? Math.max(...employees.map(e => e.id)) + 1
    : 1001;
}

function formatCurrency(n) {
  return '₹' + parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function getDate() {
  return new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ─── calculateSalary() ─────────────────────
function calculateSalary(emp) {
  emp.grossPay = emp.basicPay + emp.otHours * OT_RATE;

  if (emp.grossPay < 20000)
    emp.tax = emp.grossPay * 0.05;
  else if (emp.grossPay <= 40000)
    emp.tax = emp.grossPay * 0.10;
  else
    emp.tax = emp.grossPay * 0.15;

  emp.netPay = emp.grossPay - emp.tax;
  return emp;
}

// ─── addEmployee() ─────────────────────────
function addEmployee(id, name, basicPay, otHours) {
  const emp = {
    id: parseInt(id),
    name: name.trim(),
    basicPay: parseFloat(basicPay),
    otHours: parseInt(otHours),
    grossPay: 0,
    tax: 0,
    netPay: 0
  };
  calculateSalary(emp);
  employees.push(emp);
  toast('Employee added successfully!', 'success');
  refreshUI();
}

// ─── updateEmployee() ──────────────────────
function updateEmployee(id, name, basicPay, otHours) {
  const idx = employees.findIndex(e => e.id === parseInt(id));
  if (idx === -1) { toast('Employee not found!', 'error'); return false; }

  employees[idx].name = name.trim();
  employees[idx].basicPay = parseFloat(basicPay);
  employees[idx].otHours = parseInt(otHours);
  calculateSalary(employees[idx]);

  toast('Employee updated successfully!', 'success');
  refreshUI();
  return true;
}

// ─── deleteEmployee() ──────────────────────
function deleteEmployee(id) {
  const idx = employees.findIndex(e => e.id === parseInt(id));
  if (idx === -1) { toast('Employee not found!', 'error'); return false; }

  employees.splice(idx, 1);   // mirrors shifting array in C
  toast('Employee deleted successfully!', 'success');
  refreshUI();
  return true;
}

// ─── displayPayslip() ──────────────────────
function displayPayslip(id) {
  const emp = employees.find(e => e.id === parseInt(id));
  if (!emp) { toast('Employee not found!', 'error'); return; }

  const container = document.getElementById('payslip-output');
  container.innerHTML = `
    <div class="payslip-card">
      <div class="payslip-header">
        <div>
          <div class="co">PayRoll Co.</div>
          <div class="date">Generated: ${getDate()}</div>
        </div>
        <div class="slip-badge">Payslip</div>
      </div>
      <div class="payslip-emp">
        <div class="emp-name">${emp.name}</div>
        <div class="emp-id">Employee ID: #${emp.id}</div>
      </div>
      <div class="payslip-rows">
        <div class="payslip-row">
          <span class="label">Basic Pay</span>
          <span class="val green">${formatCurrency(emp.basicPay)}</span>
        </div>
        <div class="payslip-row">
          <span class="label">Overtime Hours</span>
          <span class="val">${emp.otHours} hrs</span>
        </div>
        <div class="payslip-row">
          <span class="label">OT Amount (${formatCurrency(OT_RATE)}/hr)</span>
          <span class="val green">${formatCurrency(emp.otHours * OT_RATE)}</span>
        </div>
        <div class="payslip-row">
          <span class="label">Gross Pay</span>
          <span class="val green">${formatCurrency(emp.grossPay)}</span>
        </div>
        <div class="payslip-row">
          <span class="label">Tax Deduction</span>
          <span class="val red">− ${formatCurrency(emp.tax)}</span>
        </div>
      </div>
      <div class="payslip-net">
        <div class="label">Net Pay (Take Home)</div>
        <div class="amount">${formatCurrency(emp.netPay)}</div>
      </div>
    </div>
  `;
}

// ─── saveToFile() ──────────────────────────
// Mirrors fprintf to employees.txt — here we do localStorage + JSON download
function saveToFile() {
  const data = JSON.stringify(employees, null, 2);
  localStorage.setItem(STORAGE_KEY, data);

  // Also trigger a .json file download (tangible "file save")
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employees.json';
  a.click();
  URL.revokeObjectURL(url);

  toast('Records saved to file successfully!', 'success');
}

// ─── loadFromFile() ────────────────────────
// Mirrors fscanf — reads from localStorage + supports JSON file upload
function loadFromFile() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    toast('No saved records found.', 'error');
    return;
  }
  try {
    employees = JSON.parse(stored);
    toast(`Records loaded! (${employees.length} employees)`, 'success');
    refreshUI();
  } catch {
    toast('Error parsing saved records.', 'error');
  }
}

function loadFromFileUpload(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      employees = JSON.parse(e.target.result);
      toast(`Loaded ${employees.length} employee(s) from file.`, 'success');
      refreshUI();
    } catch {
      toast('Invalid file format.', 'error');
    }
  };
  reader.readAsText(file);
}

// ─── refreshUI() ───────────────────────────
function refreshUI() {
  renderTable();
  renderStats();
  renderPayslipDropdown();
  renderUpdateDropdown();
  renderDeleteList();
}

// ─── Render Employee Table ─────────────────
function renderTable(filter = '') {
  const tbody = document.getElementById('emp-tbody');
  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(filter.toLowerCase()) ||
    String(e.id).includes(filter)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No employees found.<br>Add one using the sidebar.</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td class="td-id">#${e.id}</td>
      <td class="td-name">${e.name}</td>
      <td>${formatCurrency(e.basicPay)}</td>
      <td>${e.otHours} hrs</td>
      <td>${formatCurrency(e.grossPay)}</td>
      <td class="td-pay">${formatCurrency(e.netPay)}</td>
      <td>
        <div class="td-actions">
          <button class="icon-btn view" title="View Payslip" onclick="quickPayslip(${e.id})">👁</button>
          <button class="icon-btn edit" title="Edit" onclick="openEditModal(${e.id})">✏️</button>
          <button class="icon-btn del" title="Delete" onclick="confirmDelete(${e.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderStats() {
  document.getElementById('stat-total').textContent = employees.length;
  const totalNet = employees.reduce((s, e) => s + e.netPay, 0);
  const totalGross = employees.reduce((s, e) => s + e.grossPay, 0);
  document.getElementById('stat-payroll').textContent = formatCurrency(totalNet);
  document.getElementById('stat-gross').textContent = formatCurrency(totalGross);
}

function renderPayslipDropdown() {
  const sel = document.getElementById('payslip-id');
  sel.innerHTML = `<option value="">— Select Employee —</option>` +
    employees.map(e => `<option value="${e.id}">#${e.id} — ${e.name}</option>`).join('');
}

function renderUpdateDropdown() {
  const sel = document.getElementById('update-id-select');
  sel.innerHTML = `<option value="">— Select Employee —</option>` +
    employees.map(e => `<option value="${e.id}">#${e.id} — ${e.name}</option>`).join('');
}

function renderDeleteList() {
  const list = document.getElementById('delete-list');
  if (employees.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🗑</div><p>No employees to delete.</p></div>`;
    return;
  }
  list.innerHTML = employees.map(e => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border);">
      <div>
        <span style="color:var(--accent);font-weight:500;">#${e.id}</span>
        <span style="margin-left:12px;">${e.name}</span>
        <span style="margin-left:12px;color:var(--muted);font-size:11px;">${formatCurrency(e.netPay)} net</span>
      </div>
      <button class="btn btn-danger" style="padding:8px 14px;font-size:10px;" onclick="confirmDelete(${e.id})">Delete</button>
    </div>
  `).join('');
}

// ─── Quick Payslip (from table row) ────────
function quickPayslip(id) {
  switchPanel('payslip');
  const sel = document.getElementById('payslip-id');
  sel.value = id;
  displayPayslip(id);
}

// ─── Edit Modal ────────────────────────────
function openEditModal(id) {
  const emp = employees.find(e => e.id === parseInt(id));
  if (!emp) return;

  document.getElementById('edit-emp-id').value = emp.id;
  document.getElementById('edit-name').value = emp.name;
  document.getElementById('edit-basic').value = emp.basicPay;
  document.getElementById('edit-ot').value = emp.otHours;
  document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

// ─── Delete Confirm Modal ──────────────────
let pendingDeleteId = null;
function confirmDelete(id) {
  const emp = employees.find(e => e.id === parseInt(id));
  if (!emp) return;
  pendingDeleteId = id;
  document.getElementById('del-name').textContent = emp.name;
  document.getElementById('del-modal').classList.add('open');
}
function closeDelModal() {
  document.getElementById('del-modal').classList.remove('open');
  pendingDeleteId = null;
}
function confirmDeleteAction() {
  if (pendingDeleteId !== null) {
    deleteEmployee(pendingDeleteId);
    closeDelModal();
  }
}

// ─── Panel Navigation (menu()) ─────────────
function switchPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  document.querySelector(`[data-panel="${id}"]`).classList.add('active');
}

// ─── Toast ────────────────────────────────
function toast(msg, type = 'success') {
  const icons = { success: '✔', error: '✖', info: 'ℹ' };
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="t-icon">${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ─── Event Listeners (main() bootstrap) ────
document.addEventListener('DOMContentLoaded', () => {

  // Load saved data on start
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { employees = JSON.parse(stored); } catch {}
  }
  refreshUI();

  // ── Add Employee Form ──
  document.getElementById('add-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('add-name').value.trim();
    const basicPay = parseFloat(document.getElementById('add-basic').value);
    const otHours = parseInt(document.getElementById('add-ot').value);

    if (!name) { toast('Name is required.', 'error'); return; }
    if (isNaN(basicPay) || basicPay < 0) { toast('Enter a valid basic pay.', 'error'); return; }
    if (isNaN(otHours) || otHours < 0) { toast('Enter valid OT hours.', 'error'); return; }

    const id = generateId();
    addEmployee(id, name, basicPay, otHours);
    e.target.reset();
    document.getElementById('preview-id').textContent = `Auto ID: #${generateId()}`;
    switchPanel('all');
  });

  // ── Payslip Search ──
  document.getElementById('payslip-id').addEventListener('change', function () {
    if (this.value) displayPayslip(this.value);
    else document.getElementById('payslip-output').innerHTML = '';
  });

  // ── Update: load fields on select ──
  document.getElementById('update-id-select').addEventListener('change', function () {
    const emp = employees.find(e => e.id === parseInt(this.value));
    if (!emp) { clearUpdateForm(); return; }
    document.getElementById('upd-name').value = emp.name;
    document.getElementById('upd-basic').value = emp.basicPay;
    document.getElementById('upd-ot').value = emp.otHours;
    document.getElementById('update-fields').style.display = 'grid';
    document.getElementById('update-submit-wrap').style.display = 'flex';
  });

  document.getElementById('update-form').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('update-id-select').value;
    const name = document.getElementById('upd-name').value.trim();
    const basic = document.getElementById('upd-basic').value;
    const ot = document.getElementById('upd-ot').value;
    if (updateEmployee(id, name, basic, ot)) {
      clearUpdateForm();
      switchPanel('all');
    }
  });

  // ── Edit Modal Submit ──
  document.getElementById('edit-form').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('edit-emp-id').value;
    const name = document.getElementById('edit-name').value;
    const basic = document.getElementById('edit-basic').value;
    const ot = document.getElementById('edit-ot').value;
    if (updateEmployee(id, name, basic, ot)) closeEditModal();
  });

  // ── Search filter ──
  document.getElementById('emp-search').addEventListener('input', function () {
    renderTable(this.value);
  });

  // ── File upload ──
  document.getElementById('file-upload').addEventListener('change', function () {
    if (this.files[0]) loadFromFileUpload(this.files[0]);
  });

  // ── Refresh ID preview ──
  document.getElementById('preview-id').textContent = `Auto ID: #${generateId()}`;
});

function clearUpdateForm() {
  document.getElementById('update-id-select').value = '';
  document.getElementById('update-fields').style.display = 'none';
  document.getElementById('update-submit-wrap').style.display = 'none';
  document.getElementById('upd-name').value = '';
  document.getElementById('upd-basic').value = '';
  document.getElementById('upd-ot').value = '';
}
