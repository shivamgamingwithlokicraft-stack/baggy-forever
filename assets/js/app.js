/* =========================================================================
   BAGGYFOREVER — app.js
   Main application: state, auth, cart, filters, try-on, booking, admin.
   ========================================================================= */

/* ---------------- STORAGE KEYS ---------------- */
const LS = {
  products:'bf_products_v2',
  cart:'bf_cart_v2',
  wish:'bf_wish_v2',
  wallet:'bf_wallet_v2',
  orders:'bf_orders_v2',
  bookings:'bf_bookings_v2',
  user:'bf_user_v2',
  admin:'bf_admin_v2',
  seeded:'bf_seeded_v2'
};

/* ---------------- SEED PRODUCTS ---------------- */
const SEED_PRODUCTS = [
  {id:1,name:"Y2K Surplus Jacket",price:1200,mrp:1800,size:"M",tag:"New",cat:"new",stock:1,img:"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80&auto=format&fit=crop"},
  {id:2,name:"Antique Wash Denim",price:899,mrp:1400,size:"32",tag:"",cat:"vintage",stock:1,img:"https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80&auto=format&fit=crop"},
  {id:3,name:"Vintage Graphic Tee",price:499,mrp:799,size:"L",tag:"Rare",cat:"vintage",stock:1,img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&auto=format&fit=crop"},
  {id:4,name:"Oversized Flannel",price:699,mrp:1100,size:"XL",tag:"",cat:"thrift",stock:1,img:"https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=600&q=80&auto=format&fit=crop"},
  {id:5,name:"Surplus Cargo Pants",price:1050,mrp:1600,size:"34",tag:"",cat:"surplus",stock:1,img:"https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&q=80&auto=format&fit=crop"},
  {id:6,name:"Thrift Denim Jacket",price:1350,mrp:2200,size:"S",tag:"1 of 1",cat:"thrift",stock:1,img:"https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80&auto=format&fit=crop"},
  {id:7,name:"Vintage Leather Belt",price:399,mrp:600,size:"32",tag:"",cat:"vintage",stock:2,img:"https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80&auto=format&fit=crop"},
  {id:8,name:"Surplus Field Shirt",price:799,mrp:1200,size:"M",tag:"New",cat:"new",stock:1,img:"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80&auto=format&fit=crop"},
  {id:9,name:"Retro Corduroy Pants",price:949,mrp:1500,size:"30",tag:"",cat:"vintage",stock:1,img:"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80&auto=format&fit=crop"},
  {id:10,name:"Baggy Sweatpants",price:599,mrp:999,size:"L",tag:"",cat:"new",stock:2,img:"https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80&auto=format&fit=crop"},
  {id:11,name:"Thrift Wool Overcoat",price:1899,mrp:3200,size:"L",tag:"1 of 1",cat:"thrift",stock:1,img:"https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80&auto=format&fit=crop"},
  {id:12,name:"Surplus Utility Vest",price:749,mrp:1150,size:"M",tag:"",cat:"surplus",stock:1,img:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&auto=format&fit=crop"}
];

/* ---------------- STATE ---------------- */
let state = {
  products: [],
  cart: [],
  wish: [],
  wallet: 5000,
  orders: [],
  bookings: [],
  user: null,
  admin: false,
  view: 'home',
  adminTab: 'products',
  filter: {cat:'all', size:'all', max:5000, sort:'featured', q:''}
};

/* ---------------- STORAGE HELPERS ---------------- */
function save(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function load(k,fb){ try{ const v=JSON.parse(localStorage.getItem(k)); return v??fb; }catch(e){ return fb; } }

function persistAll(){
  save(LS.products, state.products);
  save(LS.cart, state.cart);
  save(LS.wish, state.wish);
  save(LS.wallet, state.wallet);
  save(LS.orders, state.orders);
  save(LS.bookings, state.bookings);
  save(LS.user, state.user);
  save(LS.admin, state.admin);
}

function bootState(){
  if(!load(LS.seeded,false)){
    save(LS.products, SEED_PRODUCTS);
    save(LS.seeded, true);
  }
  state.products = load(LS.products, SEED_PRODUCTS);
  state.cart     = load(LS.cart, []);
  state.wish     = load(LS.wish, []);
  state.wallet   = load(LS.wallet, 5000);
  state.orders   = load(LS.orders, []);
  state.bookings = load(LS.bookings, []);
  state.user     = load(LS.user, null);
  state.admin    = load(LS.admin, false);
}

/* ---------------- HELPERS ---------------- */
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function cartTotal(){ return state.cart.reduce((s,i)=>s+i.price*i.qty,0); }
function cartCount(){ return state.cart.reduce((s,i)=>s+i.qty,0); }

let toastTimer;
function toast(msg, type='info'){
  const el = $('toast');
  el.textContent = msg;
  el.style.background = type==='err' ? 'var(--err)' : type==='ok' ? 'var(--ok)' : 'var(--ink)';
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('on'), 2200);
}

/* =========================================================================
   AUTH (SIMULATED)
   ========================================================================= */
let pendingPhone = null;
let pendingOtp = null;

function openAuth(mode='login'){
  const box = $('mbox');
  box.innerHTML = `
    <h3>Welcome back</h3>
    <p class="sub">Log in with your phone number. We'll send a demo OTP (shown on screen — no real SMS).</p>
    <div class="field"><label>Phone Number</label>
      <input id="authPhone" type="tel" inputmode="numeric" placeholder="98765 43210" maxlength="10" /></div>
    <div class="field"><label>Full Name (for new accounts)</label>
      <input id="authName" placeholder="Your name" /></div>
    <button class="btn btn-accent" style="width:100%;justify-content:center" onclick="sendOtp()">Send OTP →</button>
    <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:14px">
      New here? Just enter phone + name — account is created automatically.
    </p>
  `;
  $('modal').classList.add('on');
}

function sendOtp(){
  const phone = ($('authPhone')?.value || '').replace(/\D/g,'');
  const name  = ($('authName')?.value || '').trim();
  if(phone.length !== 10){ toast('Enter a valid 10-digit phone','err'); return; }
  if(!name){ toast('Enter your name','err'); return; }

  pendingPhone = phone;
  pendingOtp = String(Math.floor(100000 + Math.random()*900000));

  const box = $('mbox');
  box.innerHTML = `
    <h3>Verify OTP</h3>
    <p class="sub">Demo OTP for <b>+91 ${phone}</b> is shown below. In production this arrives by SMS.</p>
    <div style="text-align:center;background:var(--bg);padding:12px;border-radius:10px;margin-bottom:14px">
      <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Your demo OTP</div>
      <div style="font-family:Anton;font-size:1.8rem;letter-spacing:6px;color:var(--accent)">${pendingOtp}</div>
    </div>
    <div class="otp-row">
      ${[0,1,2,3,4,5].map(i=>`<input data-otp="${i}" maxlength="1" inputmode="numeric" />`).join('')}
    </div>
    <button class="btn btn-accent" style="width:100%;justify-content:center" onclick="verifyOtp('${esc(name)}')">Verify & Continue →</button>
    <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:8px" onclick="openAuth('login')">← Change number</button>
  `;
  const inputs = box.querySelectorAll('[data-otp]');
  inputs.forEach((inp,i)=>{
    inp.addEventListener('input', ()=>{ if(inp.value && i < inputs.length-1) inputs[i+1].focus(); });
    inp.addEventListener('keydown', e=>{ if(e.key==='Backspace' && !inp.value && i>0) inputs[i-1].focus(); });
  });
  inputs[0].focus();
}

function verifyOtp(name){
  const digits = [...document.querySelectorAll('[data-otp]')].map(i=>i.value).join('');
  if(digits !== pendingOtp){ toast('Wrong OTP — try again','err'); return; }
  state.user = { phone: pendingPhone, name };
  persistAll();
  toast('Logged in as ' + name, 'ok');
  closeAll();
  renderTopActions();
  if(state.view==='orders') renderView('orders');
}

function logout(){
  state.user = null;
  state.admin = false;
  persistAll();
  toast('Logged out');
  navigate('home');
}

/* =========================================================================
   ADMIN LOGIN
   ========================================================================= */
const ADMIN_CREDS = { user:'admin', pass:'baggy123' };

function openAdminLogin(){
  const box = $('mbox');
  box.innerHTML = `
    <h3>Admin Login</h3>
    <p class="sub">Demo credentials: <b>admin</b> / <b>baggy123</b></p>
    <div class="field"><label>Username</label><input id="adU" placeholder="admin" /></div>
    <div class="field"><label>Password</label><input id="adP" type="password" placeholder="baggy123" /></div>
    <button class="btn btn-accent" style="width:100%;justify-content:center" onclick="doAdminLogin()">Login as Admin →</button>
    <p style="font-size:11px;color:var(--muted);text-align:center;margin-top:12px">
      Admin session is local-only in this prototype.
    </p>
  `;
  $('modal').classList.add('on');
}

function doAdminLogin(){
  const u = $('adU').value.trim();
  const p = $('adP').value.trim();
  if(u !== ADMIN_CREDS.user || p !== ADMIN_CREDS.pass){ toast('Invalid credentials','err'); return; }
  state.admin = true;
  persistAll();
  closeAll();
  toast('Admin logged in','ok');
  navigate('admin');
}

/* =========================================================================
   ROUTING
   ========================================================================= */
function navigate(view){
  state.view = view;
  renderView(view);
  window.scrollTo({top:0, behavior:'smooth'});
}

function renderView(view){
  const app = $('app');
  if(view === 'admin'){
    if(!state.admin){ openAdminLogin(); return; }
    app.innerHTML = viewAdmin();
    bindAdmin();
    return;
  }
  if(view === 'orders'){
    app.innerHTML = viewOrders();
    bindOrders();
    return;
  }
  if(view === 'shop'){
    app.innerHTML = viewShop();
    bindShop();
    return;
  }
  if(view === 'story'){
    app.innerHTML = viewStory();
    return;
  }
  app.innerHTML = viewHome();
  bindShop();
  if(window.init3D) window.init3D();
}

/* =========================================================================
   VIEW: HOME
   ========================================================================= */
function viewHome(){
  return `
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-copy">
      <div class="eyebrow"><span class="dot"></span> Bhopal → All India · Est. 2024</div>
      <h1>BAGGY<br><span>FOREVER</span></h1>
      <p class="lead">Curated vintage, antique, thrift & surplus. One-of-one pieces — try them on, book them, or buy them. Delivered across India.</p>
      <div class="hero-cta">
        <button class="btn btn-primary" onclick="navigate('shop')">Shop the Drop →</button>
        <button class="btn btn-ghost" onclick="navigate('story')">Our Story</button>
      </div>
      <div class="hero-stats">
        <div class="hstat"><strong>12.4K</strong><span>Instagram</span></div>
        <div class="hstat"><strong>1-of-1</strong><span>Every piece</span></div>
        <div class="hstat"><strong>All IN</strong><span>Delivery</span></div>
      </div>
    </div>
    <div class="hero-3d" id="hero3d"><div class="float-label">Live 3D · drag to rotate</div></div>
  </section>

  <div class="marquee"><div class="marquee-track">
    ${['Vintage','Antique','Thrift','Surplus','New','Vintage','Antique','Thrift','Surplus','New'].map(x=>`<span>${x}</span>`).join('')}
  </div></div>

  <section class="section" id="shop">
    <div class="section-head">
      <h2>New Drops</h2>
      <button class="btn btn-ghost btn-sm" onclick="navigate('shop')">View all →</button>
    </div>
    <div class="grid" id="grid-home">${productCards(state.products.slice(0,8))}</div>
  </section>

  <section class="section">
    <div class="info-grid">
      <div class="info-card"><h4>Try before you buy</h4><p>Upload a photo, overlay the garment, adjust size and position. Works right in your browser.</p></div>
      <div class="info-card"><h4>Book a piece</h4><p>Reserve an item for in-store pickup in Bhopal. We hold it for 48 hours.</p></div>
      <div class="info-card"><h4>Delivery all India</h4><p>Free shipping on every order. One-of-one means when it's gone, it's gone.</p></div>
    </div>
  </section>

  <footer>
    <div class="logo">BAGGY<em>FOREVER</em></div>
    <div>Bhopal, MP — Delivery All Over India</div>
    <div>© 2026 · Frontend Prototype</div>
  </footer>`;
}

/* =========================================================================
   VIEW: SHOP
   ========================================================================= */
function viewShop(){
  const sizes = ['all', ...new Set(state.products.map(p=>p.size))].sort();
  return `
  <section class="section" style="padding-top:calc(var(--top) + 20px)">
    <div class="section-head">
      <h2>Shop All</h2>
      <div class="sub" id="shopCount">${state.products.length} pieces</div>
    </div>

    <div class="filter-bar">
      <div class="fgroup"><label>Search</label>
        <input id="fSearch" placeholder="Search pieces…" value="${esc(state.filter.q)}" /></div>
      <div class="fgroup"><label>Category</label>
        <select id="fCat">
          ${['all','vintage','surplus','thrift','new'].map(c=>`<option value="${c}" ${state.filter.cat===c?'selected':''}>${c==='all'?'All categories':c}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label>Size</label>
        <select id="fSize">
          ${sizes.map(s=>`<option value="${s}" ${state.filter.size===s?'selected':''}>${s==='all'?'All sizes':s}</option>`).join('')}
        </select></div>
      <div class="fgroup"><label>Max price: <span id="fMaxLabel">${money(state.filter.max)}</span></label>
        <input id="fMax" type="range" min="0" max="5000" step="100" value="${state.filter.max}" style="width:100%;accent-color:var(--accent)" /></div>
      <div class="fgroup"><label>Sort</label>
        <select id="fSort">
          <option value="featured" ${state.filter.sort==='featured'?'selected':''}>Featured</option>
          <option value="low" ${state.filter.sort==='low'?'selected':''}>Price: low → high</option>
          <option value="high" ${state.filter.sort==='high'?'selected':''}>Price: high → low</option>
        </select></div>
    </div>

    <div class="grid" id="grid-shop"></div>
  </section>

  <footer>
    <div class="logo">BAGGY<em>FOREVER</em></div>
    <div>Bhopal, MP — Delivery All Over India</div>
    <div>© 2026 · Frontend Prototype</div>
  </footer>`;
}

function filteredProducts(){
  let list = [...state.products];
  const f = state.filter;
  if(f.cat !== 'all') list = list.filter(p=>p.cat === f.cat);
  if(f.size !== 'all') list = list.filter(p=>p.size === f.size);
  list = list.filter(p => p.price <= f.max);
  if(f.q.trim()){
    const q = f.q.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q));
  }
  if(f.sort === 'low')  list.sort((a,b)=>a.price-b.price);
  if(f.sort === 'high') list.sort((a,b)=>b.price-a.price);
  return list;
}

function productCards(list){
  if(!list.length){
    return `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
      <div style="font-size:30px;margin-bottom:8px">🔍</div>No pieces match your filters.
    </div>`;
  }
  return list.map(p=>{
    const wished = state.wish.includes(p.id);
    const sold = p.stock <= 0;
    return `
    <article class="card" data-id="${p.id}">
      <div class="media">
        ${sold ? '<span class="badge sold">Sold</span>' : (p.tag ? `<span class="badge">${p.tag}</span>` : '')}
        <button class="wish ${wished?'on':''}" data-wish="${p.id}" aria-label="Wishlist">${wished?'♥':'♡'}</button>
        <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" />
      </div>
      <div class="body">
        <h3>${esc(p.name)}</h3>
        <div class="meta">
          <span class="price">${money(p.price)} <s>${money(p.mrp)}</s></span>
          <span class="size-tag">Size ${esc(p.size)}</span>
        </div>
        <div class="card-actions">
          <button class="add" data-add="${p.id}" ${sold?'disabled':''}>${sold?'Sold out':'Add to Bag'}</button>
          <button class="try-btn" data-try="${p.id}" title="Try on">👕</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function bindShop(){
  const homeGrid = $('grid-home');
  const shopGrid = $('grid-shop');

  if(shopGrid){
    const renderShop = ()=>{
      const list = filteredProducts();
      shopGrid.innerHTML = productCards(list);
      if($('shopCount')) $('shopCount').textContent = list.length + ' pieces';
      bindCardEvents(shopGrid);
      reveal(shopGrid);
    };
    renderShop();
    $('fSearch').addEventListener('input', e=>{ state.filter.q = e.target.value; renderShop(); });
    $('fCat').addEventListener('change', e=>{ state.filter.cat = e.target.value; renderShop(); });
    $('fSize').addEventListener('change', e=>{ state.filter.size = e.target.value; renderShop(); });
    $('fMax').addEventListener('input', e=>{
      state.filter.max = Number(e.target.value);
      $('fMaxLabel').textContent = money(state.filter.max);
      renderShop();
    });
    $('fSort').addEventListener('change', e=>{ state.filter.sort = e.target.value; renderShop(); });
  }
  if(homeGrid){ bindCardEvents(homeGrid); reveal(homeGrid); }
}

function bindCardEvents(scope){
  scope.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(btn.disabled) return;
      addToCart(Number(btn.dataset.add));
      btn.textContent = 'Added ✓'; btn.classList.add('added');
      setTimeout(()=>{ btn.textContent='Add to Bag'; btn.classList.remove('added'); }, 1200);
    });
  });
  scope.querySelectorAll('[data-wish]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.wish);
      if(state.wish.includes(id)){ state.wish = state.wish.filter(x=>x!==id); btn.textContent='♡'; btn.classList.remove('on'); toast('Removed from wishlist'); }
      else{ state.wish.push(id); btn.textContent='♥'; btn.classList.add('on'); toast('Saved to wishlist'); }
      persistAll();
    });
  });
  scope.querySelectorAll('[data-try]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ openTryOn(Number(btn.dataset.try)); });
  });
}

