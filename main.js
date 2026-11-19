const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let db;
let win;
const userDataPath = app.getPath('userData');

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
    title: 'نظام إدارة الصيدلية',
    show: false
  });

  const menuTemplate = [];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  win.loadFile('index.html');
  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(() => {
  db = require('./database');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==================== IPC HANDLERS ====================

// Settings
ipcMain.handle('getSetting',     (e, key)    => db.getSetting(key));
ipcMain.handle('setSetting',     (e, k, v)   => db.setSetting(k, v));
ipcMain.handle('getAllSettings', ()           => db.getAllSettings());

// Users
ipcMain.handle('getUsers',             ()                       => db.getUsers());
ipcMain.handle('getUserByCredentials', (e, username, password)  => db.getUserByCredentials(username, password));
ipcMain.handle('addUser',              (e, n, u, p, role, ph)   => db.addUser(n, u, p, role, ph));
ipcMain.handle('deleteUser',           (e, id)                  => db.deleteUser(id));
ipcMain.handle('usernameExists',       (e, username)            => db.usernameExists(username));

// Drugs
ipcMain.handle('getDrugs',       ()           => db.getDrugs());
ipcMain.handle('addDrug',        (e, drug)    => db.addDrug(drug));
ipcMain.handle('updateDrugQty',  (e, id, qty) => db.updateDrugQty(id, qty));
ipcMain.handle('deleteDrug',     (e, id)      => db.deleteDrug(id));

// Customers
ipcMain.handle('getCustomers',        ()      => db.getCustomers());
ipcMain.handle('getCustomerByCode',   (e, c)  => db.getCustomerByCode(c));
ipcMain.handle('addCustomer',         (e, c)  => db.addCustomer(c));
ipcMain.handle('deleteCustomer',      (e, id) => db.deleteCustomer(id));
ipcMain.handle('getNextCustomerCode', ()      => db.getNextCustomerCode());

// Invoices
ipcMain.handle('getInvoices', ()       => db.getInvoices());
ipcMain.handle('addInvoice',  (e, inv) => db.addInvoice(inv));

// Backup
ipcMain.handle('backup', () => db.backup());

// Employees
ipcMain.handle('getEmployees', () => db.getEmployees());
ipcMain.handle('addEmployee', (e, emp) => db.addEmployee(emp));
ipcMain.handle('updateEmployee', (e, id, emp) => db.updateEmployee(id, emp));
ipcMain.handle('deleteEmployee', (e, id) => db.deleteEmployee(id));
ipcMain.handle('addBonus', (e, id, amount) => db.addBonus(id, amount));
ipcMain.handle('addDeduction', (e, id, amount) => db.addDeduction(id, amount));
ipcMain.handle('getEmployeesByJob', (e, job) => db.getEmployeesByJob(job));

// Delivery Orders
ipcMain.handle('getDeliveryOrders', () => db.getDeliveryOrders());
ipcMain.handle('addDeliveryOrder', (e, order) => db.addDeliveryOrder(order));
ipcMain.handle('updateDeliveryStatus', (e, id, status) => db.updateDeliveryStatus(id, status));
ipcMain.handle('getNextDeliveryNum', () => db.getNextDeliveryNum());
ipcMain.handle('getDeliveryStats', (e, id, month) => db.getDeliveryStats(id, month));

// Data persistence
ipcMain.handle('saveData', (e, data) => {
  const filePath = path.join(userDataPath, 'pharmaData.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
});
ipcMain.handle('loadData', () => {
  const filePath = path.join(userDataPath, 'pharmaData.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
});