/**
 * app.js — RDSS Dashboard Application Logic
 */

/* ===========================
   STATE
=========================== */
let activeFY = '25';
let isAdmin = false;
let currentViewId = null;

// Credentials (in a real app, this would be server-side auth)
const ADMIN_CREDENTIALS = { username: 'rdss', password: 'project@123' };

/* ===========================
   HELPERS
=========================== */
const $ = id => document.getElementById(id);
const fmt = (v, d = 2) => v ? Number(v).toFixed(d) : '0';
const fmtOrDash = v => v ? v : '—';

function statusBadge(status) {
  if (status === 'Completed') return `<span class="badge badge-completed">✔ Completed</span>`;
  if (status === 'In Progress') return `<span class="badge badge-inprogress">⟳ In Progress</span>`;
  return `<span class="badge badge-notstarted">— Not Started</span>`;
}

function showToast(msg = 'Done!', color = '#0e9f6e') {
  const t = $('toast');
  t.textContent = msg;
  t.style.background = color;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

function confirm(msg) {
  return window.confirm(msg);
}

/* ===========================
   RENDER DASHBOARD
=========================== */
function renderDashboard() {
  const works = Data.getByFY(activeFY);

  // Stats
  const completed = works.filter(w => w.status === 'Completed');
  const inProgress = works.filter(w => w.status === 'In Progress');
  const notStarted = works.filter(w => w.status === 'Not Started');
  const totalAmt = works.reduce((s, w) => s + (Number(w.estimateAmount) || 0), 0);
  const totalLines = works.reduce((s, w) =>
    s + (Number(w.line33kv) || 0) + (Number(w.line11kv) || 0) + (Number(w.ltLine) || 0), 0);

  $('statTotal').textContent = works.length;
  $('statCompleted').textContent = completed.length;
  $('statInProgress').textContent = inProgress.length;
  $('statNotStarted').textContent = notStarted.length;
  $('statAmount').textContent = fmt(totalAmt) + ' L';
  $('statLines').textContent = fmt(totalLines, 1) + ' Km';

  // Detail title
  $('detailTableTitle').textContent = `Detailed Work Records (All Divisions - FY ${activeFY})`;

  // Division summary
  const divisions = ['Mandsaur', 'Malhargarh', 'Garoth', 'Sitamau'];
  const summaryBody = $('summaryBody');
  summaryBody.innerHTML = '';

  divisions.forEach(div => {
    const dWorks = works.filter(w => w.division === div);
    if (!dWorks.length) return;
    const done = dWorks.filter(w => w.status === 'Completed').length;
    const pct = Math.round((done / dWorks.length) * 100);
    const sum = (key) => dWorks.reduce((s, w) => s + (Number(w[key]) || 0), 0);

    summaryBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><strong>${div}</strong></td>
        <td>${dWorks.length}</td>
        <td>
          <div class="progress-bar-wrap">
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
            <span>${done}/${dWorks.length} (${pct}%)</span>
          </div>
        </td>
        <td>${fmt(sum('line33kv'))}</td>
        <td>${fmt(sum('line11kv'))}</td>
        <td>${sum('ptrNos')}</td>
        <td>${fmt(sum('ptrCap'))}</td>
        <td>${sum('dtrNos')}</td>
        <td>${fmt(sum('dtrCap'))}</td>
        <td>${fmt(sum('ltLine'))}</td>
        <td>${fmt(sum('estimateAmount'))} L</td>
      </tr>
    `);
  });

  if (!summaryBody.children.length) {
    summaryBody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#6b7280;padding:1rem">No data for this year.</td></tr>';
  }

  // Detailed records
  renderDetailTable(works);
}

function renderDetailTable(works) {
  const tbody = $('detailBody');
  tbody.innerHTML = '';
  if (!works.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#6b7280;padding:1rem">No records found.</td></tr>';
    return;
  }
  works.forEach((w, i) => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i + 1}</td>
        <td>
          <strong>${w.workName}</strong><br>
          <span style="color:#6b7280">${w.division} | FY ${w.fy} | ${w.workType}</span>
        </td>
        <td>
          ${w.line33kv ? `33kV: ${w.line33kv}km<br>` : ''}
          ${w.line11kv ? `11kV: ${w.line11kv}km<br>` : ''}
          ${w.ptrNos ? `PTR: ${w.ptrNos}nos (${w.ptrCap}MVA)<br>` : ''}
          ${w.dtrNos ? `DTR: ${w.dtrNos}nos (${w.dtrCap}kVA)<br>` : ''}
          ${w.ltLine ? `LT: ${w.ltLine}km` : ''}
          ${(!w.line33kv && !w.line11kv && !w.ptrNos && !w.dtrNos && !w.ltLine) ? '—' : ''}
        </td>
        <td>${w.estimateNo ? w.estimateNo + '<br>' : ''}${w.estimateAmount ? '₹' + fmt(w.estimateAmount) + ' L' : '—'}</td>
        <td>${w.workOrderNo ? w.workOrderNo + '<br>' : ''}${w.admNo ? 'ADM: ' + w.admNo : ''}${(!w.workOrderNo && !w.admNo) ? '—' : ''}</td>
        <td>${statusBadge(w.status)}</td>
        <td>${w.remark || '—'}</td>
        <td>
          <button class="btn btn-sm" onclick="openViewModal(${w.id})">👁 View</button>
          ${isAdmin ? `<button class="btn btn-sm btn-secondary" style="margin-top:4px" onclick="openEditModal(${w.id})">✎ Edit</button>` : ''}
        </td>
      </tr>
    `);
  });
}