let io;
function reveal(scope){
  if(io) io.disconnect();
  io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('revealed'); io.unobserve(e.target); } });
  }, {threshold:.1});
  scope.querySelectorAll('.card').forEach(c=>io.observe(c));
}

/* =========================================================================
   VIEW: STORY
   ========================================================================= */
function viewStory(){
  return `
  <section class="section" style="padding-top:calc(var(--top) + 20px)">
    <div class="story-grid">
      <div class="story-img"><img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=900&q=80&auto=format&fit=crop" alt="Thrift store" /></div>
      <div>
        <h2>The Baggy Story</h2>
        <p>BaggyForever started as a hunt — for pieces that carry a past. From surplus finds and antique treasures to the best of Bhopal's thrift scene, every item is hand-picked, one-of-one, and shipped across India.</p>
        <p>This page is a <b>frontend prototype</b>. It shows the full shopping flow: browse, filter, virtual try-on, booking, cart, wallet, checkout, order history, and an admin panel — all running in your browser.</p>
        <p>Accounts, admin, and payments are simulated with localStorage. No real money moves. To go live, wire the same UI to a backend (Node + Razorpay + Postgres) or to Shopify.</p>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-card"><h4>📍 Bhopal, MP</h4><p>Local pickup available. Book a piece and we'll hold it for 48 hours.</p></div>
      <div class="info-card"><h4>🚚 All India</h4><p>Free shipping on every order. Tracked delivery.</p></div>
      <div class="info-card"><h4>👕 Try-on</h4><p>Upload a photo and preview how a garment might sit on you.</p></div>
    </div>
  </section>
  <footer>
    <div class="logo">BAGGY<em>FOREVER</em></div>
    <div>Bhopal, MP — Delivery All Over India</div>
    <div>© 2026 · Frontend Prototype</div>
  </footer>`;
}

