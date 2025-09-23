/* app.js — общий скрипт для всех страниц
   - грузит header.html, footer.html, tg-btn.html
   - управляет hover-дропдаунами в шапке
   - табами по data-tab-target (если есть)
   - мобильным меню (гамбургер, бэкдроп, ESC)
*/

(function(){
  // Версия для пробития кеша статических partials
  var VERSION = '20250922';
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
  // Conditional cache-busting: only after the first open (to avoid cold-load every time)
  var __gcOpenedOnce = false;
  function addRandIfNeeded(src){
    if(!__gcOpenedOnce) return src; // first load should be cacheable
    var sep = src.indexOf('?') === -1 ? '?' : '&';
    var rand = 'rand=' + encodeURIComponent(Date.now().toString(36) + Math.random().toString(36).slice(2));
    return src + sep + rand;
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
    loadPart('site-telegram-btn', withV('tg-btn.html'));
    preconnectOnce('https://artbytwins.getcourse.ru');
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
  }

  function closeModal(){
    if(!modalState.el) return;
    modalState.el.style.display = 'none';
    document.documentElement.style.overflow = '';
    modalState.el.setAttribute('aria-hidden','true');
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

  // ===== GetCourse widget opener (use data-gc-id or data-gc-src on button) =====
  // Usage on a button/link:
  // <a class="btn-tariff" data-gc-id="1487237">Выбрать базовый</a>
  // or <a data-gc-src="https://artbytwins.getcourse.ru/pl/lite/widget/script?id=1487237">Купить</a>
  function buildGcSrcById(id){
    return 'https://artbytwins.getcourse.ru/pl/lite/widget/script?id=' + encodeURIComponent(id);
  }

  function addRand(src){
    return addRandIfNeeded(src);
  }

  function openGetCourseWidget(src){
    openModal();

    // Prepare host and loader
    var host = document.createElement('div');
    host.style.cssText = 'padding:0;min-height:60vh;display:block;';

    var loader = document.createElement('div');
    loader.textContent = 'Загрузка…';
    loader.style.cssText = 'padding:1rem;text-align:center;color:#0f172a;font-weight:600;';

    modalState.body.appendChild(loader);
    modalState.body.appendChild(host);

    // Clean any previous widget containers just in case
    // (modalState.body is cleared on close, но защищаемся от двойных кликов)
    modalState.body.querySelectorAll('.gcw_lite_widget_container,.gcw_lw_container,.gc-lw-container').forEach(function(n){
      n.style.display = 'none';
    });

    // Append GC script with unique rand
    preconnectOnce('https://artbytwins.getcourse.ru');
    var s = document.createElement('script');
    s.src = addRand(src);
    s.async = true;
    s.onload = function(){
      try{
        if(document.readyState !== 'loading'){
          document.dispatchEvent(new Event('DOMContentLoaded', { bubbles:true, cancelable:true }));
        }
      }catch(e){}
    };
    modalState.body.appendChild(s);

    // Fallback A: insert iframe ourselves if GC didn’t mount yet
    setTimeout(function(){
      var root = modalState.body.querySelector('.gcw_lite_widget_container, .gcw_lw_container, .gc-lw-container, iframe');
      if(root) return;
      try{
        var idMatch = /[?&]id=(\d+)/.exec(src);
        var wid = idMatch ? idMatch[1] : '';
        if(!wid) return;
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
        modalState.body.appendChild(iframe);
        loader && loader.remove();
      }catch(e){}
    }, 1200);

    // Fallback B: open in a new tab after 3s if still nothing
    setTimeout(function(){
      var root2 = modalState.body.querySelector('.gcw_lite_widget_container, .gcw_lw_container, .gc-lw-container, iframe');
      if(root2) return;
      try{
        var idMatch2 = /[?&]id=(\d+)/.exec(src);
        var wid2 = idMatch2 ? idMatch2[1] : '';
        if(!wid2) return;
        var direct2 = 'https://artbytwins.getcourse.ru/pl/lite/widget/widget'
          + '?' + window.location.search.substring(1)
          + '&id=' + encodeURIComponent(wid2)
          + '&ref=' + encodeURIComponent(document.referrer)
          + '&loc=' + encodeURIComponent(document.location.href);
        window.open(direct2, '_blank', 'noopener');
        var tip = document.createElement('div');
        tip.style.cssText = 'padding:16px 12px;text-align:center;color:#334155;font-size:14px;';
        tip.textContent = 'Мы открыли оплату в новой вкладке, т.к. встроенный виджет грузится медленно или заблокирован.';
        modalState.body.appendChild(tip);
        loader && (loader.textContent = 'Если вкладка не открылась — разрешите всплывающие окна и попробуйте снова.');
      }catch(e){}
    }, 3000);

    // When widget mounts, adjust sizing (iframe or container)
    var obs = new MutationObserver(function(){
      var root = modalState.body.querySelector('.gcw_lite_widget_container, .gcw_lw_container, .gc-lw-container, iframe');
      if(!root) return;
      obs.disconnect();
      loader.remove();
      if(root.tagName === 'IFRAME'){
        root.style.width = '100%';
        root.style.height = '80vh';
      } else {
        root.style.setProperty('display','block','important');
        root.style.setProperty('height','80vh','important');
        var ifr = root.querySelector('iframe');
        if(ifr){ ifr.style.width = '100%'; ifr.style.height = '80vh'; }
      }
    });
    obs.observe(modalState.body, { childList:true, subtree:true });
    __gcOpenedOnce = true;
  }

  // Preload widget script on hover to warm up connection
  document.addEventListener('mouseover', function(e){
    var t = e.target.closest && e.target.closest('[data-gc-id], [data-gc-src]');
    if(!t) return;
    var src = t.getAttribute('data-gc-src') || (t.getAttribute('data-gc-id') ? buildGcSrcById(t.getAttribute('data-gc-id')) : '');
    if(!src) return;
    try{
      preconnectOnce('https://artbytwins.getcourse.ru');
      var id = 'preload_'+src.replace(/[^a-z0-9]/gi,'_');
      if(document.getElementById(id)) return;
      var link = document.createElement('link');
      link.id = id; link.rel = 'preload'; link.as = 'script'; link.href = src;
      document.head.appendChild(link);
    }catch(e){}
  });

  // Delegated click binding for buttons/links with data-gc-id or data-gc-src
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-gc-id], [data-gc-src]');
    if(!t) return;
    e.preventDefault();
    var src = t.getAttribute('data-gc-src');
    var id  = t.getAttribute('data-gc-id');
    if(!src && id) src = buildGcSrcById(id);
    if(!src) return;
    openGetCourseWidget(src);
    __gcOpenedOnce = true;
  });

  // Экспортируем в глобальную область если нужно
  window.__abt = { loadPart, openMobile, closeMobile, openModal, closeModal, openGetCourseWidget };
})();