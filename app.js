/* app.js — общий скрипт для всех страниц
   - грузит header.html, footer.html, tg-btn.html
   - управляет hover-дропдаунами в шапке
   - табами по data-tab-target (если есть)
   - мобильным меню (гамбургер, бэкдроп, ESC)
*/

(function(){
  // Версия для пробития кеша статических partials
  var VERSION = '20250923f';
  function withV(path){ return path + (path.indexOf('?') === -1 ? ('?v=' + VERSION) : ('&v=' + VERSION)); }
  // Preconnect/DNS-hint helper (idempotent)
  function preconnectOnce(href){
    try{
      var id = 'preconnect_'+href.replace(/[^a-z0-9]/gi,'_');
      if(document.getElementById(id)) return;
      var l1 = document.createElement('link'); l1.id=id; l1.rel='preconnect'; l1.href=href; l1.crossOrigin='anonymous';
      var l2 = document.createElement('link'); l2.rel='dns-prefetch'; l2.href=href;
      document.head.appendChild(l1); document.head.appendChild(l2);
    }catch(e){}
  }
  // Подключение HTML-вставок (partials)
  function inject(id, html){
    var el = document.getElementById(id);
    if(!el) return;
    el.innerHTML = html;
  }
  function loadPart(id, file){
    var url = new URL(file, window.location.href).toString();
    fetch(url, { credentials: 'same-origin' })
      .then(function(res){ if(!res.ok) throw new Error('HTTP '+res.status); return res.text(); })
      .then(function(html){ inject(id, html); })
      .catch(function(err){ console.warn('[partials]', file, err); });
  }

  // Загружаем шапку/футер/кнопку TG как только DOM готов
  document.addEventListener('DOMContentLoaded', function(){
    loadPart('site-header', withV('header.html'));
    loadPart('site-footer', withV('footer.html'));
    loadPart('site-telegram-btn', withV('btn.html'));
    preconnectOnce('https://artbytwins.getcourse.ru');

    // === Floating quick-contact buttons: mount & UX tweaks ===
    (function initFloatingContacts(){
      var state = { lastY: window.scrollY };
      function links(){
        var c = (window.__abt_contacts)||{};
        return {
          tg: c.tg || 'https://t.me/yourtelegram',
          wa: c.wa || 'https://wa.me/yourwhatsapp',
          em: c.em || 'mailto:youremail@example.com'
        };
      }
      function mount(){
        if (document.querySelector('.abt-floating-contacts')) return;
        var l = links();
        var host = document.getElementById('site-telegram-btn') || document.body;
        var wrap = document.createElement('div');
        wrap.className = 'abt-floating-contacts';
        wrap.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:50;display:flex;flex-direction:column;gap:12px;opacity:1;transform:translateY(0);transition:opacity .22s ease, transform .22s ease';
        wrap.innerHTML = [
          '<a href="', l.tg ,'" target="_blank" rel="noopener" aria-label="Telegram" class="btn-circle btn-telegram"><i class="fa-brands fa-telegram"></i></a>',
          '<a href="', l.wa ,'" target="_blank" rel="noopener" aria-label="WhatsApp" class="btn-circle btn-whatsapp"><i class="fa-brands fa-whatsapp"></i></a>',
          '<a href="', l.em ,'" aria-label="Email" class="btn-circle btn-email"><i class="fa-solid fa-envelope"></i></a>'
        ].join('');
        host.appendChild(wrap);
      }
      function show(){ var w=document.querySelector('.abt-floating-contacts'); if(w){ w.style.opacity='1'; w.style.transform='translateY(0)'; } }
      function hide(){ var w=document.querySelector('.abt-floating-contacts'); if(w){ w.style.opacity='0'; w.style.transform='translateY(6px)'; } }
      function onScroll(){ var y=window.scrollY||0; if(y>state.lastY+6){ hide(); } else if(y<state.lastY-6){ show(); } state.lastY=y; }
      mount(); setTimeout(mount, 250);
      window.addEventListener('scroll', onScroll, { passive:true });
      // expose helpers
      window.__abt_contacts = window.__abt_contacts || {};
      window.__abt_remountContacts = mount;
      window.__abt_hideContacts = hide;
      window.__abt_showContacts = show;
    })();
  });

  // ===== Hover-дропдауны из хедера (работает делегированно) =====
  function findMenu(root){ return root && root.querySelector('[data-menu]'); }
  document.addEventListener('mouseover', function(e){
    var dd = e.target.closest && e.target.closest('[data-dd]');
    if(!dd) return;
    var menu = findMenu(dd); if(!menu) return;
    menu.classList.remove('invisible','pointer-events-none','opacity-0','scale-95');
  });
  document.addEventListener('mouseout', function(e){
    var dd = e.target.closest && e.target.closest('[data-dd]');
    if(!dd) return;
    if(!dd.contains(e.relatedTarget)){
      var menu = findMenu(dd); if(!menu) return;
      menu.classList.add('invisible','pointer-events-none','opacity-0','scale-95');
    }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      document.querySelectorAll('[data-menu]').forEach(function(menu){
        menu.classList.add('invisible','pointer-events-none','opacity-0','scale-95');
      });
      closeMobile();
    }
  });

  // ===== Tabs: переключение по data-tab-target (если встречаются) =====
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('[data-tab-target]');
    if(!btn) return;
    var targetId = btn.getAttribute('data-tab-target');
    var card = btn.closest('[data-program]');
    if(!card) return;

    card.querySelectorAll('[data-tab-target]').forEach(function(b){
      b.setAttribute('aria-selected', b===btn ? 'true' : 'false');
      b.classList.toggle('border-emerald-300', b===btn);
      b.classList.toggle('text-emerald-800', b===btn);
      b.classList.toggle('border-slate-300', b!==btn);
      b.classList.toggle('text-slate-700', b!==btn);
    });
    card.querySelectorAll('[data-tab-pane]').forEach(function(p){
      p.classList.toggle('hidden', p.getAttribute('data-tab-pane') !== targetId);
    });
  });

  // ===== Мобильное меню (off-canvas) =====
