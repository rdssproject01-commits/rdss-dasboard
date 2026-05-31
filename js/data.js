/**
 * data.js — SSTD Dashboard Data Layer
 * Handles all CRUD operations via localStorage.
 */

const DB_KEY = 'sstd_works';

const SAMPLE_DATA = [
  {
    id: 1, fy: '25', division: 'Mandsaur',
    workName: 'New 33/11 kV Substation at Mundla',
    workType: '1. New substation',
    estimateNo: 'EST/MDS/001/25',
    estimateAmount: 85.50,
    line33kv: 4.5, line11kv: 0, ptrNos: 1, ptrCap: 5, dtrNos: 0, dtrCap: 0, ltLine: 0,
    workOrderNo: 'WO/2024/001 dt 10-04-2024', admNo: 'ADM/001', admYear: '2024',
    status: 'Completed', remark: 'Work completed as per schedule'
  },
  {
    id: 2, fy: '25', division: 'Malhargarh',
    workName: '11 kV Line Bifurcation for Feeder Relief - Suwasra',
    workType: '3. 11 Kv line bifurcation',
    estimateNo: 'EST/MLH/002/25',
    estimateAmount: 12.30,
    line33kv: 0, line11kv: 8.2, ptrNos: 0, ptrCap: 0, dtrNos: 2, dtrCap: 200, ltLine: 2.5,
    workOrderNo: 'WO/2024/045 dt 15-06-2024', admNo: 'ADM/045', admYear: '2024',
    status: 'In Progress', remark: 'Civil work in progress'
  },
  {
    id: 3, fy: '25', division: 'Garoth',
    workName: 'Additional DTR 25 kVA at Village Bardiya',
    workType: '6. Additional DTR',
    estimateNo: 'EST/GRT/003/25',
    estimateAmount: 3.80,
    line33kv: 0, line11kv: 0, ptrNos: 0, ptrCap: 0, dtrNos: 1, dtrCap: 25, ltLine: 0.8,
    workOrderNo: '', admNo: '', admYear: '',
    status: 'Not Started', remark: ''
  },
  {
    id: 4, fy: '25', division: 'Sitamau',
    workName: 'Augmentation of PTR 5 to 10 MVA at Sitamau Grid',
    workType: '5. Augmentation PTR',
    estimateNo: 'EST/STM/004/25',
    estimateAmount: 40.00,
    line33kv: 0, line11kv: 0, ptrNos: 1, ptrCap: 10, dtrNos: 0, dtrCap: 0, ltLine: 0,
    workOrderNo: 'WO/2024/112 dt 01-09-2024', admNo: 'ADM/112', admYear: '2024',
    status: 'In Progress', remark: 'Equipment under delivery'
  },
  {
    id: 5, fy: '25', division: 'Mandsaur',
    workName: '33 kV Line Bifurcation Mandsaur–Garoth',
    workType: '2. 33 Kv line bifurcation',
    estimateNo: 'EST/MDS/005/25',
    estimateAmount: 55.20,
    line33kv: 12.0, line11kv: 0, ptrNos: 0, ptrCap: 0, dtrNos: 0, dtrCap: 0, ltLine: 0,
    workOrderNo: 'WO/2024/200 dt 20-11-2024', admNo: 'ADM/200', admYear: '2024',
    status: 'Completed', remark: 'Charged and energised'
  },
  {
    id: 6, fy: '24', division: 'Malhargarh',
    workName: 'Additional PTR 5 MVA at Malhargarh Grid',
    workType: '4. Additional PTR',
    estimateNo: 'EST/MLH/006/24',
    estimateAmount: 38.00,
    line33kv: 0, line11kv: 0, ptrNos: 1, ptrCap: 5, dtrNos: 0, dtrCap: 0, ltLine: 0,
    workOrderNo: 'WO/2023/080 dt 05-08-2023', admNo: 'ADM/080', admYear: '2023',
    status: 'Completed', remark: ''
  }
];

const Data = {
  _getAll() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY)) || [];
    } catch { return []; }
  },

  _save(works) {
    localStorage.setItem(DB_KEY, JSON.stringify(works));
  },

  getAll() { return this._getAll(); },

  getByFY(fy) {
    return this._getAll().filter(w => String(w.fy) === String(fy));
  },

  getByFYAndStatus(fy, status) {
    return this.getByFY(fy).filter(w => w.status === status);
  },

  add(work) {
    const works = this._getAll();
    const id = works.length ? Math.max(...works.map(w => w.id)) + 1 : 1;
    const newWork = { id, ...work };
    works.push(newWork);
    this._save(works);
    return newWork;
  },

  update(id, updates) {
    const works = this._getAll();
    const idx = works.findIndex(w => w.id === id);
    if (idx === -1) return null;
    works[idx] = { ...works[idx], ...updates };
    this._save(works);
    return works[idx];
  },

  delete(id) {
    const works = this._getAll().filter(w => w.id !== id);
    this._save(works);
  },

  clearAll() { this._save([]); },

  loadSample() {
    this._save(SAMPLE_DATA.map(d => ({ ...d })));
  },

  isInitialized() {
    return localStorage.getItem(DB_KEY) !== null;
  }
};

// Auto-init with sample data on first load
if (!Data.isInitialized()) {
  Data.loadSample();
}