/* =========================================================================
   VIEW: ORDERS
   ========================================================================= */
function viewOrders(){
  if(!state.user){
    return `
    <section class="section" style="padding-top:calc(var(--top) + 60px);min-height:70vh;text-align:center">
      <h2 style="margin-bottom:12px">My Orders</h2>
      <p style="color:var(--muted);margin-bottom:22px">Log in to see your orders and bookings.</p>
      <button class="btn btn-accent" onclick="openAuth('login')">Log in →</button>
    </section>`;
  }
  return `
  <section class="section" style="padding-top:calc(var(--top) + 20px);min-height:70vh">
    <div class="section-head"><h2>My Orders</h2><div class="sub" id="ordSub">—</div></div>
    <div id="ordersList"></div>
    <div id="bookingsList" style="margin-top:30px"></div>
  </section>
  <footer>
    <div class="logo">BAGGY<em>FOREVER</em></div>
    <div>Bhopal, MP — Delivery All Over India</div>
    <div>© 2026 · Frontend Prototype</div>
  </footer>`;
}

function bindOrders(){
  if(!state.user) return;
  const myOrders = state.orders.filter(o => o.phone === state.user.phone);
  const myBookings = state.bookings.filter(b => b.phone === state.user.phone);
  if($('ordSub')) $('ordSub').textContent = `${myOrders.length} orders · ${myBookings.length} bookings`;

  const ol = $('ordersList');
  if(ol){
    ol.innerHTML = myOrders.length ? myOrders.map(o => `
      <div class="order-card">
        <div class="oc-head">
          <div><div class="oc-id">${esc(o.id)}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">${new Date(o.date).toLocaleString('en-IN')}</div></div>
          <span class="status ${o.status}">${o.status}</span>
        </div>
        <div class="oc-items">${o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join('<br/>')}</div>
        <div class="oc-total">Total: ${money(o.total)} · ${o.pay === 'wallet' ? 'Paid (wallet)' : 'Cash on Delivery'}</div>
      </div>
    `).join('') : '<div class="empty"><div class="big">📦</div>No orders yet.</div>';
  }

  const bl = $('bookingsList');
  if(bl){
    bl.innerHTML = myBookings.length ? `
      <div class="section-head" style="margin-bottom:14px"><h2 style="font-size:1.3rem">My Bookings</h2></div>
      ${myBookings.map(b => `
        <div class="order-card">
          <div class="oc-head">
            <div><div class="oc-id">${esc(b.id)}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px">${new Date(b.date).toLocaleString('en-IN')}</div></div>
            <span class="status booked">Booked</span>
          </div>
          <div class="oc-items">${esc(b.itemName)} · Size ${esc(b.size)} · Hold 48h</div>
          <div class="oc-total">Pickup: Bhopal store</div>
        </div>
      `).join('')}
    ` : '';
  }
}

