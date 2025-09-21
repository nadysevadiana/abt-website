/* app.js — общий скрипт для всех страниц
   - грузит header.html, footer.html, tg-btn.html
   - управляет hover-дропдаунами в шапке
   - табами по data-tab-target (если есть)
   - мобильным меню (гамбургер, бэкдроп, ESC)
*/

(function(){
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
    loadPart('site-header','header.html');
    loadPart('site-footer','footer.html');
    loadPart('site-telegram-btn','tg-btn.html');
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

  // Экспортируем в глобальную область если нужно (опционально)
  window.__abt = { loadPart, openMobile, closeMobile };
})();