/* ===========================
   RENDER REVIEW
=========================== */
function renderReview() {
  const fy = $('reviewFY').value;
  const status = $('reviewStatus').value;
  const works = Data.getByFYAndStatus(fy, status);

  $('reviewListTitle').textContent = `Progress Review List (${works.length} works)`;

  const tbody = $('reviewBody');
  tbody.innerHTML = '';
  if (!works.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;padding:1rem">No records found.</td></tr>';
    return;
  }
  works.forEach((w, i) => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${w.workName}</strong><br><span style="color:#6b7280">${w.division} | ${w.workType}</span></td>
        <td>
          ${w.line33kv ? `33kV: ${w.line33kv}km<br>` : ''}
          ${w.line11kv ? `11kV: ${w.line11kv}km<br>` : ''}
          ${w.ptrNos ? `PTR: ${w.ptrNos}nos (${w.ptrCap}MVA)<br>` : ''}
          ${w.dtrNos ? `DTR: ${w.dtrNos}nos (${w.dtrCap}kVA)<br>` : ''}
          ${w.ltLine ? `LT: ${w.ltLine}km` : ''}
          ${(!w.line33kv && !w.line11kv && !w.ptrNos && !w.dtrNos && !w.ltLine) ? '—' : ''}
        </td>
        <td>${w.estimateNo || '—'}<br>${w.estimateAmount ? '₹' + fmt(w.estimateAmount) + ' L' : ''}</td>
        <td>${w.workOrderNo || '—'}</td>
        <td>${statusBadge(w.status)}</td>
        <td>${w.remark || '—'}</td>
      </tr>
    `);
  });
}

/* ===========================
   VIEW MODAL
=========================== */
function openViewModal(id) {
  const w = Data.getAll().find(x => x.id === id);
  if (!w) return;
  currentViewId = id;

  $('viewContent').innerHTML = `
    <div class="detail-item"><span class="di-label">Name of Work</span><span class="di-value"><strong>${w.workName}</strong></span></div>
    <div class="detail-item"><span class="di-label">Division</span><span class="di-value">${w.division}</span></div>
    <div class="detail-item"><span class="di-label">Financial Year</span><span class="di-value">FY ${w.fy}</span></div>
    <div class="detail-item"><span class="di-label">Type of Work</span><span class="di-value">${w.workType}</span></div>
    <div class="detail-item"><span class="di-label">Estimate No</span><span class="di-value">${fmtOrDash(w.estimateNo)}</span></div>
    <div class="detail-item"><span class="di-label">Estimate Amount</span><span class="di-value">${w.estimateAmount ? '₹' + fmt(w.estimateAmount) + ' Lakhs' : '—'}</span></div>
    <div class="detail-item full"><span class="di-label">Work Order No &amp; Date</span><span class="di-value">${fmtOrDash(w.workOrderNo)}</span></div>
    <div class="detail-item"><span class="di-label">ADM Approval No</span><span class="di-value">${fmtOrDash(w.admNo)}</span></div>
    <div class="detail-item"><span class="di-label">ADM Approval Year</span><span class="di-value">${fmtOrDash(w.admYear)}</span></div>
    <div class="detail-item full" style="border-top:1px solid #e5e7eb;padding-top:.75rem;margin-top:.25rem">
      <span class="di-label">Provisions Summary</span>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.4rem">
        <span>33kV Line: <strong>${fmt(w.line33kv)} km</strong></span>
        <span>11kV Line: <strong>${fmt(w.line11kv)} km</strong></span>
        <span>LT Line: <strong>${fmt(w.ltLine)} km</strong></span>
        <span>PTR: <strong>${w.ptrNos || 0} nos</strong></span>
        <span>PTR Cap: <strong>${fmt(w.ptrCap)} MVA</strong></span>
        <span>DTR: <strong>${w.dtrNos || 0} nos</strong></span>
        <span>DTR Cap: <strong>${fmt(w.dtrCap)} kVA</strong></span>
      </div>
    </div>
    <div class="detail-item full"><span class="di-label">Current Status</span><span class="di-value">${statusBadge(w.status)}</span></div>
    <div class="detail-item full"><span class="di-label">Remark</span><span class="di-value">${fmtOrDash(w.remark)}</span></div>
  `;

  $('quickStatus').value = w.status;
  $('quickRemark').value = w.remark || '';

  $('viewModal').classList.remove('hidden');
}

/* ===========================
   EDIT MODAL
=========================== */
function openEditModal(id) {
  const w = Data.getAll().find(x => x.id === id);
  if (!w) return;

  const form = $('editWorkForm');
  const fields = ['id', 'workName', 'division', 'fy', 'workType', 'estimateNo',
    'estimateAmount', 'line33kv', 'line11kv', 'ptrNos', 'ptrCap',
    'dtrNos', 'dtrCap', 'ltLine', 'workOrderNo', 'admNo', 'admYear', 'status', 'remark'];

  fields.forEach(f => {
    const el = form.querySelector(`[name="${f}"]`);
    if (el) el.value = w[f] !== undefined ? w[f] : '';
  });

  $('editModal').classList.remove('hidden');
}

/* ===========================
   EXCEL EXPORT
=========================== */
function exportSummaryExcel() {
  const works = Data.getByFY(activeFY);
  const divisions = ['Mandsaur', 'Malhargarh', 'Garoth', 'Sitamau'];
  const rows = [['Division', 'Total Works', 'Completed', '%', '33kV(km)', '11kV(km)', 'PTR(nos)', 'PTR Cap(MVA)', 'DTR(nos)', 'DTR Cap(kVA)', 'LT(km)', 'Est Amount(L)']];

  divisions.forEach(div => {
    const dw = works.filter(w => w.division === div);
    if (!dw.length) return;
    const done = dw.filter(w => w.status === 'Completed').length;
    const sum = k => dw.reduce((s, w) => s + (Number(w[k]) || 0), 0);
    rows.push([div, dw.length, done, Math.round(done / dw.length * 100) + '%',
      fmt(sum('line33kv')), fmt(sum('line11kv')), sum('ptrNos'), fmt(sum('ptrCap')),
      sum('dtrNos'), fmt(sum('dtrCap')), fmt(sum('ltLine')), fmt(sum('estimateAmount'))]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  XLSX.writeFile(wb, `SSTD_Summary_FY${activeFY}.xlsx`);
}

function exportDetailedExcel() {
  const works = Data.getByFY(activeFY);
  const headers = ['S.No', 'Work Name', 'Division', 'FY', 'Work Type', 'Estimate No',
    'Estimate Amt (L)', '33kV (km)', '11kV (km)', 'PTR (nos)', 'PTR Cap (MVA)',
    'DTR (nos)', 'DTR Cap (kVA)', 'LT Line (km)', 'Work Order', 'ADM No', 'ADM Year', 'Status', 'Remark'];

  const rows = [headers, ...works.map((w, i) => [
    i + 1, w.workName, w.division, 'FY ' + w.fy, w.workType, w.estimateNo || '',
    w.estimateAmount || 0, w.line33kv || 0, w.line11kv || 0, w.ptrNos || 0, w.ptrCap || 0,
    w.dtrNos || 0, w.dtrCap || 0, w.ltLine || 0, w.workOrderNo || '', w.admNo || '', w.admYear || '',
    w.status, w.remark || ''
  ])];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Detailed Works');
  XLSX.writeFile(wb, `SSTD_Detailed_FY${activeFY}.xlsx`);
}

function downloadTemplate() {
  const headers = ['Work Name', 'Division', 'FY', 'Work Type', 'Estimate No',
    'Estimate Amt (L)', '33kV (km)', '11kV (km)', 'PTR (nos)', 'PTR Cap (MVA)',
    'DTR (nos)', 'DTR Cap (kVA)', 'LT Line (km)', 'Work Order No & Date', 'ADM No', 'ADM Year', 'Status', 'Remark'];
  const sample = ['Example Work Name', 'Mandsaur', '25', '1. New substation', 'EST/001', '50.00',
    '5.0', '0', '1', '5', '0', '0', '0', 'WO/001 dt 01-04-2024', 'ADM/001', '2024', 'Not Started', ''];

  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'SSTD_Import_Template.xlsx');
}

/* ===========================
   PPT EXPORT
=========================== */
async function downloadPPT() {
  const fy = $('reviewFY').value;
  const status = $('reviewStatus').value;
  const works = Data.getByFYAndStatus(fy, status);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '1e3a5f' };
  titleSlide.addText('SSTD Scheme Dashboard', { x: 0.5, y: 1.5, w: 12, h: 1.2, fontSize: 36, color: 'FFFFFF', bold: true, align: 'center' });
  titleSlide.addText(`FY ${fy} — ${status} Works`, { x: 0.5, y: 2.9, w: 12, h: 0.7, fontSize: 22, color: '90CAF9', align: 'center' });
  titleSlide.addText(`Total: ${works.length} works | Generated: ${new Date().toLocaleDateString('en-IN')}`, { x: 0.5, y: 3.8, w: 12, h: 0.5, fontSize: 14, color: 'B0BEC5', align: 'center' });

  // Work slides (up to 30)
  works.slice(0, 30).forEach((w, i) => {
    const slide = pptx.addSlide();
    slide.addText(`${i + 1}. ${w.workName}`, { x: 0.4, y: 0.3, w: 12.5, h: 0.7, fontSize: 18, bold: true, color: '1e3a5f' });
    const details = [
      ['Division', w.division], ['Financial Year', 'FY ' + w.fy],
      ['Type', w.workType], ['Estimate No', w.estimateNo || '—'],
      ['Estimate Amount', w.estimateAmount ? '₹' + fmt(w.estimateAmount) + ' Lakhs' : '—'],
      ['Status', w.status], ['Work Order', w.workOrderNo || '—'],
      ['ADM Approval', w.admNo ? `${w.admNo} (${w.admYear})` : '—'],
      ['33kV Line', (w.line33kv || 0) + ' km'], ['11kV Line', (w.line11kv || 0) + ' km'],
      ['PTR', `${w.ptrNos || 0} nos, ${w.ptrCap || 0} MVA`], ['DTR', `${w.dtrNos || 0} nos, ${w.dtrCap || 0} kVA`],
      ['LT Line', (w.ltLine || 0) + ' km'], ['Remark', w.remark || '—'],
    ];
    const rows = [
      [{ text: 'Parameter', options: { bold: true, color: 'FFFFFF', fill: { color: '1e3a5f' } } },
       { text: 'Value', options: { bold: true, color: 'FFFFFF', fill: { color: '1e3a5f' } } }],
      ...details.map(([k, v]) => [k, v])
    ];
    slide.addTable(rows, { x: 0.4, y: 1.1, w: 12.5, rowH: 0.32, fontSize: 12, border: { color: 'e5e7eb' } });
  });

  await pptx.writeFile({ fileName: `SSTD_Progress_FY${fy}_${status.replace(' ', '_')}.pptx` });
  showToast('PPT downloaded!');
}

/* ===========================
   EXCEL IMPORT
=========================== */
function handleExcelImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      let added = 0;
      rows.forEach(row => {
        const workName = row['Work Name'] || row['workName'];
        const division = row['Division'] || row['division'];
        const status = row['Status'] || row['status'] || 'Not Started';
        if (!workName || !division) return;

        Data.add({
          fy: String(row['FY'] || row['fy'] || activeFY),
          division, workName,
          workType: row['Work Type'] || row['workType'] || '',
          estimateNo: row['Estimate No'] || '',
          estimateAmount: parseFloat(row['Estimate Amt (L)'] || 0) || 0,
          line33kv: parseFloat(row['33kV (km)'] || 0) || 0,
          line11kv: parseFloat(row['11kV (km)'] || 0) || 0,
          ptrNos: parseInt(row['PTR (nos)'] || 0) || 0,
          ptrCap: parseFloat(row['PTR Cap (MVA)'] || 0) || 0,
          dtrNos: parseInt(row['DTR (nos)'] || 0) || 0,
          dtrCap: parseFloat(row['DTR Cap (kVA)'] || 0) || 0,
          ltLine: parseFloat(row['LT Line (km)'] || 0) || 0,
          workOrderNo: row['Work Order No & Date'] || '',
          admNo: row['ADM No'] || '',
          admYear: row['ADM Year'] || '',
          status, remark: row['Remark'] || ''
        });
        added++;
      });

      $('importResult').innerHTML = `<p style="color:#0e9f6e">✔ Successfully imported ${added} records.</p>`;
      renderDashboard();
      showToast(`${added} records imported!`);
    } catch (err) {
      $('importResult').innerHTML = `<p style="color:#e02424">✘ Import failed: ${err.message}</p>`;
    }
  };
  reader.readAsArrayBuffer(file);
}

/* ===========================
   ADMIN AUTH
=========================== */
function openAdminModal() { $('adminModal').classList.remove('hidden'); }
function closeAdminModal() { $('adminModal').classList.add('hidden'); $('loginError').classList.add('hidden'); }

function doLogin() {
  const u = $('adminUser').value.trim();
  const p = $('adminPass').value.trim();
  if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
    isAdmin = true;
    closeAdminModal();
    $('authNotice').classList.add('hidden');
    $('addWorkSection').classList.remove('hidden');
    $('adminLoginBtn').innerHTML = '<i class="fa fa-unlock"></i> Admin Active';
    $('adminLoginBtn').style.background = 'rgba(14,159,110,0.3)';
    renderDashboard();
    showToast('Admin login successful!');
  } else {
    $('loginError').classList.remove('hidden');
  }
}

/* ===========================
   TABS & YEAR
=========================== */
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  $('tab-' + tabId).classList.add('active');

  if (tabId === 'review') renderReview();
}

function switchFY(fy) {
  activeFY = fy;
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-fy="${fy}"]`).classList.add('active');
  renderDashboard();
  if ($('tab-review').classList.contains('active')) renderReview();
}