function openMobile(){
  var menu = document.getElementById('mobile-menu');
  if(!menu) return;
  menu.classList.add('is-open');
  var btn = document.querySelector('[data-mobile-toggle]');
  if(btn) btn.setAttribute('aria-expanded','true');
  document.documentElement.style.overflow = 'hidden';
}

function closeMobile(){
  var menu = document.getElementById('mobile-menu');
  if(!menu) return;
  menu.classList.remove('is-open');
  document.documentElement.style.overflow = '';
  var btn = document.querySelector('[data-mobile-toggle]');
  if(btn) btn.setAttribute('aria-expanded','false');
}
  // Делегируем клики (после подгрузки хедера тоже будет работать)
  document.addEventListener('click', function(e){
    if(e.target.closest && e.target.closest('[data-mobile-toggle]')){ openMobile(); }
    if(e.target.closest && (e.target.closest('[data-mobile-close]') || e.target.closest('[data-mobile-backdrop]'))){ closeMobile(); }
  });

  // ===== Smooth scroll for on-page anchors (delegated) =====
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if(!a) return;
    // Do NOT handle anchors that are used for GetCourse/opening modals
    if (a.matches('[data-plan], [data-gc-open], [data-gc-id], [data-gc-src]')) return;

    var href = a.getAttribute('href');
    // Ignore just '#' or external-like hashes
    if(!href || href === '#' || href.indexOf('#') !== 0) return;

    var id = href.slice(1);
    var el = document.getElementById(id);
    if(!el) return;

    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
  });

  // ===== Lightweight Modal (popup) for widgets and custom content =====
  var modalState = { el: null, body: null, contentHost: null, cache: {} };

  function ensureModal(){
    if(modalState.el) return modalState.el;
    var wrap = document.createElement('div');
    wrap.id = 'abt-modal';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = [
      'position:fixed','inset:0','z-index:1000','display:none'
    ].join(';');

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.setAttribute('data-modal-backdrop','');
    backdrop.style.cssText = [
      'position:absolute','inset:0','background:rgba(2,6,23,.55)','backdrop-filter:blur(2px)'
    ].join(';');

    // Dialog
    var dlg = document.createElement('div');
    dlg.setAttribute('role','dialog');
    dlg.setAttribute('aria-modal','true');
    dlg.style.cssText = [
      'position:relative','max-width:960px','width:calc(100% - 2rem)','margin:4rem auto','background:#fff','border-radius:12px','box-shadow:0 20px 60px rgba(2,6,23,.35)','overflow:hidden','display:flex','flex-direction:column'
    ].join(';');

    // Header with close
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding:.5rem 1rem;border-bottom:1px solid rgba(0,0,0,.08)';
    var btnX = document.createElement('button');
    btnX.type = 'button';
    btnX.setAttribute('data-modal-close','');
    btnX.setAttribute('aria-label','Закрыть');
    btnX.style.cssText = 'font-size:20px;line-height:1;border:0;background:transparent;cursor:pointer;color:#0f172a';
    btnX.innerHTML = '×';
    hdr.appendChild(btnX);

    // Body host
    var body = document.createElement('div');
    body.style.cssText = 'padding:0;max-height:75vh;overflow:auto';

    dlg.appendChild(hdr);
    dlg.appendChild(body);
    wrap.appendChild(backdrop);
    wrap.appendChild(dlg);
    document.body.appendChild(wrap);

    modalState.el = wrap;
    modalState.body = body;
    modalState.contentHost = body;

    return wrap;
  }

  function openModal(){
    var el = ensureModal();
    el.style.display = 'block';
    document.documentElement.style.overflow = 'hidden';
    el.setAttribute('aria-hidden','false');
    try{ if(window.__abt_hideContacts) window.__abt_hideContacts(); }catch(e){}
    document.body.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'none';
  }

  function closeModal(){
    if(!modalState.el) return;
    modalState.el.style.display = 'none';
    document.documentElement.style.overflow = '';
    modalState.el.setAttribute('aria-hidden','true');
    document.body.style.overscrollBehavior = '';
    document.body.style.touchAction = '';
    try{ if(window.__abt_showContacts) window.__abt_showContacts(); }catch(e){}
    // Clear body to avoid duplicating widgets between openings
    if(modalState.body) modalState.body.innerHTML = '';
  }

  // Close on backdrop / ESC
  document.addEventListener('click', function(e){
    if(e.target && (e.target.hasAttribute('data-modal-backdrop') || e.target.hasAttribute('data-modal-close'))){
      closeModal();
    }
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });

  // ===== Works carousel (story mode) — ensure first slide fits on mobile =====
  function alignStoryCarousel(){
    try{
      var c = document.getElementById('worksCarousel');
      if(!c || !c.classList || !c.classList.contains('carousel--story')) return;
      var isMobile = window.matchMedia('(max-width:640px)').matches;
      if(!isMobile) return;
      // reset scroll to exact boundary (some devices keep fractional scrollLeft)
      c.scrollLeft = 0;
      requestAnimationFrame(function(){ c.scrollLeft = 0; });
    }catch(e){}
  }
  document.addEventListener('DOMContentLoaded', alignStoryCarousel);
  window.addEventListener('resize', alignStoryCarousel, { passive:true });

  // ===== Simple Story Viewer (opens modal, 1 photo = 1 story) =====
  (function initStoryViewer(){
    var data = [];
    var timer = null;
    var AUTOPLAY_MS = 5000; // 5s per story

    function collect(){
      var items = document.querySelectorAll('#studentStories .story-item');
      data = Array.prototype.map.call(items, function(it){
        return {
          src: it.querySelector('img') && it.querySelector('img').getAttribute('src'),
          title: it.getAttribute('data-caption-title') || '',
          caption: it.getAttribute('data-caption') || '',
          meta: it.getAttribute('data-meta') || ''
        };
      });
    }
    function clearTimer(){ if(timer){ clearTimeout(timer); timer=null; } }
    function renderBars(host, activeIdx){
      var bars = host.querySelector('.story-bars');
      bars.innerHTML = '';
      for(var i=0;i<data.length;i++){
        var b = document.createElement('div'); b.className='story-bar';
        var span = document.createElement('span'); if(i < activeIdx) { span.style.width='100%'; }
        b.appendChild(span); bars.appendChild(b);
      }
    }
    function animateActiveBar(host, activeIdx){
      var bars = host.querySelectorAll('.story-bar > span');
      var span = bars[activeIdx]; if(!span) return;
      span.style.transition = 'width '+(AUTOPLAY_MS/1000)+'s linear';
      requestAnimationFrame(function(){ span.style.width='100%'; });
    }
    function showStory(idx){
      if(!data.length) return;
      if(idx < 0){ idx = data.length-1; }
      if(idx >= data.length){ idx = 0; }
      openModal();
      var body = document.querySelector('#abt-modal [role="dialog"] > div:last-child');
      if(!body) return;
      body.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.style.padding = '12px';
      wrap.innerHTML = [
        '<div class="story-view">',
          '<div class="story-bars"></div>',
          '<img alt="story" src="'+ data[idx].src +'"/>',
          '<div class="story-caption">',
            '<div class="t">'+ (data[idx].title||'') +'</div>',
            '<div class="c">'+ (data[idx].caption||'') +'</div>',
            (data[idx].meta ? '<div class="m" style="opacity:.8;margin-top:2px;font-size:.8rem">'+data[idx].meta+'</div>' : ''),
          '</div>',
          '<div class="story-tap-left"></div>',
          '<div class="story-tap-right"></div>',
        '</div>'
      ].join('');
      body.appendChild(wrap);

      renderBars(wrap, idx);
      animateActiveBar(wrap, idx);

      var next = function(){ clearTimer(); showStory(idx+1); };
      var prev = function(){ clearTimer(); showStory(idx-1); };
      wrap.querySelector('.story-tap-right').addEventListener('click', next);
      wrap.querySelector('.story-tap-left').addEventListener('click', prev);

      clearTimer();
      timer = setTimeout(next, AUTOPLAY_MS);

      var onKey = function(e){ if(e.key==='ArrowRight'){ next(); } else if(e.key==='ArrowLeft'){ prev(); } };
      document.addEventListener('keydown', onKey, { once: true });
      var stopOnClose = function(){ clearTimer(); document.removeEventListener('keydown', onKey); };
      setTimeout(function(){
        var backdrop = document.querySelector('#abt-modal [data-modal-backdrop]');
        if(backdrop){ backdrop.addEventListener('click', stopOnClose, { once:true }); }
        var closeBtn = document.querySelector('#abt-modal [data-modal-close]');
        if(closeBtn){ closeBtn.addEventListener('click', stopOnClose, { once:true }); }
      }, 0);
    }
    function bind(){
      var root = document.getElementById('studentStories');
      if(!root) return;
      root.addEventListener('click', function(e){
        var it = e.target.closest && e.target.closest('.story-item');
        if(!it) return;
        var idx = parseInt(it.getAttribute('data-index') || '0', 10);
        showStory(idx);
      });
    }
    document.addEventListener('DOMContentLoaded', function(){ collect(); bind(); });
  })();

  // Map plan slugs used on kurs.html to GetCourse widget ids
  var PLAN_IDS = {
    basic: '1487237',      // Дизайнер своей квартиры — Базовый
    extended: '1487247',   // Расширенный
    max: '1487966'         // Максимум
  };

  // ===== GetCourse widget opener (use data-gc-id or data-gc-src on button) =====
  // Usage on a button/link:
  // <a class="btn-tariff" data-gc-id="1487237">Выбрать базовый</a>
  // or <a data-gc-src="https://artbytwins.getcourse.ru/pl/lite/widget/script?id=1487237">Купить</a>
  function buildGcSrcById(id){
    return 'https://artbytwins.getcourse.ru/pl/lite/widget/script?id=' + encodeURIComponent(id);
  }

  // Open GC widget by numeric id via direct iframe (single unified path)
  function openWidgetById(wid){
    if(!wid) return;
    preconnectOnce('https://artbytwins.getcourse.ru');
    openModal();
    var host = document.createElement('div');
    host.setAttribute('data-gc-mount','');
    host.style.cssText = 'padding:0;min-height:60vh;display:block;';
    if (modalState.body) modalState.body.innerHTML = '';
    modalState.body.appendChild(host);
    try{
      var iframe = document.createElement('iframe');
      var direct = 'https://artbytwins.getcourse.ru/pl/lite/widget/widget'
        + '?' + window.location.search.substring(1)
        + '&id=' + encodeURIComponent(wid)
        + '&ref=' + encodeURIComponent(document.referrer)
        + '&loc=' + encodeURIComponent(document.location.href);
      iframe.src = direct;
      iframe.style.width = '100%';
      iframe.style.height = '80vh';
      iframe.style.border = '0';
      host.appendChild(iframe);
    } catch(e) {}
  }

  // Delegated click for plan buttons coming from kurs.html
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-gc-open][data-plan], [data-plan]');
    if(!t) return;
    var plan = t.getAttribute('data-plan');
    if(!plan || !PLAN_IDS[plan]) return;
    e.preventDefault();
    openWidgetById(PLAN_IDS[plan]);
  });


  // Preload widget script on hover to warm up connection
  document.addEventListener('mouseover', function(e){
    var t = e.target.closest && e.target.closest('[data-plan], [data-gc-id], [data-gc-src]');
    if(!t) return;
    preconnectOnce('https://artbytwins.getcourse.ru');
  });

  // Delegated click binding for buttons/links with data-gc-id or data-gc-src
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-gc-id], [data-gc-src]');
    if(!t) return;
    e.preventDefault();
    var wid = t.getAttribute('data-gc-id');
    if(!wid){
      var src = t.getAttribute('data-gc-src') || '';
      var m = /[?&]id=(\d+)/.exec(src);
      wid = m ? m[1] : '';
    }
    if(!wid) return;
    openWidgetById(wid);
  });

  // Экспортируем глобальные функции (если нужно)
  window.__abt = {
    loadPart, openMobile, closeMobile, openModal, closeModal,
    setContacts: function(opts){
      window.__abt_contacts = Object.assign(window.__abt_contacts || {}, opts || {});
      if (window.__abt_remountContacts) window.__abt_remountContacts();
    }
  };
})();