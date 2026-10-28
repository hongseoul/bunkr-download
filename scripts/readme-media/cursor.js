/**
 * Browser script for scripts/readme-media/record.mjs: a drawn mouse pointer that moves to
 * elements and clicks them, so the recorded GIF shows what is being clicked.
 * Defines window.demo = { moveTo, click, type, hide }.
 */
(function () {
  const ARROW = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 2.5l13.5 12.2-6.1.6 3.4 6.6-2.6 1.3-3.4-6.7L5 21z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let pointer = null;
  let shiftTag = null;
  let pos = { x: window.innerWidth * 0.55, y: window.innerHeight * 0.62 };

  function ensure() {
    if (pointer) return pointer;
    pointer = document.createElement('div');
    pointer.innerHTML = ARROW;
    Object.assign(pointer.style, {
      position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none',
      transitionProperty: 'transform', transitionTimingFunction: 'cubic-bezier(.3,.7,.2,1)',
      transform: `translate(${pos.x}px, ${pos.y}px)`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.45))',
    });
    shiftTag = document.createElement('span');
    shiftTag.textContent = '⇧ Shift';
    Object.assign(shiftTag.style, {
      position: 'absolute', left: '24px', top: '20px', padding: '2px 7px', borderRadius: '6px',
      font: '600 12px system-ui, sans-serif', color: '#111', background: '#fff', whiteSpace: 'nowrap',
      boxShadow: '0 1px 4px rgba(0,0,0,.4)', display: 'none',
    });
    pointer.appendChild(shiftTag);
    document.body.appendChild(pointer);
    return pointer;
  }

  function find(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error('demo: element not found: ' + target);
    return el;
  }

  async function moveTo(target, { ms = 520, dx = 0, dy = 0 } = {}) {
    const el = find(target);
    el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect();
    pos = { x: r.left + r.width / 2 + dx, y: r.top + r.height / 2 + dy };
    const p = ensure();
    p.style.transitionDuration = ms + 'ms';
    p.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    await sleep(ms + 40);
    return el;
  }

  function ripple() {
    const dot = document.createElement('div');
    Object.assign(dot.style, {
      position: 'fixed', left: pos.x - 14 + 'px', top: pos.y - 14 + 'px', width: '28px', height: '28px',
      borderRadius: '50%', background: 'rgba(255,255,255,.55)', zIndex: '2147483646', pointerEvents: 'none',
      transition: 'transform .35s ease-out, opacity .35s ease-out',
    });
    document.body.appendChild(dot);
    requestAnimationFrame(() => { dot.style.transform = 'scale(1.8)'; dot.style.opacity = '0'; });
    setTimeout(() => dot.remove(), 400);
  }

  /** Move to `target` (or `opts.at`, the element to point at) and click it. */
  async function click(target, opts = {}) {
    const el = find(target);
    await moveTo(opts.at || el, opts);
    if (opts.shift) { shiftTag.style.display = 'block'; await sleep(250); }
    ripple();
    if (opts.shift) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true, view: window }));
    } else {
      el.click();
    }
    await sleep(opts.after ?? 220);
    if (opts.shift) shiftTag.style.display = 'none';
    return el;
  }

  async function type(target, text, { ms = 32 } = {}) {
    const el = find(target);
    el.focus();
    el.value = '';
    for (const ch of text) {
      el.value += ch;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(ms);
    }
  }

  function hide() {
    if (pointer) pointer.style.display = 'none';
  }

  window.demo = { moveTo, click, type, hide };
})();
