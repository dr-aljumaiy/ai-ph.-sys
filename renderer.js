// ============= DATA =============
let DB;

async function loadDB() {
  DB = await window.loadData() || {
    ph:{name:'AI Pharma',lic:'',phone:'',mgr:'',addr:''},
    sys:{minStock:10,expDays:30,invNum:1001,delNum:1001},
    users:[{id:1,name:'المدير',username:'admin',password:'1234',role:'مدير النظام'}],
    drugs:[
      {id:1,name:'بروفين 400mg',cat:'مسكن',active:'ايبوبروفين',qty:120,min:20,buy:6,sell:12,exp:'2026-08-15',barcode:'',code:'1'},
      {id:2,name:'بنادول اكسترا',cat:'مسكن',active:'باراسيتامول',qty:85,min:30,buy:4,sell:8,exp:'2026-10-20',barcode:'',code:'2'},
      {id:3,name:'أوميبرازول 20mg',cat:'معدة وهضم',active:'أوميبرازول',qty:60,min:15,buy:8,sell:15,exp:'2026-07-01',barcode:'',code:'3'},
      {id:4,name:'أموكسيسيلين 500mg',cat:'مضاد حيوي',active:'أموكسيسيلين',qty:45,min:20,buy:11,sell:22,exp:'2026-06-30',barcode:'',code:'4'},
      {id:5,name:'ميتفورمين 500mg',cat:'سكري',active:'ميتفورمين',qty:90,min:25,buy:9,sell:18,exp:'2026-09-15',barcode:'',code:'5'},
      {id:6,name:'أملوديبين 5mg',cat:'ضغط وقلب',active:'أملوديبين',qty:55,min:15,buy:12,sell:24,exp:'2026-11-01',barcode:'',code:'6'},
      {id:7,name:'أنسولين جلارجين',cat:'سكري',active:'إنسولين جلارجين',qty:3,min:10,buy:90,sell:180,exp:'2026-05-20',barcode:'',code:'7'},
      {id:8,name:'باراسيتامول 500mg',cat:'مسكن',active:'باراسيتامول',qty:200,min:50,buy:2,sell:5,exp:'2027-06-01',barcode:'',code:'8'},
    ],
    customers:[
      {id:1,code:'1001',name:'أحمد محمد',phone:'01012345678',addr:'القاهرة',notes:'حساسية من البنسلين',createdAt:'2025-01-01',totalDebt:0,totalPaid:0},
      {id:2,code:'1002',name:'فاطمة أحمد',phone:'01098765432',addr:'الجيزة',notes:'مريضة سكري',createdAt:'2025-01-01',totalDebt:0,totalPaid:0},
    ],
    invoices:[],
    purchases:[],
    expenses:[],
    debtPays:[],
    shifts:[],
    safeLog:[],
    safeBalance:0,
    currentShiftStart: new Date().toISOString(),
    employees:[],
    deliveryOrders:[],
    returns:[]
  };
}

const GKEY='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';
const INTER=[
  {drugs:['وارفارين','أسبرين'],level:'خطر',msg:'خطر نزيف شديد'},
  {drugs:['ميتفورمين','كحول'],level:'تحذير',msg:'خطر الحماض اللبني'},
  {drugs:['سيبروفلوكساسين','أنتاسيد'],level:'تحذير',msg:'فصل بينهما ساعتين'},
  {drugs:['أموكسيسيلين','وارفارين'],level:'تحذير',msg:'قد يزيد تأثير وارفارين'},
];

let posItems=[], posCust=null, payM='نقدي', purchItems=[], expType='توريد مورد', custFilt='all', selCust=null;
let drugSeq=Math.max(...DB.drugs.map(d=>d.id),0)+1;
let drugCodeSeq=Math.max(...DB.drugs.map(d=>parseInt(d.code)||0),0);
let custSeq=Math.max(...DB.customers.map(c=>parseInt(c.code)||0),1000)+1;
let userSeq=Math.max(...DB.users.map(u=>u.id),0)+1;
let searchTimeout=null, custSearchTimeout=null;

async function save(){window.saveData(DB);}

function getDrugById(id){return DB.drugs.find(d=>d.id==id);}

// ===== THEME =====
function toggleTheme(){
  const h=document.documentElement,d=h.getAttribute('data-theme')==='dark';
  h.setAttribute('data-theme',d?'light':'dark');
  document.getElementById('thmBtn').textContent=d?'🌙':'☀️';
  localStorage.setItem('pharmaTheme',d?'light':'dark');
}
(()=>{const t=localStorage.getItem('pharmaTheme')||'light';document.documentElement.setAttribute('data-theme',t);document.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('thmBtn');if(b)b.textContent=t==='dark'?'☀️':'🌙';});})();

// ===== INIT =====

