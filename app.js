/* app.js — общий скрипт для всех страниц
   - грузит header.html, footer.html, tg-btn.html
   - управляет hover-дропдаунами в шапке
   - табами по data-tab-target (если есть)
   - мобильным меню (гамбургер, бэкдроп, ESC)
*/

(function(){
  // Версия для пробития кеша статических partials
  var VERSION = '20250923h';
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
          tg: c.tg || 'https://artbytwins.getcourse.ru/lsp/opentelegram',
          em: c.em || 'mailto:info@artbytwins.pro'
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

  // ===== Simple Story Viewer (uses #storyModal without white box) =====
  (function initStoryViewer(){
    var data = [];           // stories strip (students)
    var idx = 0;             // current story index in strip
    var slides = [];         // current slides of active story
    var slideIdx = 0;        // current slide within story
    var timer = null;
    var AUTOPLAY_MS = 5000; // 5s per slide

    // Optional overrides for richer multi-slide sequences per story item (by zero-based index)
    var STORY_OVERRIDES = {
      0: [ // Анна
        { image: './images/work_1.png', style: 'Современный минимализм', name: 'Анна', city: 'Москва', caption: 'Сделала проект спальни: план, палитра, расстановка и свет.' },
        { image: './images/work_1.png', style: 'Лофт', name: 'Анна', city: 'Москва', caption: 'Почему лофт? Люблю текстуры дерева и бетона, добавила чёрные акценты.' },
        { image: './images/work_3.png', style: 'Современный минимализм', name: 'Команда', city: 'Москва', caption: 'Вдохновлялась работами ребят — вместе нашли решения для хранения.' }
      ],
      2: [ // Алексей
        { image: './images/work_3.png', style: 'Лофт', name: 'Алексей', city: 'Москва', caption: 'Проект квартиры в стиле лофт: открытое пространство и брутальные материалы.' },
        { image: './images/work_4.png', style: 'Скандинавский уют', name: 'Алексей', city: 'Москва', caption: 'Для спальни — мягкие ткани, тёплый свет, светлое дерево.' }
      ]
    };

    // Cache modal elements
    var modal   = null;
    var elView  = null;
    var elBars  = null;
    var elImg   = null;
    var elAva   = null;
    var elTitle = null;
    var elMeta  = null;
    var elCTitle= null;
    var elCap   = null;
    var elPrev  = null;
    var elNext  = null;
    var elClose = null;

    function qs(id){ return document.getElementById(id); }

    function mountRefs(){
      modal   = modal   || qs('storyModal');
      if(!modal) return false;
      elView  = elView  || qs('storyView');
      elBars  = elBars  || qs('storyBars');
      elImg   = elImg   || qs('storyImage');
      elAva   = elAva   || qs('storyAvatar');
      elTitle = elTitle || qs('storyTitle');
      elMeta  = elMeta  || qs('storyMeta');
      elCTitle= elCTitle|| qs('storyCaptionTitle');
      elCap   = elCap   || qs('storyCaption');
      elPrev  = elPrev  || qs('tapPrev');
      elNext  = elNext  || qs('tapNext');
      elClose = elClose || qs('storyClose');
      return !!(modal && elView && elBars && elImg && elTitle && elCap && elPrev && elNext && elClose);
    }

    function collect(){
      var items = document.querySelectorAll('#studentStories .story-item');
      data = Array.prototype.map.call(items, function(it){
        var img = it.querySelector('img');
        var label = (it.getAttribute('data-caption-title') || it.querySelector('.story-label')?.textContent || '').trim();
        var meta = (it.getAttribute('data-meta') || '').trim();
        var style = '', city = '';
        if(meta){
          var parts = meta.split('·');
          if(parts.length >= 2){ style = parts[0].trim(); city = parts[1].trim(); }
          else { style = meta; }
        }
        var name = label.split(',')[0].trim() || label;
        return {
          slides: [{
            image: img ? img.getAttribute('src') : '',
            style: style || 'Проект',
            name: name || '',
            city: city || '',
            caption: it.getAttribute('data-caption') || ''
          }]
        };
      });
      // Apply manual overrides if defined
      Object.keys(STORY_OVERRIDES).forEach(function(k){
        var i = parseInt(k,10);
        if(!isNaN(i) && data[i]){ data[i].slides = STORY_OVERRIDES[i]; }
      });
    }

    function openModalStory(){
      if(!mountRefs()) return;
      modal.hidden = false;
      modal.setAttribute('aria-hidden','false');
      document.documentElement.style.overflow = 'hidden';
    }
    function closeModalStory(){
      if(!mountRefs()) return;
      modal.hidden = true;
      modal.setAttribute('aria-hidden','true');
      document.documentElement.style.overflow = '';
      stopTimer();
    }

    function stopTimer(){ if(timer){ clearTimeout(timer); timer=null; } }

    function renderBarsForSlides(active){
      elBars.innerHTML = '';
      for(var i=0;i<slides.length;i++){
        var b = document.createElement('div'); b.className='story-bar';
        var s = document.createElement('span'); if(i < active) s.style.width='100%';
        b.appendChild(s); elBars.appendChild(b);
      }
      var span = elBars.querySelectorAll('.story-bar > span')[active];
      if(span){
        span.style.transition = 'none'; span.style.width='0%';
        requestAnimationFrame(function(){
          span.style.transition = 'width '+(AUTOPLAY_MS/1000)+'s linear';
          span.style.width='100%';
        });
      }
    }

    function openStoryAt(i){
      if(!data.length) return;
      idx = (i + data.length) % data.length;
      slides = data[idx].slides || [];
      slideIdx = 0;
      openModalStory();
      showSlide(slideIdx);
    }

    function showSlide(j){
      if(!slides.length) return;
      slideIdx = (j + slides.length) % slides.length;
      var d = slides[slideIdx];
      elImg.src = d.image || '';
      elAva.src = d.avatar || d.image || '';
      // Top line: Name, City
      elTitle.textContent = (d.name && d.city) ? (d.name + ', ' + d.city) : (d.name || d.city || '');
      elMeta.textContent  = '';
      // Bottom caption: style (bold title) + description
      elCTitle.textContent= d.style || '';
      elCap.textContent   = d.caption || '';
      renderBarsForSlides(slideIdx);
      stopTimer();
      timer = setTimeout(function(){ nextSlide(); }, AUTOPLAY_MS);
    }

    function nextSlide(){
      if(slideIdx + 1 < slides.length){ showSlide(slideIdx + 1); }
      else { openStoryAt(idx + 1); }
    }
    function prevSlide(){
      if(slideIdx - 1 >= 0){ showSlide(slideIdx - 1); }
      else {
        var prevIdx = (idx - 1 + data.length) % data.length;
        openStoryAt(prevIdx);
        slides = data[prevIdx].slides || [];
        showSlide(slides.length - 1);
      }
    }

    function bind(){
      // Open from strip
      document.addEventListener('click', function(e){
        var it = e.target.closest && e.target.closest('#studentStories .story-item');
        if(!it) return;
        if(!data.length) collect();
        var all = Array.prototype.slice.call(document.querySelectorAll('#studentStories .story-item'));
        var i = all.indexOf(it); if(i < 0) i = 0;
        openStoryAt(i);
      });

      // Close interactions
      if(mountRefs()){
        elClose.addEventListener('click', closeModalStory);
        modal.addEventListener('click', function(e){ if(e.target === modal) closeModalStory(); });
        document.addEventListener('keydown', function(e){
          if(modal.hidden) return;
          if(e.key==='Escape') closeModalStory();
          else if(e.key==='ArrowRight') { stopTimer(); nextSlide(); }
          else if(e.key==='ArrowLeft') { stopTimer(); prevSlide(); }
        });
        // Tap zones
        elNext.addEventListener('click', function(e){ e.stopPropagation(); stopTimer(); nextSlide(); });
        elPrev.addEventListener('click', function(e){ e.stopPropagation(); stopTimer(); prevSlide(); });
        // Click on the media (image/video) also goes to NEXT
        var mediaEl = elView.querySelector('.story-media');
        if(mediaEl){
          mediaEl.style.cursor = 'pointer';
          mediaEl.addEventListener('click', function(e){
            e.stopPropagation();
            stopTimer();
            nextSlide();
          });
        }
        // Touch swipe down to close
        var y0=null;
        elView.addEventListener('touchstart', function(ev){ y0 = ev.touches?.[0]?.clientY || 0; stopTimer(); }, { passive:true });
        elView.addEventListener('touchend', function(){ timer = setTimeout(function(){ nextSlide(); }, AUTOPLAY_MS); y0=null; }, { passive:true });
        elView.addEventListener('touchmove', function(ev){ if(!y0) return; var y=ev.touches?.[0]?.clientY||0; if(y - y0 > 60) closeModalStory(); }, { passive:true });
      }
    }

    document.addEventListener('DOMContentLoaded', function(){ collect(); mountRefs(); bind(); });
    window.addEventListener('pageshow', collect, { passive:true });
    try{
      var mo = new MutationObserver(function(m){ for(var i=0;i<m.length;i++){ if(m[i].addedNodes && m[i].addedNodes.length){ if(document.querySelector('#studentStories .story-item')) { collect(); break; } } } });
      mo.observe(document.documentElement, { childList:true, subtree:true });
    }catch(e){}
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