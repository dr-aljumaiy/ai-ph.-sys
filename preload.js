const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('saveData', (data) => ipcRenderer.invoke('saveData', data));
contextBridge.exposeInMainWorld('loadData', () => ipcRenderer.invoke('loadData'));

contextBridge.exposeInMainWorld('db', {
  // Settings
  getSetting:      (key)    => ipcRenderer.invoke('getSetting', key),
  setSetting:      (k, v)   => ipcRenderer.invoke('setSetting', k, v),
  getAllSettings:  ()        => ipcRenderer.invoke('getAllSettings'),

  // Users
  getUsers:              ()                          => ipcRenderer.invoke('getUsers'),
  getUserByCredentials:  (username, password)        => ipcRenderer.invoke('getUserByCredentials', username, password),
  addUser:               (name, u, p, role, phone)   => ipcRenderer.invoke('addUser', name, u, p, role, phone),
  deleteUser:            (id)                        => ipcRenderer.invoke('deleteUser', id),
  usernameExists:        (username)                  => ipcRenderer.invoke('usernameExists', username),

  // Drugs
  getDrugs:        ()      => ipcRenderer.invoke('getDrugs'),
  addDrug:         (drug)  => ipcRenderer.invoke('addDrug', drug),
  updateDrugQty:   (id, q) => ipcRenderer.invoke('updateDrugQty', id, q),
  deleteDrug:      (id)    => ipcRenderer.invoke('deleteDrug', id),

  // Customers
  getCustomers:           ()     => ipcRenderer.invoke('getCustomers'),
  getCustomerByCode:      (code) => ipcRenderer.invoke('getCustomerByCode', code),
  addCustomer:            (c)    => ipcRenderer.invoke('addCustomer', c),
  deleteCustomer:         (id)   => ipcRenderer.invoke('deleteCustomer', id),
  getNextCustomerCode:    ()     => ipcRenderer.invoke('getNextCustomerCode'),

  // Invoices
  getInvoices:  ()    => ipcRenderer.invoke('getInvoices'),
  addInvoice:   (inv) => ipcRenderer.invoke('addInvoice', inv),

  // Backup
  backup: () => ipcRenderer.invoke('backup'),

  // Employees
  getEmployees: () => ipcRenderer.invoke('getEmployees'),
  addEmployee: (emp) => ipcRenderer.invoke('addEmployee', emp),
  updateEmployee: (id, emp) => ipcRenderer.invoke('updateEmployee', id, emp),
  deleteEmployee: (id) => ipcRenderer.invoke('deleteEmployee', id),
  addBonus: (id, amount) => ipcRenderer.invoke('addBonus', id, amount),
  addDeduction: (id, amount) => ipcRenderer.invoke('addDeduction', id, amount),
  getEmployeesByJob: (job) => ipcRenderer.invoke('getEmployeesByJob', job),

  // Delivery Orders
  getDeliveryOrders: () => ipcRenderer.invoke('getDeliveryOrders'),
  addDeliveryOrder: (order) => ipcRenderer.invoke('addDeliveryOrder', order),
  updateDeliveryStatus: (id, status) => ipcRenderer.invoke('updateDeliveryStatus', id, status),
  getNextDeliveryNum: () => ipcRenderer.invoke('getNextDeliveryNum'),
  getDeliveryStats: (id, month) => ipcRenderer.invoke('getDeliveryStats', id, month),
});