// ===== INIT =====
async function initApp(){
  await loadDB();
  updateDate();setInterval(updateDate,60000);
  renderDash();renderInv();renderAlerts();renderCusts();renderPurches();renderAccounts();renderCashPage();loadSettings();renderUList();renderEmpList();renderDelList();updateTicker();
  posItems=[];posCust=null;payM='نقدي';
  renderPos();updateBadge();
  document.getElementById('pDate').value=new Date().toISOString().split('T')[0];
  document.getElementById('pInvTime').textContent=new Date().toLocaleString('ar-EG');
  document.getElementById('invN').textContent=DB.sys.invNum;
  setPay('نقدي');
  // Load delivery customers
  const dcSel=document.getElementById('dcExist');
  if(dcSel){
    dcSel.innerHTML='<option value="">-- اختر عميل --</option>';
    DB.customers.forEach(c=>dcSel.innerHTML+=`<option value="${c.id}">${c.name} - ${c.phone}</option>`);
  }
  // Add nav event listeners
  document.querySelectorAll('.ni').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.getAttribute('data-page');
      nav(name);
    });
  });
  document.getElementById('newSaleBtn').addEventListener('click', () => nav('pos'));
  nav('dash');
}
function updateDate(){
  const d=new Date();
  document.getElementById('tdate').textContent=d.toLocaleDateString('ar-EG',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const pt=document.getElementById('pInvTime');if(pt)pt.textContent=d.toLocaleString('ar-EG');
}

// ===== HELPERS =====
function fmt(n){return(parseFloat(n)||0).toFixed(2)+' ج';}
function dDiff(s){return Math.round((new Date(s)-new Date())/86400000);}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}
function openM(id){
  // Pre-fill close shift modal
  if(id==='mCloseShift'){
    const {cash,visa,ajal,total,invs}=getShiftStats();
    document.getElementById('csTotal').textContent=fmt(total);
    document.getElementById('csInvs').textContent=invs;
    document.getElementById('csCash').textContent=fmt(cash);
    document.getElementById('csVisa').textContent=fmt(visa);
    document.getElementById('csTrans').value=Math.floor(cash);
  }
  document.getElementById(id).classList.add('open');
}
function closeM(id){document.getElementById(id).classList.remove('open');}
async function confirmDelivery(){
  const cName=document.getElementById('dcName').value.trim();
  const cPhone=document.getElementById('dcPhone').value.trim();
  const cAddr=document.getElementById('dcAddr').value.trim();
  if(!cName||!cPhone||!cAddr){showToast('⚠️ أدخل اسم العميل والموبايل والعنوان');return;}
  const{sub,disc,total}=getPosTotal();
  const delFee=parseFloat(document.getElementById('dcFee').value)||15;
  const grandTotal=total+delFee;
  posItems.forEach(item=>{const d=DB.drugs.find(x=>x.id===item.id);if(d)d.qty=Math.max(0,d.qty-item.qty*item.unitQty);});
  if(!DB.deliveryOrders)DB.deliveryOrders=[];
  DB.deliveryOrders.push({id:Date.now(),orderNum:DB.sys.delNum||1001,customer:cName,customerPhone:cPhone,customerAddress:cAddr,items:posItems.map(x=>({...x})),total:grandTotal,deliveryFee:delFee,paymentMethod:payM,status:'pending',cashier:'مدير الصيدلية',date:new Date().toISOString(),notes:document.getElementById('dcNote').value});
  if(!DB.sys.delNum)DB.sys.delNum=1002;else DB.sys.delNum++;
  await save();
  closeM('mDelCust');
  clearPos();
  showToast('✅ تم تسجيل أمر التوصيل! الإجمالي: '+grandTotal.toFixed(2)+' ج');
  renderDash();renderInv();renderDelList();updateTicker();
}
function fillDelCust(){
  const cid=document.getElementById('dcExist').value;
  if(!cid)return;
  const c=DB.customers.find(x=>x.id==cid);
  if(c){
    document.getElementById('dcName').value=c.name;
    document.getElementById('dcPhone').value=c.phone;
    document.getElementById('dcAddr').value=c.addr||'';
  }
}
async function saveEmployee(){
  const name=document.getElementById('eNm').value.trim();
  const jobTitle=document.getElementById('eJob').value;
  const salary=parseFloat(document.getElementById('eSal').value)||0;
  const phone=document.getElementById('ePhone').value.trim();
  const notes=document.getElementById('eNote').value;
  const hasUserAccount=document.getElementById('eHasUser').checked;
  let userId=null;
  if(hasUserAccount){
    const uname=document.getElementById('eUs').value.trim();
    const pass=document.getElementById('ePs').value;
    if(!uname||!pass){showToast('⚠️ أدخل اسم المستخدم وكلمة المرور');return;}
    if(DB.users.find(u=>u.username===uname)){showToast('⚠️ اسم المستخدم موجود');return;}
    const perm=document.querySelectorAll('#ePerms input:checked');
    const permissions=Array.from(perm).map(p=>p.value);
    DB.users.push({id:userSeq++,name,username:uname,password:pass,role:'موظف',permissions});
    userId=userSeq;
  }
  if(!DB.employees)DB.employees=[];
  DB.employees.push({id:userSeq++,name,jobTitle,salary,phone,notes,hasUserAccount,userId,totalSales:0,createdAt:new Date().toISOString()});
  await save();
  closeM('mAddEmp');
  renderEmpList();
  showToast('✅ تم إضافة الموظف');
}
function toggleEmpUser(){
  const has=document.getElementById('eHasUser').checked;
  document.getElementById('eUserFields').style.display=has?'block':'none';
}
function filtEmp(f,el){
  document.querySelectorAll('#page-employees .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderEmpList();
}
function showEmpDet(id){
  const emp=DB.employees.find(e=>e.id===id);
  if(!emp)return;
  document.getElementById('empDetail').innerHTML=`
    <div style="padding:18px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div class="bigav">${emp.name[0]}</div>
        <div style="flex:1"><div style="font-size:17px;font-weight:800">${emp.name}</div><div style="color:var(--t3);font-size:12px">${emp.jobTitle} · 📱 ${emp.phone||'-'}</div></div>
      </div>
      <div class="qs">
        <div class="qsc"><div class="qsv">${fmt(emp.salary||0)}</div><div class="qsl">المرتب</div></div>
        <div class="qsc"><div class="qsv">${fmt(emp.totalSales||0)}</div><div class="qsl">المبيعات</div></div>
        <div class="qsc"><div class="qsv">${emp.hasUserAccount?'نعم':'لا'}</div><div class="qsl">يوزر</div></div>
      </div>
      <div style="margin-top:12px">
        <button class="btn btn-success btn-sm" onclick="openEmpAdj('bonus',${emp.id})">💰 مكافأة</button>
        <button class="btn btn-danger btn-sm" onclick="openEmpAdj('deduction',${emp.id})" style="margin-left:8px">💸 خصم</button>
      </div>
      ${emp.notes?`<div style="margin-top:12px;color:var(--t3);font-size:12px">📝 ${emp.notes}</div>`:''}
    </div>
  `;
}
function openEmpAdj(type,id){
  const emp=DB.employees.find(e=>e.id===id);
  if(!emp)return;
  document.getElementById('eAdjId').value=id;
  document.getElementById('eAdjType').value=type;
  document.getElementById('eAdjTitle').textContent=type==='bonus'?'إضافة مكافأة':'إضافة خصم';
  document.getElementById('eAdjAmt').value='';
  document.getElementById('eAdjNote').value='';
  openM('mEmpAdj');
}
async function saveEmpAdj(){
  const id=parseInt(document.getElementById('eAdjId').value);
  const type=document.getElementById('eAdjType').value;
  const amt=parseFloat(document.getElementById('eAdjAmt').value)||0;
  const note=document.getElementById('eAdjNote').value;
  if(!amt){showToast('⚠️ أدخل المبلغ');return;}
  const emp=DB.employees.find(e=>e.id===id);
  if(!emp)return;
  if(type==='bonus')emp.lastBonus=(emp.lastBonus||0)+amt;
  else emp.lastDeduction=(emp.lastDeduction||0)+amt;
  await save();
  closeM('mEmpAdj');
  renderEmpList();
  if(selEmp===id)showEmpDet(id);
  showToast('✅ تم الحفظ');
}
async function delEmp(id){
  if(!confirm('حذف الموظف؟'))return;
  DB.employees=DB.employees.filter(e=>e.id!==id);
  await save();
  renderEmpList();
  document.getElementById('empDetail').innerHTML='<div style="padding:40px;text-align:center;color:var(--t4)"><div style="font-size:36px;margin-bottom:8px">👨‍⚕️</div><div>اختر موظفاً</div></div>';
}
function renderDelList(){
  if(!DB.deliveryOrders)DB.deliveryOrders=[];
  const filt=document.getElementById('delFilt').value;
  let list=DB.deliveryOrders;
  if(filt)list=list.filter(o=>o.status===filt);
  document.getElementById('delList').innerHTML=list.length?list.reverse().map(o=>`<div class="cc" onclick="showDelDet(${o.id})"><div class="cav">${o.customer[0]}</div><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px">${o.customer}</div><div style="font-size:11px;color:var(--t3)">📱 ${o.customerPhone} · #${o.orderNum}</div><div style="font-size:11px;color:var(--t4)">${o.items.length} صنف · ${fmt(o.total)}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px"><span class="badge ${o.status==='delivered'?'bg':o.status==='cancelled'?'br':'ba'}">${o.status==='delivered'?'تم التوصيل':o.status==='cancelled'?'ملغي':'معلق'}</span></div></div>`).join(''):'<div style="text-align:center;color:var(--t4);padding:28px;font-size:13px">لا توجد أوامر توصيل</div>';
}
function showDelDet(id){
  const o=DB.deliveryOrders.find(x=>x.id===id);if(!o)return;
  document.getElementById('delNum').textContent=o.orderNum;
  document.getElementById('delDet').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px">
      <div class="qsc"><div class="qsv" style="font-size:13px">${o.customer}</div><div class="qsl">العميل</div></div>
      <div class="qsc"><div class="qsv" style="font-size:11px">${o.customerPhone}</div><div class="qsl">الموبايل</div></div>
      <div class="qsc"><div class="qsv" style="font-size:11px">${o.customerAddress}</div><div class="qsl">العنوان</div></div>
      <div class="qsc"><div class="qsv"><span class="badge ${o.status==='delivered'?'bg':o.status==='out for delivery'?'bw':o.status==='cancelled'?'br':'ba'}">${o.status==='delivered'?'تم التوصيل':o.status==='out for delivery'?'خرج للتوصيل':o.status==='cancelled'?'ملغي':'معلق'}</span></div><div class="qsl">الحالة</div></div>
    </div>
    <div style="overflow-x:auto;margin-bottom:12px"><table><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
    <tbody>${o.items.map(item=>`<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.price} ج</td><td>${(item.price*item.qty).toFixed(2)} ج</td></tr>`).join('')}</tbody></table></div>
    <div style="background:var(--card2);padding:12px;border-radius:var(--r);border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span style="color:var(--t3)">رسوم التوصيل</span><span>${o.deliveryFee.toFixed(2)} ج</span></div>
      <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:800"><span>الإجمالي</span><span style="color:var(--pr)">${o.total.toFixed(2)} ج</span></div>
    </div>
    ${o.notes?`<div style="margin-top:10px;color:var(--t3);font-size:12px">📝 ${o.notes}</div>`:''}
    <div style="display:flex;gap:7px;margin-top:12px">
      ${o.status==='pending'?`<button class="btn btn-warning" onclick="updateDelStatus(${o.id}, 'out for delivery')">🚚 خرج للتوصيل</button>`:''}
      ${o.status==='out for delivery'?`<button class="btn btn-success" onclick="updateDelStatus(${o.id}, 'delivered')">✅ تم التسليم</button>`:''}
      ${o.status==='pending'||o.status==='out for delivery'?`<button class="btn btn-danger" onclick="updateDelStatus(${o.id}, 'cancelled')">❌ إلغاء</button>`:''}
    </div>
  `;
}
function deliverOrder(id){
  updateDelStatus(id, 'delivered');
}
function updateDelStatus(id, status){
  const o=DB.deliveryOrders.find(x=>x.id===id);if(!o)return;
  o.status=status;
  if(status==='delivered')o.deliveredAt=new Date().toISOString();
  if(status==='cancelled'&&o.status!=='delivered'){
    // إعادة المخزون إذا لم يتم التسليم
    o.items.forEach(item=>{const d=DB.drugs.find(x=>x.id===item.id);if(d)d.qty+=item.qty;});
  }
  save();renderDelList();showDelDet(id);showToast('✅ تم تحديث حالة الطلب');
}
function cancelOrder(id){
  updateDelStatus(id, 'cancelled');
}
function renderEmpList(){
  if(!DB.employees)DB.employees=[];
  const filt=document.querySelectorAll('#page-employees .tab')[document.querySelectorAll('#page-employees .tab').length-1]?.classList.contains('active')?'':document.querySelectorAll('#page-employees .tab')[0]?.textContent.trim()||'';
  let list=DB.employees;
  if(filt&&filt!=='الكل')list=list.filter(e=>e.jobTitle===filt);
  document.getElementById('empList').innerHTML=list.length?list.map(e=>`<div class="cc" onclick="showEmpDet(${e.id})"><div class="cav">${e.name[0]}</div><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px">${e.name}</div><div style="font-size:11px;color:var(--t3)">📱 ${e.phone||'-'} · ${e.jobTitle}</div><div style="font-size:11px;color:var(--t4)">المرتب: ${fmt(e.salary||0)}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px"><span class="badge bg">${e.jobTitle}</span><div style="display:flex;gap:3px"><button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();openEmpAdj('bonus',${e.id})">💰</button><button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();openEmpAdj('deduction',${e.id})">💸</button><button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();delEmp(${e.id})" style="color:var(--dan)">🗑️</button></div></div></div>`).join(''):'<div style="text-align:center;color:var(--t4);padding:28px;font-size:13px">لا توجد موظفين</div>';
}
document.querySelectorAll('.mo').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));