/* =========================================================================
   VIEW: ADMIN
   ========================================================================= */
function viewAdmin(){
  const totalSales = state.orders.reduce((s,o)=>s+o.total,0);
  return `
  <div class="admin-wrap">
    <div class="admin-head">
      <div>
        <h2>Admin Panel</h2>
        <p style="color:var(--muted);font-size:12px;margin-top:4px">Logged in as admin · local demo</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="navigate('home')">← Storefront</button>
        <button class="btn btn-primary btn-sm" onclick="logout()">Log out</button>
      </div>
    </div>
    <div class="admin-stats">
      <div class="astat"><div class="n">${state.products.length}</div><div class="l">Products</div></div>
      <div class="astat"><div class="n">${state.orders.length}</div><div class="l">Orders</div></div>
      <div class="astat"><div class="n">${state.bookings.length}</div><div class="l">Bookings</div></div>
      <div class="astat"><div class="n">${money(totalSales)}</div><div class="l">Demo revenue</div></div>
    </div>
    <div class="admin-tabs">
      <button class="admin-tab ${state.adminTab==='products'?'active':''}" onclick="setAdminTab('products')">Products</button>
      <button class="admin-tab ${state.adminTab==='orders'?'active':''}" onclick="setAdminTab('orders')">Orders</button>
      <button class="admin-tab ${state.adminTab==='bookings'?'active':''}" onclick="setAdminTab('bookings')">Bookings</button>
    </div>
    <div id="adminBody"></div>
  </div>`;
}

