const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'pharmacy.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    jobTitle TEXT,
    salary REAL DEFAULT 0,
    phone TEXT,
    notes TEXT,
    hasUserAccount INTEGER DEFAULT 0,
    userId INTEGER,
    deliveryOrders INTEGER DEFAULT 0,
    totalSales REAL DEFAULT 0,
    lastBonus REAL DEFAULT 0,
    lastDeduction REAL DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS delivery_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNum INTEGER,
    customerName TEXT,
    customerPhone TEXT,
    customerAddress TEXT,
    items TEXT,
    total REAL,
    deliveryFee REAL DEFAULT 0,
    deliveryMan TEXT,
    deliveryManId INTEGER,
    status TEXT DEFAULT 'pending',
    paymentMethod TEXT,
    createdAt TEXT,
    deliveredAt TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS delivery_report (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deliveryManId INTEGER,
    deliveryManName TEXT,
    month TEXT,
    totalOrders INTEGER DEFAULT 0,
    completedOrders INTEGER DEFAULT 0,
    cancelledOrders INTEGER DEFAULT 0,
    totalAmount REAL DEFAULT 0,
    avgDeliveryTime INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS drugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    cat TEXT,
    qty INTEGER DEFAULT 0,
    minQty INTEGER DEFAULT 10,
    buyPrice REAL DEFAULT 0,
    sellPrice REAL DEFAULT 0,
    expiry TEXT,
    barcode TEXT
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    address TEXT,
    dob TEXT,
    gender TEXT,
    notes TEXT,
    totalPurchases REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceNum INTEGER,
    customer TEXT,
    customerCode TEXT,
    cashier TEXT,
    date TEXT,
    subtotal REAL,
    discount REAL,
    total REAL,
    profit REAL
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceId INTEGER,
    drugId INTEGER,
    name TEXT,
    price REAL,
    buyPrice REAL,
    qty INTEGER,
    FOREIGN KEY(invoiceId) REFERENCES invoices(id)
  );
