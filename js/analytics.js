// --- GA init ---
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-4XY66V3Y3M');

document.addEventListener('DOMContentLoaded', function () {

  function nearestSectionId(el) {
    const section = el.closest('.section[id]') || el.closest('[id]');
    return section && section.id ? section.id : 'unknown';
  }

  function parseMailto(href) {
    const out = { address: '', subject: '' };
    try {
      const noMailto = href.replace(/^mailto:/i, '');
      const parts = noMailto.split('?');
      out.address = decodeURIComponent(parts[0] || '');
      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        out.subject = params.get('subject') || '';
      }
    } catch (e) {}
    return out;
  }

  // --- Scroll depth ---
  const depthMilestones = [25, 50, 75, 90];
  const reached = {};

  window.addEventListener('scroll', function () {
    const denom = (document.body.scrollHeight - window.innerHeight);
    if (denom <= 0) return;
    const scrollPct = Math.round((window.scrollY / denom) * 100);

    depthMilestones.forEach(function (m) {
      if (!reached[m] && scrollPct >= m) {
        reached[m] = true;
        gtag('event', 'scroll_depth', { depth_percent: m });
      }
    });
  }, { passive: true });

  // --- Outbound clicks ---
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a || !a.href) return;

    const href = a.getAttribute('href') || '';
    if (href.startsWith('mailto:')) return;

    let url;
    try { url = new URL(a.href, window.location.href); } catch (_) { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    if (url.hostname === window.location.hostname) return;

    gtag('event', 'outbound_click', {
      link_url: url.href,
      link_text: (a.innerText || '').trim().slice(0, 120),
      location: nearestSectionId(a)
    });
  });

  // --- Mailto clicks ---
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      const info = parseMailto(a.getAttribute('href') || '');
      gtag('event', 'email_click', {
        email_address: info.address,
        email_subject: info.subject,
        link_text: (a.innerText || '').trim().slice(0, 120),
        location: nearestSectionId(a)
      });
    });
  });

  // --- Section attention ---
  const sectionLabels = {
    about: 'About',
    competencies: 'Core Competencies',
    engagement: 'Engagement Profile',
    experience: 'Experience',
    standards: 'Standards & Frameworks',
    education: 'Education',
    cta: 'Contact CTA'
  };

  const sectionTimers = {};

  function startTimer(id) {
    if (!sectionTimers[id]) sectionTimers[id] = { startTs: 0, accumMs: 0 };
    if (!sectionTimers[id].startTs && document.visibilityState === 'visible') {
      sectionTimers[id].startTs = Date.now();
    }
  }

  function stopTimer(id) {
    const t = sectionTimers[id];
    if (!t || !t.startTs) return;
    t.accumMs += (Date.now() - t.startTs);
    t.startTs = 0;
  }

  function flushTimer(id) {
    stopTimer(id);
    const t = sectionTimers[id];
    if (!t) return;

    const seconds = Math.round(t.accumMs / 1000);
    if (seconds >= 2) {
      gtag('event', 'section_attention', {
        section_id: id,
        section_name: sectionLabels[id] || id,
        seconds_spent: seconds
      });
    }
    delete sectionTimers[id];
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      const id = entry.target.id;
      if (!id || !sectionLabels[id]) return;

      if (entry.isIntersecting) startTimer(id);
      else flushTimer(id);
    });
  }, { threshold: 0.35 });

  Object.keys(sectionLabels).forEach(function (id) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  document.addEventListener('visibilitychange', function () {
    const ids = Object.keys(sectionTimers);
    if (document.visibilityState === 'hidden') ids.forEach(stopTimer);
    else ids.forEach(startTimer);
  });

  window.addEventListener('pagehide', function () {
    Object.keys(sectionTimers).forEach(flushTimer);
  });

});
