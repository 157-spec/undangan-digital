const CONFIG = {
  tanggalAkad: new Date('2026-12-20T08:00:00+07:00'),
  judulKalender: 'Pernikahan Andre & Aida',
  lokasi: 'Masjid Al-Ikhlas, Jl. Merdeka No. 10, Surabaya',
  titik: {
    akad: {
      nama: 'Masjid Al-Ikhlas',
      alamat: 'Jl. Merdeka No. 10, Surabaya',
      pos: [-7.2575, 112.7521]
    },
    resepsi: {
      nama: 'Gedung Graha Bahagia',
      alamat: 'Jl. Mawar No. 5, Surabaya',
      pos: [-7.2653, 112.7378]
    }
  }
};

const $ = id => document.getElementById(id);
const toast = new bootstrap.Toast($('toast'), { delay: 2200 });
const say = m => {
  $('toastMsg').textContent = m;
  toast.show();
};

const to = new URLSearchParams(location.search).get('to');
if (to) $('guestName').textContent = to;

$('dateLine').textContent = CONFIG.tanggalAkad.toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

function tick() {
  let s = Math.max(0, Math.floor((CONFIG.tanggalAkad - new Date()) / 1000));
  const p = { d: 86400, h: 3600, m: 60, s: 1 };
  for (const k in p) {
    $('cd-' + k).textContent = Math.floor(s / p[k]);
    s %= p[k];
  }
}
tick();
setInterval(tick, 1000);

const bgm = $('bgm');
const musicBtn = $('musicBtn');
bgm.volume = 0;

function startMusic() {
  if (!bgm.paused) return;
  bgm.play().then(() => {
    musicBtn.classList.add('playing');
    let v = 0;
    const f = setInterval(() => {
      v = Math.min(0.6, v + 0.05);
      bgm.volume = v;
      if (v >= 0.6) clearInterval(f);
    }, 200);
  }).catch(() => document.addEventListener('pointerdown', startMusic, { once: true }));
}

$('openBtn').addEventListener('click', () => {$('gate').classList.add('open');
  document.body.classList.remove('locked');
  startMusic();
  setTimeout(() => $('gate').classList.add('done'), 1500);
});

musicBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.volume = 0.6;
    bgm.play().catch(() => say('File musik.mp3 belum ada'));
    musicBtn.classList.add('playing');
  } else {
    bgm.pause();
    musicBtn.classList.remove('playing');
  }
});

const petals = $('petals');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('span');
    el.className = 'petal';
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDuration = 9 + Math.random() * 9 + 's';
    el.style.animationDelay = -Math.random() * 12 + 's';
    petals.appendChild(el);
  }
}

const io = new IntersectionObserver(
  es => es.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      io.unobserve(e.target);
    }
  }),
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

$('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText($('rek').textContent).then(() => say('Nomor rekening disalin'));
});

$('calBtn').addEventListener('click', e => {
  e.preventDefault();
  const f = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const end = new Date(CONFIG.tanggalAkad.getTime() + 6 * 3600 * 1000);
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${CONFIG.judulKalender}\nDTSTART:${f(CONFIG.tanggalAkad)}\nDTEND:${f(end)}\nLOCATION:${CONFIG.lokasi}\nEND:VEVENT\nEND:VCALENDAR`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'undangan-andre-aida.ics';
  a.click();
});

const KEY = 'ucapan-andre-aida';
const esc = s => s.replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

function render() {
  const list = JSON.parse(localStorage.getItem(KEY) || '[]');
  $('wishes').innerHTML = list.length
    ? list.map((w, i) => `
        <div class="wish">
          <button class="del" data-i="${i}" aria-label="Hapus ucapan">×</button>
          <b>${esc(w.nama)}</b> <small>${esc(w.hadir)}</small><br>
          ${esc(w.pesan)}
        </div>
      `).join('')
    : '<p class="text-center muted">Belum ada ucapan. Jadilah yang pertama.</p>';
}

$('rsvpForm').addEventListener('submit', e => {
  e.preventDefault();
  const nama = $('nama').value.trim();
  const pesan = $('pesan').value.trim();
  if (!nama || !pesan) return say('Isi nama dan ucapan dulu ya');
  const list = JSON.parse(localStorage.getItem(KEY) || '[]');
  list.unshift({ nama, hadir: $('hadir').value, pesan });
  localStorage.setItem(KEY, JSON.stringify(list));
  e.target.reset();
  render();
  say('Terima kasih atas ucapannya');
});

render();

$('wishes').addEventListener('click', e => {
  const b = e.target.closest('.del');
  if (!b) return;
  const list = JSON.parse(localStorage.getItem(KEY) || '[]');
  list.splice(+b.dataset.i, 1);
  localStorage.setItem(KEY, JSON.stringify(list));
  render();
  say('Ucapan dihapus');
});

const T = CONFIG.titik;
let cur = 'akad';
let line;
let me;

const map = L.map('map', { scrollWheelZoom: false }).setView(T.akad.pos, 16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

const heart = L.divIcon({
  className: '',
  html: '<div class="pin"><i>♥</i></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -34]
});

const pins = {};
for (const k in T) {
  pins[k] = L.marker(T[k].pos, { icon: heart })
    .addTo(map)
    .bindPopup(`<b>${T[k].nama}</b><br>${T[k].alamat}`);
}

function showLoc(k) {
  cur = k;
  map.flyTo(T[k].pos, 16);
  pins[k].openPopup();
  $('routeBtn').href = `https://www.google.com/maps/dir/?api=1&destination=${T[k].pos.join(',')}`;
  document.querySelectorAll('#mapTabs .nav-link').forEach(b => {
    b.classList.toggle('active', b.dataset.k === k);
  });
  $('distInfo').textContent = '';
}

document.querySelectorAll('#mapTabs .nav-link').forEach(b => {
  b.addEventListener('click', () => showLoc(b.dataset.k));
});

$('routeBtn').href = `https://www.google.com/maps/dir/?api=1&destination=${T.akad.pos.join(',')}`;

$('distBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return say('Browser tidak mendukung lokasi');
  navigator.geolocation.getCurrentPosition(
    p => {
      const from = [p.coords.latitude, p.coords.longitude];
      const km = map.distance(from, T[cur].pos) / 1000;
      if (line) map.removeLayer(line);
      if (me) map.removeLayer(me);
      me = L.circleMarker(from, {
        radius: 8,
        color: '#fff',
        fillColor: '#c2577a',
        fillOpacity: 1
      }).addTo(map).bindPopup('Lokasi Anda');
      line = L.polyline([from, T[cur].pos], {
        color: '#c2577a',
        dashArray: '8 8'
      }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [40, 40] });
      $('distInfo').textContent = `Jarak dari lokasi Anda ke ${T[cur].nama}: sekitar ${km.toFixed(1)} km (garis lurus)`;
    },
    () => say('Izin lokasi ditolak')
  );
});

$('openBtn').addEventListener('click', () => {
  setTimeout(() => map.invalidateSize(), 1600);
});

document.addEventListener('click', e => {
  if (
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    e.target.closest('button,a,input,select,textarea,.leaflet-container')
  ) return;

  for (let i = 0; i < 6; i++) {
    const h = document.createElement('span');
    h.className = 'heart';
    h.textContent = '✿';
    h.style.left = e.clientX + 'px';
    h.style.top = e.clientY + 'px';
    h.style.setProperty('--dx', (Math.random() * 90 - 45) + 'px');
    h.style.setProperty('--dy', -(40 + Math.random() * 70) + 'px');
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1000);
  }
});