`);

// Insert default admin if not exists
const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)").run('المدير', 'admin', '1234', 'مدير النظام');
}

// Insert default settings
const settingsExist = db.prepare("SELECT key FROM settings WHERE key = 'pharmacyName'").get();
if (!settingsExist) {
  const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  insertSetting.run('pharmacyName', 'صيدلية الشفاء');
  insertSetting.run('license', '');
  insertSetting.run('phone', '');
  insertSetting.run('manager', '');
  insertSetting.run('address', '');
  insertSetting.run('minStock', '10');
  insertSetting.run('expDays', '30');
  insertSetting.run('currency', 'ج');
  insertSetting.run('invoiceNum', '1001');
  insertSetting.run('deliveryNum', '1001');
}

// Insert sample drugs if empty
const drugsCount = db.prepare("SELECT COUNT(*) as c FROM drugs").get();
if (drugsCount.c === 0) {
  const insertDrug = db.prepare("INSERT INTO drugs (name, cat, qty, minQty, buyPrice, sellPrice, expiry, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertDrug.run('بروفين 400mg', 'مسكن', 120, 20, 6, 12, '2026-08-15', '');
  insertDrug.run('بنادول اكسترا', 'مسكن', 85, 30, 4, 8, '2026-10-20', '');
  insertDrug.run('أوميبرازول 20mg', 'معدة وهضم', 60, 15, 8, 15, '2026-07-01', '');
  insertDrug.run('أموكسيسيلين 500mg', 'مضاد حيوي', 45, 20, 11, 22, '2026-06-30', '');
  insertDrug.run('ميتفورمين 500mg', 'سكري', 90, 25, 9, 18, '2026-09-15', '');
  insertDrug.run('أملوديبين 5mg', 'ضغط وقلب', 55, 15, 12, 24, '2026-11-01', '');
  insertDrug.run('أنسولين جلارجين', 'سكري', 3, 10, 90, 180, '2026-05-20', '');
  insertDrug.run('ليفوثيروكسين 50mcg', 'غدة درقية', 8, 20, 18, 35, '2026-12-01', '');
  insertDrug.run('سيبروفلوكساسين 500mg', 'مضاد حيوي', 30, 15, 14, 28, '2026-04-15', '');
  insertDrug.run('لوستاتين 20mg', 'ضغط وقلب', 55, 15, 13, 25, '2027-01-10', '');
  insertDrug.run('فيتامين د3 1000', 'فيتامينات', 70, 20, 15, 30, '2027-03-01', '');
  insertDrug.run('باراسيتامول 500mg', 'مسكن', 200, 50, 2, 5, '2027-06-01', '');
}

// ==================== API ====================

module.exports = {

  // SETTINGS
  getSetting: (key) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? row.value : null;
  },
  setSetting: (key, value) => {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, String(value));
  },
  getAllSettings: () => {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    return obj;
  },

  // USERS
  getUsers: () => db.prepare("SELECT * FROM users").all(),
  getUserByCredentials: (username, password) =>
    db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password),
  addUser: (name, username, password, role, phone) =>
    db.prepare("INSERT INTO users (name, username, password, role, phone) VALUES (?, ?, ?, ?, ?)").run(name, username, password, role, phone || ''),
  deleteUser: (id) => db.prepare("DELETE FROM users WHERE id = ?").run(id),
  usernameExists: (username) => !!db.prepare("SELECT id FROM users WHERE username = ?").get(username),

  // DRUGS
  getDrugs: () => db.prepare("SELECT * FROM drugs ORDER BY name").all(),
  addDrug: (drug) =>
    db.prepare("INSERT INTO drugs (name, cat, qty, minQty, buyPrice, sellPrice, expiry, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(drug.name, drug.cat, drug.qty, drug.minQty, drug.buyPrice, drug.sellPrice, drug.expiry, drug.barcode || ''),
  updateDrugQty: (id, qty) => db.prepare("UPDATE drugs SET qty = ? WHERE id = ?").run(qty, id),
  deleteDrug: (id) => db.prepare("DELETE FROM drugs WHERE id = ?").run(id),

  // CUSTOMERS
  getCustomers: () => db.prepare("SELECT * FROM customers ORDER BY name").all(),
  getCustomerByCode: (code) => db.prepare("SELECT * FROM customers WHERE code = ?").get(code),
  addCustomer: (c) =>
    db.prepare("INSERT INTO customers (code, name, phone, address, dob, gender, notes, totalPurchases) VALUES (?, ?, ?, ?, ?, ?, ?, 0)")
      .run(c.code, c.name, c.phone || '', c.address || '', c.dob || '', c.gender || '', c.notes || ''),
  updateCustomerPurchases: (code, amount) =>
    db.prepare("UPDATE customers SET totalPurchases = totalPurchases + ? WHERE code = ?").run(amount, code),
  deleteCustomer: (id) => db.prepare("DELETE FROM customers WHERE id = ?").run(id),
  getNextCustomerCode: () => {
    const last = db.prepare("SELECT code FROM customers ORDER BY id DESC LIMIT 1").get();
    if (!last) return 'C001';
    const num = parseInt(last.code.replace('C', '')) + 1;
    return 'C' + String(num).padStart(3, '0');
  },

  // INVOICES
  getInvoices: () => {
    const invoices = db.prepare("SELECT * FROM invoices ORDER BY id DESC").all();
    return invoices.map(inv => {
      inv.items = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?").all(inv.id);
      return inv;
    });
  },
  addInvoice: (inv) => {
    const result = db.prepare(
      "INSERT INTO invoices (invoiceNum, customer, customerCode, cashier, date, subtotal, discount, total, profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(inv.invoiceNum, inv.customer, inv.customerCode || null, inv.cashier, inv.date, inv.subtotal, inv.discount, inv.total, inv.profit);

    const invId = result.lastInsertRowid;
    const insertItem = db.prepare("INSERT INTO invoice_items (invoiceId, drugId, name, price, buyPrice, qty) VALUES (?, ?, ?, ?, ?, ?)");
    inv.items.forEach(item => insertItem.run(invId, item.id, item.name, item.price, item.buyPrice, item.qty));

    // Update drug quantities
    const updateQty = db.prepare("UPDATE drugs SET qty = MAX(0, qty - ?) WHERE id = ?");
    inv.items.forEach(item => updateQty.run(item.qty, item.id));

    // Update customer purchases
    if (inv.customerCode) {
      db.prepare("UPDATE customers SET totalPurchases = totalPurchases + ? WHERE code = ?").run(inv.total, inv.customerCode);
    }

    return invId;
  },

  // BACKUP
  backup: () => {
    const backupPath = path.join(app.getPath('desktop'), `pharmacy_backup_${Date.now()}.db`);
    db.backup(backupPath);
    return backupPath;
  },

  // EMPLOYEES
  getEmployees: () => db.prepare("SELECT * FROM employees ORDER BY name").all(),
  addEmployee: (emp) => db.prepare("INSERT INTO employees (name, jobTitle, salary, phone, notes, hasUserAccount, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(emp.name, emp.jobTitle, emp.salary, emp.phone, emp.notes || '', emp.hasUserAccount ? 1 : 0, emp.userId || null, new Date().toISOString()),
  updateEmployee: (id, emp) => db.prepare("UPDATE employees SET name = ?, jobTitle = ?, salary = ?, phone = ?, notes = ?, hasUserAccount = ?, userId = ? WHERE id = ?").run(emp.name, emp.jobTitle, emp.salary, emp.phone, emp.notes, emp.hasUserAccount ? 1 : 0, emp.userId, id),
  deleteEmployee: (id) => db.prepare("DELETE FROM employees WHERE id = ?").run(id),
  addBonus: (id, amount, note) => db.prepare("UPDATE employees SET lastBonus = ? WHERE id = ?").run(amount, id),
  addDeduction: (id, amount, note) => db.prepare("UPDATE employees SET lastDeduction = ? WHERE id = ?").run(amount, id),
  getEmployeesByJob: (job) => db.prepare("SELECT * FROM employees WHERE jobTitle = ?").all(job),

  // DELIVERY ORDERS
  getDeliveryOrders: () => db.prepare("SELECT * FROM delivery_orders ORDER BY id DESC").all(),
  addDeliveryOrder: (order) => {
    const result = db.prepare("INSERT INTO delivery_orders (orderNum, customerName, customerPhone, customerAddress, items, total, deliveryFee, deliveryMan, deliveryManId, status, paymentMethod, createdAt, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(order.orderNum, order.customerName, order.customerPhone, order.customerAddress, JSON.stringify(order.items), order.total, order.deliveryFee || 0, order.deliveryMan, order.deliveryManId || null, 'pending', order.paymentMethod, new Date().toISOString(), order.notes || '');
    return result.lastInsertRowid;
  },
  updateDeliveryStatus: (id, status) => {
    if (status === 'delivered') {
      db.prepare("UPDATE delivery_orders SET status = ?, deliveredAt = ? WHERE id = ?").run(status, new Date().toISOString(), id);
    } else {
      db.prepare("UPDATE delivery_orders SET status = ? WHERE id = ?").run(status, id);
    }
  },
  getNextDeliveryNum: () => {
    const last = db.prepare("SELECT orderNum FROM delivery_orders ORDER BY id DESC LIMIT 1").get();
    if (!last) return 1001;
    return last.orderNum + 1;
  },
  getDeliveryStats: (deliveryManId, month) => {
    const orders = db.prepare("SELECT * FROM delivery_orders WHERE deliveryManId = ? AND strftime('%Y-%m', createdAt) = ?").all(deliveryManId, month);
    const total = orders.length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    const totalAmount = orders.reduce((s, o) => s + o.total, 0);
    return { total, completed, totalAmount };
  }
};