// ===== DASHBOARD =====
function renderDash(){
  const td=new Date().toDateString();
  const ti=DB.invoices.filter(i=>new Date(i.date).toDateString()===td&&!i.returned);
  const ts=ti.reduce((s,i)=>s+i.total,0);
  const lw=DB.drugs.filter(d=>d.qty<=d.min).length;
  const ex=DB.drugs.filter(d=>dDiff(d.exp)<=DB.sys.expDays).length;
  const dc=DB.customers.filter(c=>(c.totalDebt||0)-(c.totalPaid||0)>0);
  document.getElementById('dSales').textContent=fmt(ts);
  document.getElementById('dInvC').textContent=ti.length+' فاتورة';
  document.getElementById('dItems').textContent=DB.drugs.length;
  document.getElementById('dLow').textContent=lw+' منخفض';
  document.getElementById('dCusts').textContent=DB.customers.length;
  document.getElementById('dDebt').textContent=dc.length+' دين';
  document.getElementById('dExp').textContent=ex;
  // Chart
  const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toDateString();const l=d.toLocaleDateString('ar-EG',{weekday:'short'});const t=DB.invoices.filter(inv=>new Date(inv.date).toDateString()===ds&&!inv.returned).reduce((s,inv)=>s+inv.total,0);days.push({l,t});}
  const mx=Math.max(...days.map(d=>d.t),100);
  document.getElementById('dChart').innerHTML=days.map(d=>`<div class="bc"><div class="bv">${d.t>0?Math.round(d.t):''}</div><div class="bf" style="height:${Math.round(d.t/mx*120)}px"></div><div class="bl">${d.l}</div></div>`).join('');
  // Top
  const sc={};DB.invoices.filter(i=>!i.returned).forEach(inv=>inv.items.forEach(item=>{sc[item.name]=(sc[item.name]||0)+item.qty;}));
  const top=Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,5);const mx2=top[0]?.[1]||1;
  document.getElementById('dTop').innerHTML=top.length?top.map(([n,q])=>`<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span>${n}</span><span style="color:var(--t3)">${q}</span></div><div class="progress"><div class="pb" style="width:${Math.round(q/mx2*100)}%"></div></div></div>`).join(''):'<div style="color:var(--t4);font-size:13px;text-align:center;padding:14px">لا مبيعات بعد</div>';
  // Alerts
  const als=[];
  DB.drugs.forEach(d=>{const df=dDiff(d.exp);if(df<=0)als.push(`<div class="al al-r">🔴 <div><strong>${d.name}</strong> — منتهي!</div></div>`);else if(df<=14)als.push(`<div class="al al-r">🔴 <div><strong>${d.name}</strong> — ${df} يوم</div></div>`);else if(df<=30)als.push(`<div class="al al-w">🟡 <div><strong>${d.name}</strong> — ${df} يوم</div></div>`);if(d.qty<=d.min)als.push(`<div class="al al-w">📉 <div><strong>${d.name}</strong> — منخفض (${d.qty})</div></div>`);});
  document.getElementById('dAlerts').innerHTML=als.length?als.slice(0,5).join(''):'<div style="color:var(--t4);font-size:13px;padding:8px">✅ لا توجد تنبيهات</div>';
  document.getElementById('dDebtEl').innerHTML=dc.length?dc.slice(0,4).map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="font-weight:500">${c.name}</span><span class="dbr dr">💳 ${fmt((c.totalDebt||0)-(c.totalPaid||0))}</span></div>`).join(''):'<div style="color:var(--t4);font-size:13px;padding:8px">✅ لا ديون</div>';
}
function updateBadge(){const n=DB.drugs.filter(d=>dDiff(d.exp)<=DB.sys.expDays||d.qty<=d.min).length;const b=document.getElementById('aBadge');b.textContent=n;b.style.display=n?'inline-flex':'none';}
function updateTicker(){
  const sc={};DB.invoices.filter(i=>!i.returned).forEach(inv=>inv.items.forEach(item=>{sc[item.name]=(sc[item.name]||0)+item.qty;}));
  const top=Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const low=Object.entries(sc).sort((a,b)=>a[1]-b[1]).slice(0,3);
  const exp=DB.drugs.filter(d=>dDiff(d.exp)<=30).slice(0,3);
  let html='';top.forEach(([n,q])=>html+=`<span class="ticker-item hot">🔥 ${n}: ${q} مبيعات</span>`);
  low.forEach(([n,q])=>html+=`<span class="ticker-item cold">❄️ ${n}: ${q}</span>`);
  exp.forEach(d=>html+=`<span class="ticker-item expiring">⚠️ ${d.name} ينتهي ${d.exp}</span>`);
  document.getElementById('ticker').innerHTML=html+html;
}

// ===== POS =====
function debouncePosSrch(){clearTimeout(searchTimeout);searchTimeout=setTimeout(posSrch,200);}
function debounceCustSrch(){clearTimeout(custSearchTimeout);custSearchTimeout=setTimeout(posCustSrch,300);}
function posSrch(){
  const q=document.getElementById('psrch').value.toLowerCase().trim();
  const r=document.getElementById('pDrugRes');
  if(!q){r.innerHTML='';return;}
  const ql=q.length;
  let f=DB.drugs.filter(d=>{
    if(ql>2){
      return d.name.toLowerCase().includes(q)||d.code.includes(q);
    }
    return d.name.toLowerCase().startsWith(q)||d.barcode.includes(q)||(d.active||'').toLowerCase().includes(q)||d.code.includes(q);
  }).slice(0,8);
  let html = '';
  f.forEach(d=>{
    if(d.splitEnabled && d.stripsPerBox && d.unitsPerStrip){
      const boxPrice = d.sell;
      const stripPrice = boxPrice / d.stripsPerBox;
      const unitPrice = stripPrice / d.unitsPerStrip;
      html += `<div class="dri" onclick="addToPosWithPack(${d.id}, 'box', ${boxPrice})"><div><div style="font-weight:600;font-size:13px">${d.name} (علبة)</div><div style="font-size:11px;color:var(--t3)">${d.cat} · متاح: ${d.qty}</div></div><div style="font-weight:700;color:var(--pr)">${boxPrice.toFixed(2)} ج</div></div>`;
      if(d.stripsPerBox > 1) html += `<div class="dri" onclick="addToPosWithPack(${d.id}, 'strip', ${stripPrice})"><div><div style="font-weight:600;font-size:13px">${d.name} (شريط)</div></div><div style="font-weight:700;color:var(--pr)">${stripPrice.toFixed(2)} ج</div></div>`;
      if(d.unitsPerStrip > 1) html += `<div class="dri" onclick="addToPosWithPack(${d.id}, 'unit', ${unitPrice})"><div><div style="font-weight:600;font-size:13px">${d.name} (${d.unitType === 'tablet' ? 'قرص' : d.unitType === 'ampoule' ? 'أمبول' : 'وحدة'})</div></div><div style="font-weight:700;color:var(--pr)">${unitPrice.toFixed(2)} ج</div></div>`;
    } else {
      html += `<div class="dri" onclick="addToPos(${d.id})"><div><div style="font-weight:600;font-size:13px">${d.name}</div><div style="font-size:11px;color:var(--t3)">${d.cat}${d.active?' · '+d.active:''} · متاح: <strong style="color:${d.qty<=d.min?'var(--dan)':'var(--sc)'}">${d.qty}</strong></div></div><div style="font-weight:700;color:var(--pr)">${d.sell} ج</div></div>`;
    }
  });
  r.innerHTML=f.length?`<div class="card" style="overflow:hidden;margin-top:5px">${html}</div>`:'<div style="padding:7px;color:var(--t4);font-size:13px">لا نتائج</div>';
}
function posCustSrch(){
  const q=document.getElementById('pCustQ').value.trim().toLowerCase();
  const inf=document.getElementById('pCustInfo');
  const sug=document.getElementById('custSuggestions');
  if(!q){posCust=null;inf.innerHTML='';sug.innerHTML='';document.getElementById('pInvCust').textContent='بدون عميل';return;}
  const c=DB.customers.find(x=>x.phone.includes(q)||x.name.toLowerCase().includes(q)||x.code===q);
  if(c){
    posCust=c;
    const rem=(c.totalDebt||0)-(c.totalPaid||0);
    inf.innerHTML=`<span style="color:var(--sc)">✅ ${c.name} — ${c.phone}</span>${c.notes?`<span style="color:var(--warn);margin-right:7px">⚠️ ${c.notes}</span>`:''}${rem>0?`<span class="dbr dr" style="margin-right:7px">دين: ${fmt(rem)}</span>`:''}`;
    document.getElementById('pInvCust').textContent=c.name;
    // Suggestions based on history
    const invs=DB.invoices.filter(i=>i.customerId===c.id&&!i.returned);
    const items={};
    invs.forEach(inv=>inv.items.forEach(it=>{items[it.name]=(items[it.name]||0)+it.qty;}));
    const top=Object.entries(items).sort((a,b)=>b[1]-a[1]).slice(0,3);
    if(top.length)sug.innerHTML='<div style="font-size:11px;color:var(--t3);margin-bottom:3px">🧠 اقتراحات بناء على مشتريات سابقة:</div><div style="display:flex;gap:4px;flex-wrap:wrap">'+top.map(([n,q])=>`<button class="btn btn-xs" onclick="addToPosByName('${n.replace(/'/g,"\\'")}')">${n} (${q})</button>`).join('')+'</div>';
    else sug.innerHTML='';
  } else {
    posCust=null;
    inf.innerHTML='<span style="color:var(--dan)">❌ غير موجود</span>';
    sug.innerHTML='';
    document.getElementById('pInvCust').textContent='بدون عميل';
  }
}
function addToPos(id){
  const d=DB.drugs.find(x=>x.id===id);if(!d||d.qty<=0){showToast('⚠️ غير متوفر');return;}
  const ex=posItems.find(x=>x.id===id);
  if(ex){if(ex.qty>=d.qty){showToast('⚠️ لا يوجد مخزون كافٍ');return;}ex.qty++;}
  else posItems.push({id,name:d.name,price:d.sell,buyPrice:d.buy,qty:1,iD:0,iDT:'amount',pack:'box',unitQty:d.stripsPerBox*d.unitsPerStrip||1});
  document.getElementById('psrch').value='';document.getElementById('pDrugRes').innerHTML='';renderPos();chkInter();
}
function addToPosWithPack(id, pack, price){
  const d=DB.drugs.find(x=>x.id===id);if(!d)return;
  let unitQty=1;
  if(pack==='strip')unitQty=d.unitsPerStrip||1;
  else if(pack==='box')unitQty=(d.stripsPerBox||1)*(d.unitsPerStrip||1);
  if(d.qty<unitQty){showToast('⚠️ لا يوجد مخزون كافٍ');return;}
  const ex=posItems.find(x=>x.id===id&&x.pack===pack);
  if(ex){if((ex.qty+1)*unitQty>d.qty){showToast('⚠️ لا يوجد مخزون كافٍ');return;}ex.qty++;}
  else posItems.push({id,name:d.name,price,buyPrice:d.buy,qty:1,iD:0,iDT:'amount',pack,unitQty});
  document.getElementById('psrch').value='';document.getElementById('pDrugRes').innerHTML='';renderPos();chkInter();
}
function addToPosByName(name){
  const d=DB.drugs.find(x=>x.name===name);if(!d)return;addToPos(d.id);
}
function addToPosByName(name){
  const d=DB.drugs.find(x=>x.name===name);if(!d)return;addToPos(d.id);
}
function iTotal(item){const b=item.price*item.qty;if(!item.iD)return b;return item.iDT==='percent'?b*(1-item.iD/100):Math.max(0,b-item.iD);}
function renderPos(){
  document.getElementById('pBody').innerHTML=posItems.map((item,i)=>`<tr>
    <td><div style="font-weight:600">${item.name} (${item.pack||'علبة'})</div></td>
    <td>${item.price} ج</td>
    <td><div style="display:flex;gap:2px"><input type="number" min="0" value="${item.iD}" style="width:42px;padding:2px 3px;border:1px solid var(--border);border-radius:5px;font-size:11px;text-align:center;background:var(--card);color:var(--text)" onchange="updItemD(${i},'v',this.value)"><select style="width:38px;padding:2px;border:1px solid var(--border);border-radius:5px;font-size:10px;background:var(--card);color:var(--text)" onchange="updItemD(${i},'t',this.value)"><option value="amount" ${item.iDT==='amount'?'selected':''}>ج</option><option value="percent" ${item.iDT==='percent'?'selected':''}>%</option></select></div></td>
    <td><input type="number" min="1" value="${item.qty}" style="width:50px;padding:3px 5px;border:1px solid var(--border);border-radius:5px;text-align:center;background:var(--card);color:var(--text)" onchange="posQty(${i},this.value)"></td>
    <td style="font-weight:700;color:var(--pr)">${iTotal(item).toFixed(2)}</td>
    <td><button class="btn btn-xs btn-ghost" onclick="rmPos(${i})" style="color:var(--dan)">✕</button></td>
  </tr>`).join('');
  const ii=document.getElementById('pInvItems');
  ii.innerHTML=posItems.length?posItems.map(x=>`<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px"><span style="color:var(--t2)">${x.name} (${x.pack||'علبة'}) ×${x.qty}${x.iD>0?` (-${x.iD}${x.iDT==='percent'?'%':' ج'})`:''}</span><span style="font-weight:700">${iTotal(x).toFixed(2)} ج</span></div>`).join(''):'<div style="text-align:center;color:var(--t4);padding:22px 0;font-size:13px">ابدأ بإضافة أدوية 💊</div>';
  document.getElementById('pItemCnt').textContent=posItems.length+' صنف';
  calcPos();
}
function updItemD(i,f,v){if(f==='v')posItems[i].iD=parseFloat(v)||0;else posItems[i].iDT=v;renderPos();}
function posQty(i,v){posItems[i].qty=Math.max(1,parseInt(v)||1);renderPos();chkInter();}
function rmPos(i){posItems.splice(i,1);renderPos();chkInter();}
function calcPos(){
  const sub=posItems.reduce((s,x)=>s+iTotal(x),0);
  const dv=parseFloat(document.getElementById('pDiscV').value)||0;
  const dt=document.getElementById('pDiscT').value;
  const disc=dt==='percent'?sub*dv/100:dv;
  document.getElementById('pSub').textContent=sub.toFixed(2)+' ج';
  document.getElementById('pTotal').textContent=Math.max(0,sub-disc).toFixed(2)+' ج';
}
function getPosTotal(){
  const sub=posItems.reduce((s,x)=>s+iTotal(x),0);
  const dv=parseFloat(document.getElementById('pDiscV').value)||0;
  const dt=document.getElementById('pDiscT').value;
  const disc=dt==='percent'?sub*dv/100:dv;
  return{sub,disc,total:Math.max(0,sub-disc)};
}
function setPay(m){
  payM=m;
  ['pN','pV','pA','pD'].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.remove('ap');});
  const map={نقدي:'pN',فيزا:'pV',آجل:'pA',توصيل:'pD'};
  if(map[m])document.getElementById(map[m]).classList.add('ap');
}
function chkInter(){
  const names=posItems.map(x=>x.name.toLowerCase());
  const warns=INTER.filter(inter=>inter.drugs.filter(d=>names.some(n=>n.includes(d.toLowerCase()))).length>=2);
  document.getElementById('pInter').innerHTML=warns.map(w=>`<div class="iw"><strong>${w.level==='خطر'?'🚨 خطر!':'⚠️ تحذير'}</strong> ${w.msg}</div>`).join('');
}
async function completeSale(){
  if(!posItems.length){showToast('⚠️ أضف أدوية أولاً');return;}
  const{sub,disc,total}=getPosTotal();
  if(payM==='توصيل'){
    openM('mDelCust');
    if(posCust){
      document.getElementById('dcName').value=posCust.name||'';
      document.getElementById('dcPhone').value=posCust.phone||'';
      document.getElementById('dcAddr').value=posCust.addr||'';
    }
    return;
  }
  const profit=posItems.reduce((s,x)=>s+(iTotal(x)-x.buyPrice*x.qty*x.unitQty),0)-disc;
  posItems.forEach(item=>{const d=DB.drugs.find(x=>x.id===item.id);if(d)d.qty=Math.max(0,d.qty-item.qty*item.unitQty);});
  const inv={id:DB.sys.invNum,customer:posCust?posCust.name:'بدون عميل',customerId:posCust?posCust.id:null,cashier:'مدير الصيدلية',date:new Date().toISOString(),items:posItems.map(x=>({...x})),subtotal:sub,discount:disc,total,profit,payM,returned:false,returnReason:null,returnDate:null};
  DB.invoices.push(inv);
  if(posCust){if(payM==='آجل')posCust.totalDebt=(posCust.totalDebt||0)+total;else posCust.totalPaid=(posCust.totalPaid||0)+total;posCust.lastVisit=new Date().toISOString();}
  DB.sys.invNum++;await save();
  showToast('✅ تم البيع! الإجمالي: '+total.toFixed(2)+' ج');
  clearPos();renderDash();renderInv();renderAlerts();renderCashPage();renderAccounts();renderCusts();updateBadge();updateTicker();
}
function clearPos(){
  posItems=[];posCust=null;payM='نقدي';
  document.getElementById('pDiscV').value=0;
  document.getElementById('pCustQ').value='';
  document.getElementById('pCustInfo').innerHTML='';
  document.getElementById('pInvCust').textContent='بدون عميل';
  document.getElementById('psrch').value='';
  document.getElementById('pDrugRes').innerHTML='';
  document.getElementById('pInter').innerHTML='';
  document.getElementById('invN').textContent=DB.sys.invNum;
  setPay('نقدي');renderPos();
}