function setAdminTab(tab){ state.adminTab = tab; renderView('admin'); }

function bindAdmin(){
  const body = $('adminBody');
  if(!body) return;

  if(state.adminTab === 'products'){
    body.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button class="btn btn-accent btn-sm" onclick="openAddProduct()">+ Add product</button>
      </div>
      <table class="admin-table">
        <thead><tr><th></th><th>Name</th><th>Category</th><th>Size</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
        <tbody>${state.products.map(p=>`
          <tr>
            <td><img src="${p.img}" alt=""></td>
            <td><b>${esc(p.name)}</b></td>
            <td>${esc(p.cat)}</td>
            <td>${esc(p.size)}</td>
            <td>${money(p.price)}</td>
            <td>${p.stock}</td>
            <td>
              <button class="btn-xs" onclick="openEditProduct(${p.id})">Edit</button>
              <button class="btn-xs ${p.stock>0?'ok':'danger'}" onclick="toggleStock(${p.id})">${p.stock>0?'Mark sold':'Restock'}</button>
              <button class="btn-xs danger" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
          </tr>`).join('')}</tbody>
      </table>`;
  }

  if(state.adminTab === 'orders'){
    body.innerHTML = state.orders.length ? `
      <table class="admin-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Pay</th><th>Status</th><th></th></tr></thead>
        <tbody>${state.orders.map(o=>`
          <tr>
            <td><b>${esc(o.id)}</b><br/><span style="font-size:10px;color:var(--muted)">${new Date(o.date).toLocaleDateString('en-IN')}</span></td>
            <td>${esc(o.name)}<br/><span style="font-size:10px;color:var(--muted)">${esc(o.phone)}</span></td>
            <td>${o.items.map(i=>esc(i.name)+' ×'+i.qty).join('<br/>')}</td>
            <td>${money(o.total)}</td>
            <td>${esc(o.pay)}</td>
            <td><span class="status ${o.status}">${o.status}</span></td>
            <td><button class="btn-xs ok" onclick="advanceOrder('${esc(o.id)}')">Advance →</button></td>
          </tr>`).join('')}</tbody>
      </table>` : '<div class="empty">No orders yet.</div>';
  }

  if(state.adminTab === 'bookings'){
    body.innerHTML = state.bookings.length ? `
      <table class="admin-table">
        <thead><tr><th>Booking</th><th>Customer</th><th>Item</th><th>Size</th><th>Date</th><th></th></tr></thead>
        <tbody>${state.bookings.map(b=>`
          <tr>
            <td><b>${esc(b.id)}</b></td>
            <td>${esc(b.name)}<br/><span style="font-size:10px;color:var(--muted)">${esc(b.phone)}</span></td>
            <td>${esc(b.itemName)}</td>
            <td>${esc(b.size)}</td>
            <td>${new Date(b.date).toLocaleDateString('en-IN')}</td>
            <td><button class="btn-xs danger" onclick="cancelBooking('${esc(b.id)}')">Cancel</button></td>
          </tr>`).join('')}</tbody>
      </table>` : '<div class="empty">No bookings yet.</div>';
  }
}

/* ---------- ADMIN ACTIONS ---------- */
let editingProductId = null;

function openAddProduct(){
  editingProductId = null;
  $('mbox').innerHTML = `
    <h3>Add Product</h3>
    <div class="field"><label>Name</label><input id="pName" placeholder="Vintage Denim Jacket" /></div>
    <div class="field-row">
      <div class="field"><label>Category</label>
        <select id="pCat"><option>vintage</option><option>surplus</option><option>thrift</option><option>new</option></select></div>
      <div class="field"><label>Size</label><input id="pSize" placeholder="M" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Price ₹</label><input id="pPrice" type="number" placeholder="899" /></div>
      <div class="field"><label>MRP ₹</label><input id="pMrp" type="number" placeholder="1400" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Stock</label><input id="pStock" type="number" value="1" /></div>
      <div class="field"><label>Tag</label><input id="pTag" placeholder="New / Rare / 1 of 1" /></div>
    </div>
    <div class="field"><label>Image URL</label><input id="pImg" placeholder="https://…" /></div>
    <button class="btn btn-accent" style="width:100%;justify-content:center" onclick="saveProduct()">Save →</button>
  `;
  $('modal').classList.add('on');
}

function openEditProduct(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  editingProductId = id;
  $('mbox').innerHTML = `
    <h3>Edit Product</h3>
    <div class="field"><label>Name</label><input id="pName" value="${esc(p.name)}" /></div>
    <div class="field-row">
      <div class="field"><label>Category</label>
        <select id="pCat">${['vintage','surplus','thrift','new'].map(c=>`<option ${p.cat===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Size</label><input id="pSize" value="${esc(p.size)}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Price ₹</label><input id="pPrice" type="number" value="${p.price}" /></div>
      <div class="field"><label>MRP ₹</label><input id="pMrp" type="number" value="${p.mrp}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Stock</label><input id="pStock" type="number" value="${p.stock}" /></div>
      <div class="field"><label>Tag</label><input id="pTag" value="${esc(p.tag||'')}" /></div>
    </div>
    <div class="field"><label>Image URL</label><input id="pImg" value="${esc(p.img)}" /></div>
    <button class="btn btn-accent" style="width:100%;justify-content:center" onclick="saveProduct()">Update →</button>
  `;
  $('modal').classList.add('on');
}

function saveProduct(){
  const name = $('pName').value.trim();
  const cat  = $('pCat').value;
  const size = $('pSize').value.trim();
  const price= Number($('pPrice').value);
  const mrp  = Number($('pMrp').value) || price;
  const stock= Number($('pStock').value) || 0;
  const tag  = $('pTag').value.trim();
  const img  = $('pImg').value.trim() || 'https://placehold.co/600x750/ece7df/111?text=Product';

  if(!name || !size || !price){ toast('Fill name, size, price','err'); return; }

  if(editingProductId){
    const p = state.products.find(x=>x.id===editingProductId);
    Object.assign(p, {name,cat,size,price,mrp,stock,tag,img});
    toast('Product updated','ok');
  } else {
    const id = Math.max(0, ...state.products.map(p=>p.id)) + 1;
    state.products.push({id,name,cat,size,price,mrp,stock,tag,img});
    toast('Product added','ok');
  }
  persistAll();
  closeAll();
  renderView('admin');
}

function toggleStock(id){
  const p = state.products.find(x=>x.id===id);
  p.stock = p.stock > 0 ? 0 : 1;
  persistAll(); renderView('admin');
  toast(p.stock ? 'Restocked' : 'Marked sold');
}

function deleteProduct(id){
  if(!confirm('Delete this product?')) return;
  state.products = state.products.filter(p=>p.id!==id);
  persistAll(); renderView('admin');
  toast('Product deleted');
}

function advanceOrder(id){
  const o = state.orders.find(x=>x.id===id);
  if(!o) return;
  const flow = ['placed','paid','shipped'];
  const i = flow.indexOf(o.status);
  if(i < flow.length-1){ o.status = flow[i+1]; persistAll(); renderView('admin'); toast('Order → ' + o.status); }
  else toast('Already shipped');
}

function cancelBooking(id){
  state.bookings = state.bookings.filter(b=>b.id!==id);
  persistAll(); renderView('admin');
  toast('Booking cancelled');
}

/* =========================================================================
   CART
   ========================================================================= */
function addToCart(id){
  const p = state.products.find(x=>x.id===id);
  if(!p || p.stock <= 0){ toast('Sold out','err'); return; }
  const found = state.cart.find(x=>x.id===id);
  if(found) found.qty++;
  else state.cart.push({...p, qty:1});
  persistAll();
  renderTopActions();
  renderCart();
  toast(p.name + ' added');
}

function removeFromCart(id){
  state.cart = state.cart.filter(x=>x.id!==id);
  persistAll(); renderTopActions(); renderCart();
}

function changeQty(id, delta){
  const item = state.cart.find(x=>x.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ removeFromCart(id); return; }
  persistAll(); renderCart();
}

function renderCart(){
  const box = $('cartItems');
  if(!box) return;
  if(!state.cart.length){
    box.innerHTML = `<div class="empty"><div class="big">🛍️</div>Your bag is empty.<br/>Every piece is one-of-one.</div>`;
    if($('subtotal')) $('subtotal').textContent = '₹0';
    if($('cartTotal')) $('cartTotal').textContent = '₹0';
    return;
  }
  box.innerHTML = state.cart.map(item=>`
    <div class="citem">
      <img src="${item.img}" alt="${esc(item.name)}" />
      <div class="cinfo">
        <h4>${esc(item.name)}</h4>
        <div class="price">${money(item.price)}</div>
        <div class="qty">
          <button class="qbtn" onclick="changeQty(${item.id},-1)">−</button>
          <span class="qnum">${item.qty}</span>
          <button class="qbtn" onclick="changeQty(${item.id},1)">+</button>
          <button class="rm" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
  const t = cartTotal();
  if($('subtotal')) $('subtotal').textContent = money(t);
  if($('cartTotal')) $('cartTotal').textContent = money(t);
}

function openCart(){
  $('drawer').classList.add('on');
  $('overlay').classList.add('on');
  renderCart();
}
function closeCart(){
  $('drawer').classList.remove('on');
  $('overlay').classList.remove('on');
}
function closeAll(){
  closeCart();
  $('modal').classList.remove('on');
  $('walletPanel').classList.remove('on');
}

/* =========================================================================
   WALLET
   ========================================================================= */
function updateWalletUI(){
  if($('walletTop')) $('walletTop').textContent = money(state.wallet);
  if($('walletBal')) $('walletBal').textContent = money(state.wallet);
}
function toggleWallet(e){
  e.stopPropagation();
  $('walletPanel').classList.toggle('on');
}
function topUpWallet(){
  state.wallet += 1000;
  persistAll(); updateWalletUI();
  toast('Demo wallet +' + money(1000), 'ok');
}
document.addEventListener('click', (e)=>{
  const panel = $('walletPanel');
  if(panel.classList.contains('on') && !panel.contains(e.target) && !e.target.closest('.pill-wallet')){
    panel.classList.remove('on');
  }
});

/* =========================================================================
   CHECKOUT
   ========================================================================= */
function openCheckout(){
  if(!state.cart.length){ toast('Your bag is empty','err'); return; }
  if(!state.user){ closeCart(); openAuth('login'); toast('Log in to checkout'); return; }
  closeCart();
  const total = cartTotal();
  $('mbox').innerHTML = `
    <h3>Checkout · Demo</h3>
    <p class="sub">Frontend prototype — no real payment. Wire Razorpay/Shopify for production.</p>
    <div class="field"><label>Full Name</label><input id="coName" value="${esc(state.user.name)}" /></div>
    <div class="field"><label>Phone</label><input id="coPhone" value="${esc(state.user.phone)}" readonly /></div>
    <div class="field"><label>Address</label><textarea id="coAddr" placeholder="Bhopal, Madhya Pradesh"></textarea></div>
    <div class="field"><label>Payment Method</label>
      <select id="coPay">
        <option value="wallet">Virtual Wallet (${money(state.wallet)} available)</option>
        <option value="cod">Cash on Delivery</option>
      </select>
    </div>
    <div class="summary">
      <div class="line"><span>Items (${cartCount()})</span><span>${money(total)}</span></div>
      <div class="line"><span>Shipping</span><span>Free</span></div>
      <div class="line total"><span>Total</span><span>${money(total)}</span></div>
    </div>
    <button class="btn btn-accent" style="width:100%;justify-content:center" onclick="placeOrder(${total})">Place Order →</button>
  `;
  $('modal').classList.add('on');
}

function placeOrder(total){
  const name = $('coName').value.trim();
  const phone= $('coPhone').value.trim();
  const addr = $('coAddr').value.trim();
  const pay  = $('coPay').value;
  if(!name || !phone){ toast('Name and phone required','err'); return; }
  if(pay === 'wallet' && state.wallet < total){ toast('Insufficient demo wallet balance','err'); return; }
  if(pay === 'wallet'){ state.wallet -= total; updateWalletUI(); }

  const orderId = 'BF-' + Date.now().toString(36).toUpperCase().slice(-5) + '-' + Math.random().toString(36).slice(2,5).toUpperCase();
  state.orders.unshift({
    id: orderId,
    items: state.cart.map(i=>({name:i.name, qty:i.qty, price:i.price})),
    total, pay, name, phone, addr,
    status: pay === 'wallet' ? 'paid' : 'placed',
    date: new Date().toISOString()
  });
  state.cart.forEach(item=>{
    const p = state.products.find(x=>x.id===item.id);
    if(p) p.stock = Math.max(0, p.stock - item.qty);
  });
  state.cart = [];
  persistAll();
  renderTopActions(); renderCart();

  $('mbox').innerHTML = `
    <div class="success">
      <div class="tick">✓</div>
      <h3>Order Placed</h3>
      <div class="order-id">${orderId}</div>
      <p>Demo order created locally.<br/>
      ${pay==='wallet' ? 'Paid from virtual wallet.' : 'Cash on Delivery selected.'}<br/>
      Total: <strong>${money(total)}</strong></p>
      <div style="display:flex;gap:8px;margin-top:18px">
        <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="closeAll()">Done</button>
        <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="closeAll();navigate('orders')">My Orders</button>
      </div>
    </div>
  `;
}

/* =========================================================================
   BOOKING
   ========================================================================= */
function openBooking(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  if(!state.user){ openAuth('login'); toast('Log in to book'); return; }
  if(p.stock <= 0){ toast('Sold out','err'); return; }
  $('mbox').innerHTML = `
    <h3>Book for Pickup</h3>
    <p class="sub">Reserve this one-of-one piece at the Bhopal store. We hold it for 48 hours.</p>
    <div style="display:flex;gap:12px;align-items:center;background:var(--bg);padding:12px;border-radius:10px;margin-bottom:14px">
      <img src="${p.img}" style="width:56px;height:70px;object-fit:cover;border-radius:6px" alt="">
      <div><b style="font-size:13px">${esc(p.name)}</b><br/>
        <span style="font-size:11px;color:var(--muted)">Size ${esc(p.size)} · ${money(p.price)}</span></div>
    </div>
    <div class="field"><label>Name</label><input id="bkName" value="${esc(state.user.name)}" /></div>
    <div class="field"><label>Phone</label><input id="bkPhone" value="${esc(state.user.phone)}" /></div>
    <button class="btn btn-accent" style="width:100%;justify-content:center" onclick="confirmBooking(${id})">Confirm Booking →</button>
  `;
  $('modal').classList.add('on');
}

function confirmBooking(id){
  const p = state.products.find(x=>x.id===id);
  const name = $('bkName').value.trim();
  const phone= $('bkPhone').value.trim();
  if(!name || !phone){ toast('Name and phone required','err'); return; }
  const bookingId = 'BK-' + Date.now().toString(36).toUpperCase().slice(-5);
  state.bookings.unshift({
    id: bookingId, productId: p.id, itemName: p.name, size: p.size, name, phone,
    date: new Date().toISOString()
  });
  persistAll();
  $('mbox').innerHTML = `
    <div class="success">
      <div class="tick">✓</div>
      <h3>Booked!</h3>
      <div class="order-id">${bookingId}</div>
      <p><b>${esc(p.name)}</b> is reserved for 48 hours.<br/>Pickup: Bhopal store · Call us before visiting.</p>
      <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px" onclick="closeAll()">Done</button>
    </div>
  `;
}

/* =========================================================================
   VIRTUAL TRY-ON
   ========================================================================= */
let tryOnState = { productId:null, scale:1, x:0, y:0, opacity:.9 };

function openTryOn(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  tryOnState = {productId:id, scale:1, x:0, y:0, opacity:.9};
  $('mbox').classList.add('wide');
  $('mbox').innerHTML = `
    <h3>Virtual Try-On</h3>
    <p class="sub">Upload a photo, then drag and scale the garment to preview it. Preview only — actual fit varies.</p>
    <div class="tryon-stage" id="tryonStage">
      <div class="tryon-empty" id="tryonEmpty">
        📷<br/><br/>Upload a photo to start<br/>
        <input type="file" id="tryonUpload" accept="image/*" style="margin-top:12px;font-size:12px" />
      </div>
    </div>
    <div class="tryon-controls" id="tryonControls" style="display:none">
      <div><label>Scale</label><input type="range" id="trScale" min="0.3" max="2.5" step="0.05" value="1" /></div>
      <div><label>Opacity</label><input type="range" id="trOpacity" min="0.2" max="1" step="0.05" value="0.9" /></div>
      <div><label>X</label><input type="range" id="trX" min="-150" max="150" step="1" value="0" /></div>
      <div><label>Y</label><input type="range" id="trY" min="-150" max="150" step="1" value="0" /></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="closeTryOn()">Close</button>
      <button class="btn btn-accent" style="flex:1;justify-content:center" onclick="addToCart(${id});closeTryOn()">Add to Bag</button>
    </div>
    <p style="font-size:10px;letter-spacing:1.2px;text-align:center;color:var(--muted);margin-top:10px;text-transform:uppercase">Preview · not AR tracking</p>
  `;
  $('modal').classList.add('on');
  $('tryonUpload').addEventListener('change', e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev=>{
      const stage = $('tryonStage');
      stage.innerHTML = `
        <img class="base" src="${ev.target.result}" alt="Your photo" />
        <img class="garment" id="garmentImg" src="${p.img}" alt="${esc(p.name)}" />
      `;
      $('tryonEmpty')?.remove();
      $('tryonControls').style.display = 'grid';
      setupGarmentDrag(p);
    };
    reader.readAsDataURL(file);
  });
}

function setupGarmentDrag(product){
  const garment = $('garmentImg');
  if(!garment) return;
  const apply = ()=>{
    garment.style.transform = `translate(${tryOnState.x}px, ${tryOnState.y}px) scale(${tryOnState.scale})`;
    garment.style.opacity = tryOnState.opacity;
  };
  garment.style.width = '55%';
  garment.style.height = '55%';
  garment.style.top = '22%';
  garment.style.left = '22%';
  apply();
  $('trScale').addEventListener('input', e=>{ tryOnState.scale = Number(e.target.value); apply(); });
  $('trOpacity').addEventListener('input', e=>{ tryOnState.opacity = Number(e.target.value); apply(); });
  $('trX').addEventListener('input', e=>{ tryOnState.x = Number(e.target.value); apply(); });
  $('trY').addEventListener('input', e=>{ tryOnState.y = Number(e.target.value); apply(); });
  let dragging=false, sx=0, sy=0, ox=0, oy=0;
  garment.addEventListener('pointerdown', e=>{
    dragging = true; sx = e.clientX; sy = e.clientY; ox = tryOnState.x; oy = tryOnState.y;
    garment.setPointerCapture(e.pointerId);
  });
  garment.addEventListener('pointermove', e=>{
    if(!dragging) return;
    tryOnState.x = ox + (e.clientX - sx);
    tryOnState.y = oy + (e.clientY - sy);
    $('trX').value = tryOnState.x;
    $('trY').value = tryOnState.y;
    apply();
  });
  garment.addEventListener('pointerup', ()=> dragging = false);
}

function closeTryOn(){
  $('mbox').classList.remove('wide');
  closeAll();
}

/* =========================================================================
   TOP ACTIONS
   ========================================================================= */
function renderTopActions(){
  const box = $('topactions');
  if(!box) return;
  if(state.admin){
    box.innerHTML = `
      <button class="pill pill-outline" onclick="navigate('admin')">Admin</button>
      <button class="pill pill-dark" onclick="logout()">Logout</button>
    `;
    return;
  }
  if(state.user){
    box.innerHTML = `
      <button class="pill pill-wallet" onclick="toggleWallet(event)">Wallet · <b id="walletTop">${money(state.wallet)}</b></button>
      <button class="pill pill-dark" onclick="openCart()">Bag · <span id="bagCount">${cartCount()}</span></button>
      <button class="pill pill-outline" onclick="navigate('orders')">${esc(state.user.name.split(' ')[0])}</button>
      <button class="pill pill-outline" onclick="logout()">Out</button>
    `;
  } else {
    box.innerHTML = `
      <button class="pill pill-wallet" onclick="toggleWallet(event)">Wallet · <b id="walletTop">${money(state.wallet)}</b></button>
      <button class="pill pill-dark" onclick="openCart()">Bag · <span id="bagCount">${cartCount()}</span></button>
      <button class="pill pill-outline" onclick="openAuth('login')">Log in</button>
      <button class="pill pill-outline" onclick="openAdminLogin()">Admin</button>
    `;
  }
}

/* =========================================================================
   KEYBOARD
   ========================================================================= */
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeAll(); });

/* =========================================================================
   EXPOSE GLOBALS (inline handlers)
   ========================================================================= */
Object.assign(window, {
  navigate, renderView,
  openAuth, sendOtp, verifyOtp, logout,
  openAdminLogin, doAdminLogin,
  addToCart, removeFromCart, changeQty,
  openCart, closeCart, closeAll,
  openCheckout, placeOrder,
  openBooking, confirmBooking,
  openTryOn, closeTryOn,
  toggleWallet, topUpWallet,
  openAddProduct, openEditProduct, saveProduct, toggleStock, deleteProduct,
  advanceOrder, cancelBooking, setAdminTab
});

/* =========================================================================
   BOOT
   ========================================================================= */
function boot(){
  bootState();
  renderTopActions();
  renderView('home');
  updateWalletUI();
}
document.addEventListener('DOMContentLoaded', boot);
