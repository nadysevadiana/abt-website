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
  // Usage example on a button:
  // <a class="btn-tariff" data-gc-id="1487237">Выбрать базовый</a>
  // or <a data-gc-src="https://artbytwins.getcourse.ru/pl/lite/widget/script?id=1487237">Купить</a>
  function buildGcSrcById(id){
    return 'https://artbytwins.getcourse.ru/pl/lite/widget/script?id=' + encodeURIComponent(id);
  }

  function openGetCourseWidget(src){
    openModal();
    // Create a fresh container each time
    var host = document.createElement('div');
    host.style.cssText = 'padding:0;';
    modalState.body.appendChild(host);

    // Create script
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    // Add a small guard against duplicate script execution caching
    s.onload = function(){ /* widget loads itself into modal body */ };
    s.onerror = function(){
      host.innerHTML = '<div style="padding:1rem;color:#b91c1c">Не удалось загрузить виджет. Попробуйте ещё раз.</div>';
    };
    // Append script after host so some widgets can detect previousSibling
    modalState.body.appendChild(s);
  }

  // Экспортируем в глобальную область если нужно (опционально)
  window.__abt = { loadPart, openMobile, closeMobile, openModal, closeModal, openGetCourseWidget };
})();