// ===== CUSTOMERS =====
function filtCust(f,el){custFilt=f;document.querySelectorAll('#page-customers .tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');renderCusts();}
function renderCusts(){
  const q=(document.getElementById('cSrch')?.value||'').toLowerCase();
  let list=DB.customers.filter(c=>c.name.toLowerCase().includes(q)||c.phone.includes(q)||c.code.includes(q));
  if(custFilt==='debt')list=list.filter(c=>(c.totalDebt||0)-(c.totalPaid||0)>0.01);
  if(custFilt==='regular')list=list.filter(c=>DB.invoices.filter(i=>i.customerId===c.id).length>=3);
  const el=document.getElementById('cList');
  if(!list.length){el.innerHTML='<div style="text-align:center;color:var(--t4);padding:28px;font-size:13px">لا يوجد عملاء</div>';return;}
  el.innerHTML=list.map(c=>{
    const invs=DB.invoices.filter(i=>i.customerId===c.id&&!i.returned);
    const rem=(c.totalDebt||0)-(c.totalPaid||0);
    return`<div class="cc" onclick="showCustDetail(${c.id})">
      <div class="cav">${c.name[0]}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:13px">${c.name} <span class="badge bgr" style="font-size:10px">#${c.code}</span></div>
        <div style="font-size:11px;color:var(--t3);margin-top:1px">📱 ${c.phone}${c.addr?' · '+c.addr:''}</div>
        <div style="font-size:11px;color:var(--t4);margin-top:1px">${invs.length} فاتورة${c.notes?` · ⚠️ ${c.notes}`:''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
        ${rem>0.01?`<span class="dbr dr">💳 ${fmt(rem)}</span>`:'<span class="dbr dg">✓</span>'}
        <div style="display:flex;gap:3px">
          <button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();openEditCust(${c.id})">✏️</button>
          <button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();delCust(${c.id})" style="color:var(--dan)">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function showCustDetail(id){
  selCust=id;
  const c=DB.customers.find(x=>x.id===id);if(!c)return;
  const invs=DB.invoices.filter(i=>i.customerId===id&&!i.returned);
  const total=invs.reduce((s,i)=>s+i.total,0);
  const rem=(c.totalDebt||0)-(c.totalPaid||0);
  document.getElementById('cDetail').innerHTML=`<div style="padding:18px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <div class="bigav">${c.name[0]}</div>
      <div style="flex:1"><div style="font-size:17px;font-weight:800">${c.name}</div><div style="color:var(--t3);font-size:12px">#${c.code} · 📱 ${c.phone}</div>${c.addr?`<div style="color:var(--t4);font-size:11px">${c.addr}</div>`:''}${c.notes?`<div style="color:var(--warn);font-size:11px;margin-top:2px">⚠️ ${c.notes}</div>`:''}</div>
    </div>
    <div class="qs">
      <div class="qsc"><div class="qsv">${invs.length}</div><div class="qsl">فواتير</div></div>
      <div class="qsc"><div class="qsv">${fmt(total)}</div><div class="qsl">إجمالي المشتريات</div></div>
      <div class="qsc"><div class="qsv" style="color:${rem>0?'var(--dan)':'var(--sc)'}">${fmt(rem)}</div><div class="qsl">الدين المتبقي</div></div>
    </div>
    ${rem>0.01?`<button class="btn btn-success btn-sm" style="width:100%;justify-content:center;margin-bottom:12px" onclick="openPayDebt(${c.id})">💳 تسجيل دفعة</button>`:''}
    <div style="font-size:12px;font-weight:700;margin-bottom:7px;color:var(--t2)">آخر الفواتير</div>
    ${[...invs].reverse().slice(0,5).map(inv=>`<div style="display:flex;justify-content:space-between;padding:7px 10px;background:var(--card2);border-radius:10px;margin-bottom:5px;font-size:12px;border:1px solid var(--border);cursor:pointer" onclick="showInvDet(${inv.id})"><div><strong>#${inv.id}</strong> · ${new Date(inv.date).toLocaleDateString('ar-EG')}</div><div><span class="badge ${inv.payM==='فيزا'?'bb':inv.payM==='آجل'?'ba':'bg'}">${inv.payM||'نقدي'}</span> <strong>${inv.total.toFixed(2)} ج</strong></div></div>`).join('')}
    ${!invs.length?'<div style="color:var(--t4);font-size:13px;text-align:center;padding:10px">لا توجد فواتير</div>':''}
    <div style="font-size:11px;color:var(--t4);margin-top:8px">تسجيل: ${new Date(c.createdAt||Date.now()).toLocaleDateString('ar-EG')}${c.lastVisit?' · آخر زيارة: '+new Date(c.lastVisit).toLocaleDateString('ar-EG'):''}</div>
  </div>`;
}
function openEditCust(id){const c=DB.customers.find(x=>x.id===id);if(!c)return;document.getElementById('ecId').value=id;document.getElementById('ecN').value=c.name;document.getElementById('ecP').value=c.phone;document.getElementById('ecAd').value=c.addr||'';document.getElementById('ecNt').value=c.notes||'';openM('mEditCust');}
async function updateCust(){const id=parseInt(document.getElementById('ecId').value);const c=DB.customers.find(x=>x.id===id);if(!c)return;c.name=document.getElementById('ecN').value.trim()||c.name;c.phone=document.getElementById('ecP').value;c.addr=document.getElementById('ecAd').value;c.notes=document.getElementById('ecNt').value;await save();closeM('mEditCust');renderCusts();if(selCust===id)showCustDetail(id);showToast('✅ تم التحديث');}
async function saveCust(){const name=document.getElementById('cN').value.trim();if(!name){showToast('⚠️ أدخل الاسم');return;}const code=String(custSeq++);DB.customers.push({id:custSeq,code,name,phone:document.getElementById('cP').value,addr:document.getElementById('cAd').value,notes:document.getElementById('cNt').value,createdAt:new Date().toISOString(),totalDebt:0,totalPaid:0});await save();closeM('mAddCust');renderCusts();showToast('✅ تم إضافة العميل رقم: '+code);}
async function saveQCust(){const name=document.getElementById('qcN').value.trim();const phone=document.getElementById('qcP').value.trim();if(!name||!phone){showToast('⚠️ أدخل الاسم والموبايل');return;}const code=String(custSeq++);const c={id:custSeq,code,name,phone,addr:'',notes:document.getElementById('qcNt').value,createdAt:new Date().toISOString(),totalDebt:0,totalPaid:0};DB.customers.push(c);posCust=c;await save();closeM('mAddCustQ');document.getElementById('pCustQ').value=phone;posCustSrch();showToast('✅ تم إضافة العميل');}
async function delCust(id){if(!confirm('حذف العميل؟'))return;DB.customers=DB.customers.filter(c=>c.id!==id);await save();renderCusts();if(selCust===id){document.getElementById('cDetail').innerHTML='<div style="padding:40px;text-align:center;color:var(--t4)"><div style="font-size:36px;margin-bottom:8px">👤</div><div>اختر عميلاً</div></div>';selCust=null;}}
function openPayDebt(id){const c=DB.customers.find(x=>x.id===id);if(!c)return;document.getElementById('pdId').value=id;document.getElementById('pdName').textContent=c.name;document.getElementById('pdRem').textContent=fmt((c.totalDebt||0)-(c.totalPaid||0));document.getElementById('pdAmt').value='';document.getElementById('pdNote').value='';openM('mPayDebt');}
async function saveDebtPay(){const id=parseInt(document.getElementById('pdId').value);const amt=parseFloat(document.getElementById('pdAmt').value)||0;if(!amt){showToast('⚠️ أدخل المبلغ');return;}const c=DB.customers.find(x=>x.id===id);if(!c)return;c.totalPaid=(c.totalPaid||0)+amt;DB.debtPays.push({custId:id,amt,note:document.getElementById('pdNote').value,date:new Date().toISOString()});await save();closeM('mPayDebt');renderCusts();renderAccounts();renderDash();if(selCust===id)showCustDetail(id);showToast('✅ تم تسجيل الدفعة');}

// ===== INVENTORY =====
function renderInv(){
  const q=(document.getElementById('invSrch')?.value||'').toLowerCase();
  const f=document.getElementById('invFilt')?.value||'';
  let list=DB.drugs.filter(d=>d.name.toLowerCase().includes(q)||d.cat.toLowerCase().includes(q)||(d.active||'').toLowerCase().includes(q));
  if(f==='low')list=list.filter(d=>d.qty<=d.min);
  if(f==='expiring')list=list.filter(d=>dDiff(d.exp)<=DB.sys.expDays);
  document.getElementById('invBody').innerHTML=list.map(d=>{
    const df=dDiff(d.exp);
    let st='<span class="badge bg">✓ جيد</span>';
    if(df<=0)st='<span class="badge br">منتهي</span>';
    else if(df<=14)st=`<span class="badge br">⚠️ ${df} يوم</span>`;
    else if(df<=30)st=`<span class="badge ba">⏰ ${df} يوم</span>`;
    else if(d.qty<=d.min)st='<span class="badge ba">📉 منخفض</span>';
    return`<tr><td><div style="font-weight:600">${d.name}</div><div style="font-size:11px;color:var(--t3)">كود: ${d.code}</div></td><td><span class="badge bb">${d.cat}</span></td><td style="font-size:12px;color:var(--t3)">${d.active||'-'}</td><td style="${d.qty<=d.min?'color:var(--dan);font-weight:700':''}">${d.qty}</td><td>${d.buy} ج</td><td style="font-weight:700;color:var(--pr)">${d.sell} ج</td><td style="font-size:12px">${d.exp}</td><td>${st}</td><td><div style="display:flex;gap:4px"><button class="btn btn-xs btn-ghost" onclick="openEditDrug(${d.id})">تعديل</button><button class="btn btn-xs btn-ghost" onclick="delDrug(${d.id})" style="color:var(--dan)">🗑️</button></div></td></tr>`;
  }).join('');
}
async function editQty(id){const d=DB.drugs.find(x=>x.id===id);const v=prompt(`كمية "${d.name}" (${d.qty}):`,d.qty);if(v!==null&&!isNaN(v)){d.qty=Math.max(0,parseInt(v));await save();renderInv();renderAlerts();renderDash();updateBadge();}}
function openEditDrug(id){const d=DB.drugs.find(x=>x.id===id);if(!d)return;document.getElementById('edId').value=id;document.getElementById('edCode').value=d.code;document.getElementById('edN').value=d.name;document.getElementById('edC').value=d.cat;document.getElementById('edA').value=d.active||'';document.getElementById('edQ').value=d.qty;document.getElementById('edMQ').value=d.min;document.getElementById('edB').value=d.buy;document.getElementById('edS').value=d.sell;document.getElementById('edE').value=d.exp;document.getElementById('edBar').value=d.barcode;openM('mEditDrug');}
async function updateDrug(){const id=parseInt(document.getElementById('edId').value);const d=DB.drugs.find(x=>x.id===id);if(!d)return;d.name=document.getElementById('edN').value.trim()||d.name;d.cat=document.getElementById('edC').value;d.active=document.getElementById('edA').value;d.qty=parseInt(document.getElementById('edQ').value)||0;d.min=parseInt(document.getElementById('edMQ').value)||10;d.buy=parseFloat(document.getElementById('edB').value)||0;d.sell=parseFloat(document.getElementById('edS').value)||0;d.exp=document.getElementById('edE').value;d.barcode=document.getElementById('edBar').value;await save();closeM('mEditDrug');renderInv();renderDash();updateBadge();showToast('✅ تم التحديث');}
async function delDrug(id){if(!confirm('حذف الصنف؟'))return;DB.drugs=DB.drugs.filter(d=>d.id!==id);await save();renderInv();renderDash();updateBadge();}
async function saveDrug(){const name=document.getElementById('dN').value.trim();if(!name){showToast('⚠️ أدخل الاسم');return;}const code=String(++drugCodeSeq);DB.drugs.push({id:drugSeq++,name,cat:document.getElementById('dC').value,active:document.getElementById('dA').value,qty:parseInt(document.getElementById('dQ').value)||0,min:parseInt(document.getElementById('dMQ').value)||10,buy:parseFloat(document.getElementById('dB').value)||0,sell:parseFloat(document.getElementById('dS').value)||0,exp:document.getElementById('dE').value||'2027-01-01',barcode:document.getElementById('dBar').value,code,boxPrice:parseFloat(document.getElementById('dBoxPrice').value)||0,stripsPerBox:parseInt(document.getElementById('dStripsPerBox').value)||1,unitsPerStrip:parseInt(document.getElementById('dUnitsPerStrip').value)||1,unitType:document.getElementById('dUnitType').value});await save();closeM('mAddDrug');renderInv();renderDash();updateBadge();showToast('✅ تم إضافة الصنف - الكود: '+code);}

// ===== DRUG DB =====
async function srchDB(){
  const q=document.getElementById('dbQ').value.trim();if(!q){showToast('⚠️ اكتب اسم الدواء');return;}
  const res=document.getElementById('dbRes');
  res.innerHTML='<div style="padding:14px;text-align:center;color:var(--t3)"><div class="spin"></div> جاري البحث...</div>';
  await doAIDrugSearch(q,res,true);
}
async function srchDBModal(){
  const q=document.getElementById('dbMQ').value.trim();if(!q)return;
  const res=document.getElementById('dbMRes');
  res.innerHTML='<div style="padding:7px;color:var(--t3);font-size:12px"><div class="spin"></div> جاري البحث...</div>';
  await doAIDrugSearch(q,res,false);
}
async function doAIDrugSearch(q,el,full){
  try{
    const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+GKEY},body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'system',content:'أنت خبير أدوية مصري. أجب بـ JSON فقط بدون نص إضافي: {"results":[{"nameAr":"","nameEn":"","active":"","use":"","cat":"","price":0,"company":"","alternatives":[]}]} — 3 نتائج كحد أقصى، البيانات من dalilaldwaa.com'},{role:'user',content:'ابحث عن: '+q}]})});
    const d=await r.json();
    let p;try{p=JSON.parse(d.choices?.[0]?.message?.content||'{}');}catch(e){const m=(d.choices?.[0]?.message?.content||'').match(/\{[\s\S]*\}/);p=m?JSON.parse(m[0]):{results:[]};}
    const drugs=p.results||[];
    if(!drugs.length){el.innerHTML='<div style="color:var(--t4);padding:8px;font-size:13px">لا نتائج</div>';return;}
    if(full){
      el.innerHTML=drugs.map(drug=>`<div class="sr"><div style="display:flex;justify-content:space-between;margin-bottom:7px"><div><div style="font-weight:700;font-size:15px">${drug.nameAr}</div><div style="font-size:12px;color:var(--t3)">${drug.nameEn}</div></div><div style="font-size:20px;font-weight:800;color:var(--pr)">${drug.price||'؟'} ج</div></div><div style="font-size:12px;color:var(--t2);margin-bottom:3px">💊 ${drug.active} · 🏥 ${drug.use}</div><div style="font-size:11px;color:var(--t3);margin-bottom:8px">🏭 ${drug.company||'غير محدد'}</div>${drug.alternatives?.length?`<div style="font-size:11px;color:var(--t4);margin-bottom:8px">البدائل: ${drug.alternatives.join(' · ')}</div>`:''}<button class="btn btn-primary btn-sm" onclick="addFromDB('${esc(drug.nameAr)}','${esc(drug.nameEn)}','${esc(drug.active)}','${esc(drug.use)}',${drug.price||0},'${esc(drug.cat)}')">+ أضف للمخزون</button></div>`).join('');
    }else{
      el.innerHTML=drugs.map(drug=>`<div class="sr" onclick="fillDrugForm('${esc(drug.nameAr)}','${esc(drug.nameEn)}','${esc(drug.active)}','${esc(drug.use)}',${drug.price||0})"><div style="display:flex;justify-content:space-between"><div><div style="font-weight:700;font-size:13px">${drug.nameAr}</div><div style="font-size:11px;color:var(--t3)">${drug.nameEn} · ${drug.active}</div><div style="font-size:11px;color:var(--prt);margin-top:2px">${drug.use}</div></div><div style="font-weight:700;color:var(--sc)">${drug.price||'؟'} ج</div></div></div>`).join('');
    }
  }catch(e){el.innerHTML='<div style="color:var(--dan);padding:8px;font-size:12px">مشكلة في الاتصال</div>';}
}
function addFromDB(nA,nE,act,use,pr,cat){openM('mAddDrug');setTimeout(()=>{document.getElementById('dN').value=nA+(nE?' / '+nE:'');document.getElementById('dA').value=act+(use?' — '+use:'');document.getElementById('dS').value=pr||0;document.getElementById('dB').value=pr?Math.round(pr*0.7):0;document.getElementById('dbMRes').innerHTML='<div style="background:var(--sl);padding:7px;border-radius:6px;font-size:12px;color:var(--sct)">✅ تم ملء البيانات</div>';},100);}
function fillDrugForm(nA,nE,act,use,pr){document.getElementById('dN').value=nA+(nE?' / '+nE:'');document.getElementById('dA').value=act+(use?' — '+use:'');document.getElementById('dS').value=pr||0;document.getElementById('dB').value=pr?Math.round(pr*0.7):0;document.getElementById('dbMRes').innerHTML='<div style="background:var(--sl);padding:7px;border-radius:6px;font-size:12px;color:var(--sct)">✅ تم ملء البيانات</div>';}
function esc(s){return(s||'').replace(/'/g,"\\'").replace(/"/g,'\\"');}

// ===== ALERTS =====
function renderAlerts(){
  const exp=DB.drugs.filter(d=>dDiff(d.exp)<=DB.sys.expDays).sort((a,b)=>dDiff(a.exp)-dDiff(b.exp));
  document.getElementById('expBody').innerHTML=exp.map(d=>{const df=dDiff(d.exp);const cl=df<=14?'br':'ba';return`<tr><td><strong>${d.name}</strong></td><td>${d.exp}</td><td><span class="badge ${cl}">${df<=0?'منتهي':df+' يوم'}</span></td><td>${d.qty}</td><td>${df<=0?'<span class="badge br">منتهي</span>':'<span class="badge ba">قريب</span>'}</td></tr>`;}).join('')||'<tr class="etr"><td colspan="5">✅ لا توجد تنبيهات</td></tr>';
  const low=DB.drugs.filter(d=>d.qty<=d.min);
  document.getElementById('lowBody').innerHTML=low.map(d=>`<tr><td><strong>${d.name}</strong></td><td style="color:var(--dan);font-weight:700">${d.qty}</td><td>${d.min}</td><td style="color:var(--sct)">اطلب ${d.min*3}</td></tr>`).join('')||'<tr class="etr"><td colspan="4">✅ المخزون جيد</td></tr>';
}

// ===== PURCHASES =====
function srchPurch(){const q=document.getElementById('pSrch').value.toLowerCase().trim();const res=document.getElementById('pRes');if(!q){res.innerHTML='';return;}const f=DB.drugs.filter(d=>d.name.toLowerCase().includes(q)).slice(0,6);res.innerHTML=f.length?`<div class="card" style="overflow:hidden">${f.map(d=>`<div class="dri" onclick="addToPurch(${d.id})"><div style="font-weight:600;font-size:13px">${d.name}</div><div style="font-size:11px;color:var(--t3)">سعر شراء: ${d.buy} ج</div></div>`).join('')}</div>`:'';}
function addToPurch(id){const d=DB.drugs.find(x=>x.id===id);const ex=purchItems.find(x=>x.id===id);if(ex)ex.qty++;else purchItems.push({id,name:d.name,qty:1,buy:d.buy});document.getElementById('pSrch').value='';document.getElementById('pRes').innerHTML='';renderPurchItems();}
function renderPurchItems(){document.getElementById('pItems').innerHTML=purchItems.map((item,i)=>`<tr><td>${item.name}</td><td><input type="number" min="1" value="${item.qty}" style="width:55px;padding:2px 5px;border:1px solid var(--border);border-radius:5px;text-align:center;background:var(--card);color:var(--text)" onchange="updPQ(${i},this.value)"></td><td><input type="number" min="0" step="0.01" value="${item.buy}" style="width:72px;padding:2px 5px;border:1px solid var(--border);border-radius:5px;text-align:center;background:var(--card);color:var(--text)" onchange="updPP(${i},this.value)"></td><td style="font-weight:700">${(item.qty*item.buy).toFixed(2)} ج</td><td><button class="btn btn-xs btn-ghost" onclick="rmPI(${i})" style="color:var(--dan)">✕</button></td></tr>`).join('');calcPurchT();}
function updPQ(i,v){purchItems[i].qty=Math.max(1,parseInt(v)||1);renderPurchItems();}
function updPP(i,v){purchItems[i].buy=parseFloat(v)||0;renderPurchItems();}
function rmPI(i){purchItems.splice(i,1);renderPurchItems();}
function calcPurchT(){const sub=purchItems.reduce((s,x)=>s+x.qty*x.buy,0);const disc=parseFloat(document.getElementById('pDisc').value)||0;document.getElementById('pTotal2').textContent=Math.max(0,sub-disc).toFixed(2)+' ج';}
async function savePurch(){
  const sup=document.getElementById('pSup').value.trim();if(!sup){showToast('⚠️ أدخل المورد');return;}if(!purchItems.length){showToast('⚠️ أضف أصناف');return;}
  const sub=purchItems.reduce((s,x)=>s+x.qty*x.buy,0);const disc=parseFloat(document.getElementById('pDisc').value)||0;const total=Math.max(0,sub-disc);
  purchItems.forEach(item=>{const d=DB.drugs.find(x=>x.id===item.id);if(d){d.qty+=item.qty;d.buy=item.buy;}});
  DB.purchases.push({id:Date.now(),sup,num:document.getElementById('pNum').value,date:document.getElementById('pDate').value||new Date().toISOString().split('T')[0],items:purchItems.map(x=>({...x})),sub,disc,total});
  await save();purchItems=[];closeM('mAddPurch');renderPurches();renderInv();renderDash();renderAccounts();showToast('✅ تم حفظ الفاتورة');}
}
function renderCashPage(){
  const td=new Date().toDateString();
  const todayInvs=DB.invoices.filter(i=>new Date(i.date).toDateString()===td&&!i.returned);
  const todayCash=todayInvs.filter(i=>i.payM==='نقدي').reduce((s,i)=>s+i.total,0);
  const todayVisa=todayInvs.filter(i=>i.payM==='فيزا').reduce((s,i)=>s+i.total,0);
  const todayExp=(DB.expenses||[]).filter(e=>new Date(e.date).toDateString()===td).reduce((s,e)=>s+e.amt,0);
  const drawerBalance=todayCash-todayExp;
  document.getElementById('cashDrawer').textContent=fmt(Math.max(0,drawerBalance));
  document.getElementById('cashDrawerSub').textContent=`نقدي: ${fmt(todayCash)} — مصروفات: ${fmt(todayExp)}`;
  document.getElementById('cashVisa').textContent=fmt(todayVisa);
  document.getElementById('cashVisaSub').textContent=`${todayInvs.filter(i=>i.payM==='فيزا').length} فاتورة فيزا`;
  document.getElementById('cashSafe').textContent=fmt(DB.safeBalance||0);
  // Shift stats
  const{cash,visa,ajal,total,invs}=getShiftStats();
  document.getElementById('shtSales').textContent=fmt(total);
  document.getElementById('shtInvs').textContent=invs;
  document.getElementById('shtCash').textContent=fmt(cash);
  document.getElementById('shtVisa').textContent=fmt(visa);
  document.getElementById('shiftTime').textContent='بدأ: '+new Date(DB.currentShiftStart||new Date()).toLocaleString('ar-EG');
  // Safe log
  document.getElementById('safeLog').innerHTML=(DB.safeLog||[]).slice(-5).reverse().map(s=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--border)"><span style="color:var(--t3)">${new Date(s.date).toLocaleDateString('ar-EG')}</span><span style="font-weight:700;color:var(--pur)">${fmt(s.amt)}</span></div>`).join('')||'<div style="color:var(--t4);font-size:12px;padding:5px">لا توجد تحويلات</div>';
  // Shift history
  document.getElementById('shiftHistBody').innerHTML=[...(DB.shifts||[])].reverse().slice(0,10).map(s=>`<tr><td style="font-size:11px">${new Date(s.date).toLocaleDateString('ar-EG')}</td><td>${s.cashier}</td><td style="font-size:11px">${new Date(s.start).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</td><td style="font-size:11px">${new Date(s.end).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</td><td>${s.invs}</td><td style="color:var(--sct)">${fmt(s.cash)}</td><td style="color:var(--prt)">${fmt(s.visa)}</td><td style="color:var(--wt)">${fmt(s.ajal)}</td><td style="font-weight:700">${fmt(s.total)}</td><td style="color:var(--pur)">${fmt(s.transfer)}</td></tr>`).join('')||'<tr class="etr"><td colspan="10">لا توجد شيفتات مقفلة</td></tr>';
}
function transferToSafe(){
  const amt=parseFloat(document.getElementById('safeTransfer').value)||0;
  if(!amt){showToast('⚠️ أدخل المبلغ');return;}
  if(!DB.safeLog)DB.safeLog=[];
  DB.safeBalance=(DB.safeBalance||0)+amt;
  DB.safeLog.push({amt,note:document.getElementById('safeNote').value,date:new Date().toISOString()});
  document.getElementById('safeTransfer').value='';document.getElementById('safeNote').value='';
  save();renderCashPage();showToast('✅ تم تحويل '+fmt(amt)+' للخزنة');
}
function closeShift(){
  const{cash,visa,ajal,total,invs}=getShiftStats();
  const transfer=parseFloat(document.getElementById('csTrans').value)||0;
  const shift={id:Date.now(),cashier:CU.name,start:DB.currentShiftStart||new Date().toISOString(),end:new Date().toISOString(),date:new Date().toISOString(),cash,visa,ajal,total,invs,transfer,notes:document.getElementById('csNotes').value};
  if(!DB.shifts)DB.shifts=[];
  DB.shifts.push(shift);
  if(transfer>0){if(!DB.safeLog)DB.safeLog=[];DB.safeBalance=(DB.safeBalance||0)+transfer;DB.safeLog.push({amt:transfer,note:'تحويل تقفيل شيفت',date:new Date().toISOString()});}
  DB.currentShiftStart=new Date().toISOString();
  save();closeM('mCloseShift');renderCashPage();showToast('✅ تم تقفيل الشيفت بنجاح');}

// ===== ACCOUNTS =====
function renderAccounts(){
  const td=new Date().toDateString();
  const ti=DB.invoices.filter(i=>new Date(i.date).toDateString()===td&&!i.returned);
  const ts=ti.reduce((s,i)=>s+i.total,0);const tp=ti.reduce((s,i)=>s+(i.profit||0),0);
  const tc=ti.filter(i=>i.payM==='نقدي').reduce((s,i)=>s+i.total,0);
  const tv=ti.filter(i=>i.payM==='فيزا').reduce((s,i)=>s+i.total,0);
  document.getElementById('acSales').textContent=fmt(ts);document.getElementById('acInvC').textContent=ti.length+' فاتورة';
  document.getElementById('acProfit').textContent=fmt(tp);document.getElementById('acCash').textContent=fmt(tc);document.getElementById('acVisa').textContent=fmt(tv);
  const now=new Date();
  const mi=DB.invoices.filter(i=>{const d=new Date(i.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&!i.returned;});
  const mp=DB.purchases.filter(p=>{const d=new Date(p.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((s,p)=>s+p.total,0);
  const me=(DB.expenses||[]).filter(e=>{const d=new Date(e.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((s,e)=>s+e.amt,0);
  const mpr=mi.reduce((s,i)=>s+(i.profit||0),0)-me;
  const totalAjal=DB.invoices.filter(i=>i.payM==='آجل'&&!i.returned).reduce((s,i)=>s+i.total,0);
  const totalPaid=(DB.debtPays||[]).reduce((s,p)=>s+p.amt,0);
  document.getElementById('acMSales').textContent=fmt(mi.reduce((s,i)=>s+i.total,0));
  document.getElementById('acMPurch').textContent=fmt(mp);
  document.getElementById('acMExp').textContent=fmt(me);
  document.getElementById('acMAjal').textContent=fmt(Math.max(0,totalAjal-totalPaid));
  document.getElementById('acMProfit').textContent=fmt(mpr);
  document.getElementById('expBody2').innerHTML=[...(DB.expenses||[])].reverse().slice(0,15).map(e=>`<tr><td style="font-size:11px">${new Date(e.date).toLocaleDateString('ar-EG')}</td><td><span class="badge bgr">${e.type}</span></td><td>${e.party}</td><td style="font-weight:700;color:var(--dan)">${fmt(e.amt)}</td><td style="font-size:11px;color:var(--t3)">${e.note||'-'}</td></tr>`).join('')||'<tr class="etr"><td colspan="5">لا توجد مصروفات</td></tr>';
  const dc=DB.customers.filter(c=>(c.totalDebt||0)-(c.totalPaid||0)>0.01);
  document.getElementById('debtBody').innerHTML=dc.map(c=>{const rem=(c.totalDebt||0)-(c.totalPaid||0);return`<tr><td><strong>${c.name}</strong><div style="font-size:11px;color:var(--t3)">${c.phone}</div></td><td>${fmt(c.totalDebt||0)}</td><td style="color:var(--sct)">${fmt(c.totalPaid||0)}</td><td style="color:var(--dan);font-weight:700">${fmt(rem)}</td><td><button class="btn btn-xs btn-success" onclick="openPayDebt(${c.id})">💳 دفعة</button></td></tr>`;}).join('')||'<tr class="etr"><td colspan="5">✅ لا ديون</td></tr>';
}

// ===== REPORTS =====
function showRpt(name,el){
  document.querySelectorAll('.rpt-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('#page-reports .tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('rpt-'+name).classList.add('active');el.classList.add('active');
  if(name==='sales')renderSalesRpt();
  if(name==='returns')renderReturnsRpt();
  if(name==='shifts')renderShiftsRpt();
  if(name==='newcusts')renderNewCustsRpt();
}

function getDateFilter(fromId,toId){
  const from=document.getElementById(fromId).value;
  const to=document.getElementById(toId).value;
  return{from:from?new Date(from):null,to:to?new Date(to+'T23:59:59'):null};
}

function inDateRange(dateStr,from,to){
  const d=new Date(dateStr);
  if(from&&d<from)return false;
  if(to&&d>to)return false;
  return true;
}

function renderSalesRpt(){
  const{from,to}=getDateFilter('rf-from','rf-to');
  const payFilt=document.getElementById('rf-pay').value;
  let list=DB.invoices.filter(i=>!i.returned&&inDateRange(i.date,from,to));
  if(payFilt)list=list.filter(i=>i.payM===payFilt);
  const total=list.reduce((s,i)=>s+i.total,0);
  const profit=list.reduce((s,i)=>s+(i.profit||0),0);
  const avg=list.length?total/list.length:0;
  document.getElementById('rs-total').textContent=fmt(total);
  document.getElementById('rs-invs').textContent=list.length;
  document.getElementById('rs-avg').textContent=fmt(avg);
  document.getElementById('rs-profit').textContent=fmt(profit);
  document.getElementById('rptSalesBody').innerHTML=[...list].reverse().map(inv=>`<tr>
    <td><strong>#${inv.id}</strong></td><td>${inv.customer}</td>
    <td style="font-size:11px">${new Date(inv.date).toLocaleString('ar-EG')}</td>
    <td><span class="badge ${inv.payM==='فيزا'?'bb':inv.payM==='آجل'?'ba':'bg'}">${inv.payM||'نقدي'}</span></td>
    <td>${inv.items.length}</td>
    <td style="font-weight:700;color:var(--pr)">${inv.total.toFixed(2)} ج</td>
    <td><span class="badge bgr">${inv.cashier}</span></td>
    <td><button class="btn btn-xs" onclick="showInvDet(${inv.id})">عرض</button></td>
  </tr>`).join('')||'<tr class="etr"><td colspan="8">لا توجد فواتير</td></tr>';
}

function clearSalesFilter(){['rf-from','rf-to'].forEach(id=>{document.getElementById(id).value='';});document.getElementById('rf-pay').value='';renderSalesRpt();}

function renderReturnsRpt(){
  const{from,to}=getDateFilter('rr-from','rr-to');
  const reasonFilt=document.getElementById('rr-reason').value;
  let list=DB.invoices.filter(i=>i.returned&&inDateRange(i.returnDate||i.date,from,to));
  if(reasonFilt)list=list.filter(i=>i.returnReason===reasonFilt);
  document.getElementById('rr-count').textContent=list.length;
  document.getElementById('rr-total').textContent=fmt(list.reduce((s,i)=>s+i.total,0));
  document.getElementById('rr-items').textContent=list.reduce((s,i)=>s+i.items.length,0);
  document.getElementById('rptReturnsBody').innerHTML=list.map(inv=>`<tr>
    <td><strong>#${inv.id}</strong></td>
    <td style="font-size:11px">${new Date(inv.returnDate||inv.date).toLocaleDateString('ar-EG')}</td>
    <td>${inv.customer}</td>
    <td><span class="badge ba">${inv.returnReason||'غير محدد'}</span></td>
    <td>${inv.items.length}</td>
    <td style="font-weight:700;color:var(--dan)">${inv.total.toFixed(2)} ج</td>
    <td><span class="badge bgr">${inv.cashier}</span></td>
  </tr>`).join('')||'<tr class="etr"><td colspan="7">لا توجد مرتجعات</td></tr>';
}

function renderShiftsRpt(){
  const{from,to}=getDateFilter('rsh-from','rsh-to');
  let list=(DB.shifts||[]).filter(s=>inDateRange(s.date,from,to));
  document.getElementById('rsh-count').textContent=list.length;
  document.getElementById('rsh-total').textContent=fmt(list.reduce((s,sh)=>s+sh.total,0));
  document.getElementById('rsh-safe').textContent=fmt(list.reduce((s,sh)=>s+sh.transfer,0));
  document.getElementById('rptShiftsBody').innerHTML=[...list].reverse().map(s=>`<tr>
    <td style="font-size:11px">${new Date(s.date).toLocaleDateString('ar-EG')}</td>
    <td>${s.cashier}</td>
    <td style="font-size:11px">${new Date(s.start).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</td>
    <td style="font-size:11px">${new Date(s.end).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}</td>
    <td style="font-weight:700">${s.invs}</td>
    <td style="color:var(--sct)">${fmt(s.cash)}</td>
    <td style="color:var(--prt)">${fmt(s.visa)}</td>
    <td style="color:var(--wt)">${fmt(s.ajal)}</td>
    <td style="font-weight:700">${fmt(s.total)}</td>
    <td style="color:var(--pur);font-weight:700">${fmt(s.transfer)}</td>
  </tr>`).join('')||'<tr class="etr"><td colspan="10">لا توجد شيفتات</td></tr>';
}

function renderNewCustsRpt(){
  const{from,to}=getDateFilter('rnc-from','rnc-to');
  let list=DB.customers.filter(c=>inDateRange(c.createdAt||'2000-01-01',from,to));
  const totalSales=list.reduce((s,c)=>s+(c.totalPaid||0)+(c.totalDebt||0),0);
  const totalDebt=list.reduce((s,c)=>s+Math.max(0,(c.totalDebt||0)-(c.totalPaid||0)),0);
  document.getElementById('rnc-count').textContent=list.length;
  document.getElementById('rnc-sales').textContent=fmt(totalSales);
  document.getElementById('rnc-debt').textContent=fmt(totalDebt);
  document.getElementById('rptNewCustsBody').innerHTML=list.map(c=>{
    const invs=DB.invoices.filter(i=>i.customerId===c.id&&!i.returned);
    const rem=(c.totalDebt||0)-(c.totalPaid||0);
    return`<tr>
      <td><span class="badge bp">${c.code}</span></td>
      <td><strong>${c.name}</strong>${c.notes?`<div style="font-size:11px;color:var(--wt)">⚠️ ${c.notes}</div>`:''}</td>
      <td>${c.phone}</td>
      <td style="font-size:11px">${new Date(c.createdAt||Date.now()).toLocaleDateString('ar-EG')}</td>
      <td>${invs.length}</td>
      <td style="font-weight:700;color:var(--pr)">${fmt((c.totalPaid||0)+(c.totalDebt||0))}</td>
      <td style="${rem>0?'color:var(--dan);font-weight:700':'color:var(--sct)'}">${fmt(rem)}</td>
    </tr>`;
  }).join('')||'<tr class="etr"><td colspan="7">لا عملاء جدد في هذه الفترة</td></tr>';
}

// ===== INVOICE DETAIL & RETURN =====
function showInvDet(id){
  const inv=DB.invoices.find(i=>i.id===id);if(!inv)return;
  window.currentInvId=id;
  document.getElementById('mRetTitle').textContent='فاتورة #'+inv.id+(inv.returned?' (مُرجَعة)':'');
  let itemsHtml=inv.items.map((item,i)=>`<div style="display:flex;align-items:center;gap:5px;padding:5px;border:1px solid var(--border);border-radius:5px;margin-bottom:3px"><input type="checkbox" id="retChk${i}"> <span>${item.name} ×${item.qty}</span> <input type="number" id="retQty${i}" min="0" max="${item.qty}" value="${item.qty}" style="width:50px"></div>`).join('');
  document.getElementById('mRetBody').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      <div class="qsc"><div class="qsv" style="font-size:13px">${inv.customer}</div><div class="qsl">العميل</div></div>
      <div class="qsc"><div class="qsv" style="font-size:11px">${new Date(inv.date).toLocaleDateString('ar-EG')}</div><div class="qsl">التاريخ</div></div>
      <div class="qsc"><div class="qsv"><span class="badge ${inv.payM==='فيزا'?'bb':inv.payM==='آجل'?'ba':'bg'}">${inv.payM||'نقدي'}</span></div><div class="qsl">الدفع</div></div>
      <div class="qsc"><div class="qsv" style="font-size:13px">${inv.cashier}</div><div class="qsl">الكاشير</div></div>
    </div>
    <div style="overflow-x:auto;margin-bottom:12px"><table><thead><tr><th>الصنف</th><th>السعر</th><th>الكمية</th><th>خصم</th><th>الإجمالي</th></tr></thead>
    <tbody>${inv.items.map(item=>`<tr><td>${item.name}</td><td>${item.price} ج</td><td>${item.qty}</td><td>${(item.iD||0)>0?(item.iD)+(item.iDT==='percent'?'%':' ج'):'-'}</td><td style="font-weight:700">${iTotal(item).toFixed(2)} ج</td></tr>`).join('')}</tbody></table></div>
    <div style="background:var(--card2);padding:12px;border-radius:var(--r);border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span style="color:var(--t3)">المجموع</span><span>${inv.subtotal.toFixed(2)} ج</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span style="color:var(--t3)">الخصم</span><span>${inv.discount.toFixed(2)} ج</span></div>
      <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:800"><span>الإجمالي</span><span style="color:var(--pr)">${inv.total.toFixed(2)} ج</span></div>
    </div>
    ${inv.returned?`<div class="al al-r" style="margin-top:10px">✅ مُرجَعة — السبب: ${inv.returnReason||'غير محدد'} · ${new Date(inv.returnDate||inv.date).toLocaleDateString('ar-EG')}</div>`:
    `<div style="margin-top:12px"><div style="font-size:12px;font-weight:700;margin-bottom:7px">اختر الأصناف للإرجاع:</div><div>${itemsHtml}</div><div style="margin-top:7px"><label class="fl">سبب الإرجاع</label><select class="fc" id="retReason"><option value="خطأ في البيع">خطأ في البيع</option><option value="دواء تالف">دواء تالف</option><option value="طلب العميل">طلب العميل</option><option value="دواء منتهي">دواء منتهي الصلاحية</option><option value="أخرى">أخرى</option></select></div></div>`}`;
  const btn=document.getElementById('mRetBtn');
  btn.style.display=inv.returned?'none':'inline-flex';
  openM('mReturn');
}
function retInv(id){
  const inv=DB.invoices.find(i=>i.id===id);if(!inv||inv.returned)return;
  const reason=document.getElementById('retReason').value;
  let returnedItems=[], totalReturn=0;
  inv.items.forEach((item,i)=>{
    const chk=document.getElementById('retChk'+i);
    if(chk.checked){
      const qty=parseInt(document.getElementById('retQty'+i).value)||0;
      if(qty>0&&qty<=item.qty){
        const d=DB.drugs.find(x=>x.id===item.id);
        if(d)d.qty+=qty;
        item.qty-=qty;
        returnedItems.push({...item,name:item.name,qty});
        totalReturn+=(item.price*qty);
      }
    }
  });
  if(!returnedItems.length){showToast('⚠️ اختر أصناف للإرجاع');return;}
  DB.returns=DB.returns||[];
  DB.returns.push({id:Date.now(),invoiceId:inv.id,date:new Date().toISOString(),items:returnedItems,total:totalReturn,reason});
  inv.returned=true;inv.returnReason=reason;inv.returnDate=new Date().toISOString();
  if(inv.customerId){const c=DB.customers.find(x=>x.id===inv.customerId);if(c){if(inv.payM==='آجل')c.totalDebt=Math.max(0,(c.totalDebt||0)-totalReturn);else c.totalPaid=Math.max(0,(c.totalPaid||0)-totalReturn);}}
  save();closeM('mReturn');renderSalesRpt();renderReturnsRpt();renderInv();renderDash();renderAccounts();renderCusts();updateBadge();showToast('✅ تم إرجاع الأصناف المحددة');}

// ===== AI =====
async function sendAI(){
  const inp=document.getElementById('aiIn');const msg=inp.value.trim();if(!msg)return;
  const msgs=document.getElementById('aiMsgs');
  msgs.innerHTML+=`<div style="max-width:80%;padding:10px 14px;background:linear-gradient(135deg,var(--pr),var(--pur));color:#fff;border-radius:12px;font-size:13px;align-self:flex-end;margin-right:auto;margin-left:20%">${msg}</div>`;
  inp.value='';msgs.scrollTop=msgs.scrollHeight;
  const t=document.createElement('div');
  t.style.cssText='max-width:85%;padding:11px 14px;background:var(--card2);border:1px solid var(--border);border-radius:12px;font-size:13px;line-height:1.7';
  t.innerHTML='<div style="font-size:9px;color:var(--pur);font-weight:700;margin-bottom:3px">AI ASSISTANT</div><div class="spin"></div> جاري التحليل...';
  msgs.appendChild(t);msgs.scrollTop=msgs.scrollHeight;
  const sum=DB.drugs.map(d=>`${d.name}(${d.active||''}):qty=${d.qty},sell=${d.sell}ج,exp=${d.exp}`).join('|');
  try{
    const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+GKEY},body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'system',content:`أنت مساعد ذكي متخصص في إدارة الصيدليات المصرية. اسم الصيدلية: ${DB.ph.name}. المخزون: ${sum}. عملاء: ${DB.customers.length}. أجب بالعربية باحترافية. يمكنك الرجوع لبيانات dalilaldwaa.com للأدوية والأسعار والبدائل.`},{role:'user',content:msg}]})});
    const d=await r.json();
    t.innerHTML=`<div style="font-size:9px;color:var(--pur);font-weight:700;margin-bottom:3px">AI ASSISTANT</div>${(d.choices?.[0]?.message?.content||'').replace(/\n/g,'<br>')}`;
  }catch(e){t.innerHTML='<div style="font-size:9px;color:var(--pur);font-weight:700;margin-bottom:3px">AI ASSISTANT</div>مشكلة في الاتصال.';}
  msgs.scrollTop=msgs.scrollHeight;
}

// ===== SETTINGS =====
function loadSettings(){
  document.getElementById('sN').value=DB.ph.name;document.getElementById('sL').value=DB.ph.lic||'';
  document.getElementById('sPh').value=DB.ph.phone||'';document.getElementById('sMg').value=DB.ph.mgr||'';
  document.getElementById('sAd').value=DB.ph.addr||'';document.getElementById('sMS').value=DB.sys.minStock;
  document.getElementById('sED').value=DB.sys.expDays;
}
function savePharm(){DB.ph.name=document.getElementById('sN').value.trim()||'صيدلية الجميعي';DB.ph.lic=document.getElementById('sL').value;DB.ph.phone=document.getElementById('sPh').value;DB.ph.mgr=document.getElementById('sMg').value;DB.ph.addr=document.getElementById('sAd').value;save();document.getElementById('sbName').textContent=DB.ph.name;document.getElementById('lpn').textContent=DB.ph.name;showToast('✅ تم الحفظ');}
function saveSys(){DB.sys.minStock=parseInt(document.getElementById('sMS').value)||10;DB.sys.expDays=parseInt(document.getElementById('sED').value)||30;save();updateBadge();renderAlerts();renderInv();showToast('✅ تم الحفظ');}
function saveUser(){const name=document.getElementById('uNm2').value.trim();const uname=document.getElementById('uUs').value.trim();const pass=document.getElementById('uPs').value;if(!name||!uname||!pass){showToast('⚠️ أكمل البيانات');return;}if(DB.users.find(u=>u.username===uname)){showToast('⚠️ اسم المستخدم موجود');return;}DB.users.push({id:userSeq++,name,username:uname,password:pass,role:document.getElementById('uRl2').value});save();closeM('mAddUser');renderUList();showToast('✅ تم إضافة المستخدم');}
function renderUList(){document.getElementById('uList').innerHTML=DB.users.map(u=>`<div style="display:flex;align-items:center;gap:10px;padding:11px;border:1px solid var(--border);border-radius:var(--r);margin-bottom:7px;background:var(--card2)"><div class="uav">${u.name[0]}</div><div style="flex:1"><div style="font-weight:700">${u.name}</div><div style="font-size:11px;color:var(--t3)">@${u.username} · ${u.role}</div></div><span class="badge ${u.role==='مدير النظام'?'br':u.role==='مدير'?'bp':'bb'}">${u.role}</span>${u.id!==1?`<button class="btn btn-xs btn-ghost" onclick="delUser(${u.id})" style="color:var(--dan)">🗑️</button>`:''}</div>`).join('');}
function delUser(id){if(!confirm('حذف المستخدم؟'))return;DB.users=DB.users.filter(u=>u.id!==id);save();renderUList();}
function showStab(name,el){document.querySelectorAll('.ss').forEach(s=>s.classList.remove('active'));document.querySelectorAll('.smi').forEach(n=>n.classList.remove('active'));document.getElementById('stab-'+name).classList.add('active');el.classList.add('active');}

// ===== NAV =====
function nav(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  const pageEl=document.getElementById('page-'+name);
  const navEl=document.querySelector(`.ni[data-page="${name}"]`);
  if(pageEl)pageEl.classList.add('active');
  if(navEl)navEl.classList.add('active');
  const titles={dash:'لوحة التحكم',pos:'نقطة البيع',delivery:'التوصيل المنزلي',customers:'إدارة العملاء',purchases:'فواتير الموردين',inventory:'إدارة المخزون',drugdb:'دليل الأدوية المصري',alerts:'التنبيهات',cash:'الخزنة والكاش',accounts:'الحسابات',reports:'التقارير',ai:'مساعد AI',settings:'الإعدادات',employees:'إدارة العاملين'};
  document.getElementById('ptitle').textContent=titles[name]||name;
  if(name==='pos'){document.getElementById('pInvTime').textContent=new Date().toLocaleString('ar-EG');document.getElementById('invN').textContent=DB.sys.invNum;}
  if(name==='delivery')renderDelList();
  if(name==='reports')renderSalesRpt();
  if(name==='settings'){renderUList();loadSettings();}
  if(name==='accounts')renderAccounts();
  if(name==='purchases')renderPurches();
  if(name==='cash')renderCashPage();
}

window.addEventListener('beforeunload', async () => { await window.saveData(DB); });
window.onload = async () => {
  await loadDB();
  initApp();
};