/* ===========================
   FORM SUBMIT
=========================== */
function collectFormData(form) {
  const fd = new FormData(form);
  return {
    fy: fd.get('fy'),
    division: fd.get('division'),
    workName: fd.get('workName'),
    workType: fd.get('workType'),
    estimateNo: fd.get('estimateNo') || '',
    estimateAmount: parseFloat(fd.get('estimateAmount')) || 0,
    line33kv: parseFloat(fd.get('line33kv')) || 0,
    line11kv: parseFloat(fd.get('line11kv')) || 0,
    ptrNos: parseInt(fd.get('ptrNos')) || 0,
    ptrCap: parseFloat(fd.get('ptrCap')) || 0,
    dtrNos: parseInt(fd.get('dtrNos')) || 0,
    dtrCap: parseFloat(fd.get('dtrCap')) || 0,
    ltLine: parseFloat(fd.get('ltLine')) || 0,
    workOrderNo: fd.get('workOrderNo') || '',
    admNo: fd.get('admNo') || '',
    admYear: fd.get('admYear') || '',
    status: fd.get('status'),
    remark: fd.get('remark') || ''
  };
}

/* ===========================
   EVENT LISTENERS
=========================== */
document.addEventListener('DOMContentLoaded', () => {

  // Year buttons
  document.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', () => switchFY(btn.dataset.fy));
  });

  // Tab buttons
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Admin login
  $('adminLoginBtn').addEventListener('click', openAdminModal);
  $('loginFromNotice').addEventListener('click', openAdminModal);
  $('closeAdminModal').addEventListener('click', closeAdminModal);
  $('cancelLoginBtn').addEventListener('click', closeAdminModal);
  $('doLoginBtn').addEventListener('click', doLogin);
  $('adminPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // Dashboard buttons
  $('clearAllBtn').addEventListener('click', () => {
    if (confirm('Clear ALL data? This cannot be undone.')) {
      Data.clearAll(); renderDashboard(); showToast('All data cleared.', '#e02424');
    }
  });
  $('resetSampleBtn').addEventListener('click', () => {
    if (confirm('Reset to sample data?')) {
      Data.loadSample(); renderDashboard(); showToast('Sample data loaded!');
    }
  });
  $('downloadSummaryBtn').addEventListener('click', exportSummaryExcel);
  $('exportDetailedBtn').addEventListener('click', exportDetailedExcel);
  $('addNewWorkDashBtn').addEventListener('click', () => {
    if (!isAdmin) { openAdminModal(); return; }
    switchTab('data-entry');
  });

  // Add work form
  $('addWorkForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = collectFormData($('addWorkForm'));
    Data.add(data);
    $('addWorkForm').reset();
    renderDashboard();
    showToast('Work added successfully!');
    switchTab('dashboard');
  });
  $('cancelAddBtn').addEventListener('click', () => switchTab('dashboard'));

  // Edit modal
  $('closeEditModal').addEventListener('click', () => $('editModal').classList.add('hidden'));
  $('cancelEditBtn').addEventListener('click', () => $('editModal').classList.add('hidden'));
  $('deleteWorkBtn').addEventListener('click', () => {
    const id = parseInt($('editWorkForm').querySelector('[name="id"]').value);
    if (confirm('Delete this work?')) {
      Data.delete(id);
      $('editModal').classList.add('hidden');
      renderDashboard();
      showToast('Work deleted.', '#e02424');
    }
  });
  $('editWorkForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = parseInt($('editWorkForm').querySelector('[name="id"]').value);
    const data = collectFormData($('editWorkForm'));
    Data.update(id, data);
    $('editModal').classList.add('hidden');
    renderDashboard();
    showToast('Work updated!');
  });

  // View modal
  $('closeViewModal').addEventListener('click', () => $('viewModal').classList.add('hidden'));
  $('closeViewBtn').addEventListener('click', () => $('viewModal').classList.add('hidden'));
  $('applyQuickUpdate').addEventListener('click', () => {
    if (!isAdmin) { showToast('Admin login required!', '#e02424'); return; }
    if (!currentViewId) return;
    Data.update(currentViewId, {
      status: $('quickStatus').value,
      remark: $('quickRemark').value
    });
    $('viewModal').classList.add('hidden');
    renderDashboard();
    showToast('Status updated!');
  });

  // Excel import
  $('downloadTemplateBtn').addEventListener('click', downloadTemplate);

  const dropZone = $('dropZone');
  const fileInput = $('excelFileInput');

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleExcelImport(fileInput.files[0]);
  });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleExcelImport(file);
  });

  // Review filters
  $('reviewFY').addEventListener('change', renderReview);
  $('reviewStatus').addEventListener('change', renderReview);
  $('downloadPPTBtn').addEventListener('click', downloadPPT);

  // Initial render
  renderDashboard();
});
