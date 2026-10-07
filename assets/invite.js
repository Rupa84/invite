// Shared behaviour for every invite page.
// Each page defines EVENTS (IST times, order: Haldi, Wedding, Reception) and MUSIC_START before loading this file.
/** Returns the instant as an iCalendar/Google UTC stamp, e.g. 20270301T093000Z. */
const utcStamp = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const googleCalUrl = ev => 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  + '&text=' + encodeURIComponent(ev.title)
  + '&dates=' + utcStamp(ev.start) + '/' + utcStamp(ev.end)
  + '&location=' + encodeURIComponent(ev.location)
  + '&details=' + encodeURIComponent('We can’t wait to celebrate with you! Directions: ' + ev.directions);

function buildIcs(events){
  const esc = s => s.replace(/[\\;,]/g, m => '\\' + m);
  const now = utcStamp(new Date().toISOString());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Shiv Rupa Wedding//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  events.forEach((ev, i) => lines.push(
    'BEGIN:VEVENT',
    'UID:shiv-rupa-' + utcStamp(ev.start) + '-' + i + '@invite',
    'DTSTAMP:' + now,
    'DTSTART:' + utcStamp(ev.start),
    'DTEND:' + utcStamp(ev.end),
    'SUMMARY:' + esc(ev.title),
    'LOCATION:' + esc(ev.location),
    'DESCRIPTION:' + esc('Directions: ' + ev.directions),
    'END:VEVENT'
  ));
  lines.push('END:VCALENDAR');
  const fold = l => l.match(/.{1,60}/g).join('\r\n ');
  return lines.map(fold).join('\r\n') + '\r\n';
}

const ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
const ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
document.querySelectorAll('.page[data-ev]').forEach(page => {
  const ev = EVENTS[+page.dataset.ev];
  page.querySelector('.btns').innerHTML =
    `<a class="btn solid" href="${ev.directions}" target="_blank" rel="noopener">${ICON_PIN}Directions</a>` +
    `<a class="btn" href="${googleCalUrl(ev)}" target="_blank" rel="noopener">${ICON_CAL}Calendar</a>`;
});

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// iOS opens a navigated text/calendar URL in the "Add All" calendar sheet; elsewhere download the file.
document.getElementById('addAll').addEventListener('click', () => {
  const ics = buildIcs(EVENTS);
  if (isIOS){
    location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
    return;
  }
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Shiv-Rupa-Wedding.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function makePetals(){
  const host = document.getElementById('petals');
  const ROSE = `<svg viewBox="0 0 40 40"><path d="M20 6Q28 14 28 22Q24 30 20 34Q16 30 12 22Q12 14 20 6Z" fill="#E3AFB2"/><path d="M20 10Q25 16 25 22Q22 28 20 30Q18 28 15 22Q15 16 20 10Z" fill="#FBE3E1" opacity=".75"/></svg>`;
  const PEACH = `<svg viewBox="0 0 40 40"><path d="M20 6Q28 14 28 22Q24 30 20 34Q16 30 12 22Q12 14 20 6Z" fill="#F2BE8E"/><path d="M20 10Q25 16 25 22Q22 28 20 30Q18 28 15 22Q15 16 20 10Z" fill="#FFF0DF" opacity=".7"/></svg>`;
  for (let i = 0; i < 12; i++){
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.left = (Math.random() * 100) + '%';
    const size = 12 + Math.random() * 14;
    p.style.width = p.style.height = size + 'px';
    p.style.animationDuration = (10 + Math.random() * 10) + 's';
    // First few fall immediately on load; the rest are staggered.
    p.style.animationDelay = (i < 6 ? Math.random() * 0.8 : Math.random() * -18) + 's';
    p.innerHTML = i % 3 === 0 ? PEACH : ROSE;
    host.appendChild(p);
  }
}

// Music
const musicBtn = document.getElementById('musicBtn');
const audio = new Audio('../assets/music.mp3');
audio.preload = 'auto';
audio.volume = 0.6;
audio.addEventListener('loadedmetadata', () => { audio.currentTime = MUSIC_START; }, { once: true });
audio.addEventListener('ended', () => { audio.currentTime = MUSIC_START; audio.play(); });
audio.addEventListener('error', () => { musicBtn.hidden = true; });
const setPlaying = on => musicBtn.classList.toggle('playing', on);
function playMusic(){ audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
musicBtn.addEventListener('click', () => {
  if (audio.paused) playMusic(); else { audio.pause(); setPlaying(false); }
});

// Pages: active-page tracking drives the reveal animation and the dots.
const frame = document.getElementById('frame');
const scroller = document.getElementById('pages');
const pages = [...document.querySelectorAll('.page')];
const dotsEl = document.getElementById('dots');
const dots = pages.map((p, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', 'Go to ' + p.dataset.name);
  b.addEventListener('click', () => p.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
  dotsEl.appendChild(b);
  return b;
});
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const i = pages.indexOf(e.target);
    pages.forEach((p, j) => p.classList.toggle('active', j === i));
    dots.forEach((d, j) => d.classList.toggle('on', j === i));
    frame.classList.toggle('dark-page', !!e.target.dataset.dark);
  });
}, { root: scroller, threshold: 0.6 });
pages.forEach(p => io.observe(p));
dots[0].classList.add('on');
pages[0].classList.add('active');

// Entrance: art push-in and petals on load; music starts on the first tap (browsers block autoplay before that).
frame.classList.add('entering');
if (!reduceMotion) makePetals();
musicBtn.hidden = false;
playMusic();
const startOnTap = e => {
  if (!musicBtn.contains(e.target) && audio.paused && !audio.error) playMusic();
  ['click', 'touchend', 'keydown'].forEach(t => document.removeEventListener(t, startOnTap, true));
};
['click', 'touchend', 'keydown'].forEach(t => document.addEventListener(t, startOnTap, true));

// Countdown
const target = new Date(WEDDING_AT).getTime();
const pad = n => String(n).padStart(2, '0');
const $ = id => document.getElementById(id);
const cd = { d: $('cdDays'), h: $('cdHours'), m: $('cdMins'), s: $('cdSecs') };
function tick(){
  let diff = target - Date.now();
  if (diff <= 0){
    $('cdGrid').innerHTML = '<div class="cd-ended">शुभ विवाह · The day is here.</div>';
    clearInterval(timer);
    return;
  }
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);    diff -= m * 60000;
  cd.d.textContent = pad(d); cd.h.textContent = pad(h);
  cd.m.textContent = pad(m); cd.s.textContent = pad(Math.floor(diff / 1000));
}
const timer = setInterval(tick, 1000);
tick();
