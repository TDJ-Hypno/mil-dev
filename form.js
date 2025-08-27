// === KONFIGURACJA ===
const SUBMIT_API = 'https://script.google.com/macros/s/AKfycbya_MHLx69_AhEukYVm0jQNMSOg1VG0G-xN6tD32_92fxWHzz1DzwEG57it3rPsWOErBw/exec'; // patrz krok 5

// --- WALIDACJA / KONFIG ---
const USE_GEOCODING   = false; // włącz na true dopiero gdy dodasz klucz
const GEOCODE_API_KEY = '';

function msg(s) { (window.showMessage ? showMessage : alert)(s); }

function toLocalDate(dateYMD, h, m) {
  if (!dateYMD) return null;
  const [Y, M, D] = dateYMD.split('-').map(x => parseInt(x, 10));
  if (!Y || !M || !D) return null;
  const hh = parseInt(h, 10), mm = parseInt(m, 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return new Date(Y, M - 1, D, hh, mm, 0, 0);
}

async function geocodeAddress(addr) {
  if (!USE_GEOCODING || !GEOCODE_API_KEY) return true;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?key=${GEOCODE_API_KEY}&address=${encodeURIComponent(addr)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.results) && data.results.length > 0;
  } catch { return false; }
}

// true | false | 'unknown' (gdy CORS blokuje weryfikację)
async function checkUrlExists(u) {
  if (!u) return true;
  try {
    const url = new URL(u);
    if (!/^https?:$/.test(url.protocol)) return false;
  } catch { return false; }

  try {
    const r = await fetch(u, { method: 'HEAD', mode: 'cors' });
    return r.ok;
  } catch {
    try {
      const r2 = await fetch(u, { method: 'GET', mode: 'cors' });
      return r2.ok;
    } catch { return 'unknown'; }
  }
}

// === POMOCNIKI ===
const $id = (x) => document.getElementById(x);
const pad2 = (n) => n.toString().padStart(2, '0');
const makeDateTime = (d, h, m) => d ? `${d} ${pad2(h)}:${pad2(m)}` : ''; // "YYYY-MM-DD HH:MM"

// Teksty podpowiedzi dla linków (kliknięcie nazwy pola)
const HINTS = {
  'Nazwa wydarzenia': 'Podaj nazwę tak, by uczestnicy łatwo rozpoznali wydarzenie i mogli je odnaleźć w sieci. (obowiązkowe)',
  'Adres': 'Pełny adres (nazwa np. knajpy, ulica, numer, miasto, kraj). Najlepiej najpierw odszukaj dokładnie miejsce na mapie Google, a nstępnie skopiuj adres tego miejsca. Dzięki temu łatwiej wyznaczyć trasę. (obowiązkowe)',
  'Dzień tygodnia': 'Jeśli wydarzenie jest cykliczne, wybierz dzień tygodnia w którym jest organizowane (np. środa). Zostaw puste dla jednorazowych. Cykliczne wydarzenia miesięczne czy kwartalne rejestrujemy jako oddzielne.',
  'Data od': 'Data rozpoczęcia wydarzenia. (obowiązkowe)',
  'Godzina od': 'Godzina rozpoczęcia. (obowiązkowe)',
  'Data do': 'Data zakończenia, jeżeli wydarzenie ma zakończyć się choćby minutę po północy to wskaż już kolejny dzień. (obowiązkowe)',
  'Godzina do': 'Godzina zakończenia. 59 użyj tylko wtedy kiedy wydarzenie kończy się o północy. (obowiązkowe)',
  'Parkietowe': 'Wpisz cenę biletu wraz z walutą (np. 35-50 Euro, 40 zł) lub „free”.',
  'Organizator': 'Nazwa organizatora lub imię i nazwisko (może być kilka osób).',
  'TDj': 'Imię i nazwisko/nick DJ-a (jeśli znany) Nie dopisuj "DJ" czy "TDJ".',
  'Typ muzyki': 'Np. klasyczna / nuevo / alternatywna / mix.',
  'Link': 'Link do wydarzenia/strony (FB, WWW itp.). (obowiązkowe)',
  'Informacja': 'Krótki opis: ważne szczegóły, dress code, parking, zapisy itd. Max 2-3 zdnia pisane ciągiem (bez "Enterów").'
};

// === API ===
async function submitEvent(payload) {
  // Używamy text/plain, by uniknąć preflight CORS
  const res = await fetch(SUBMIT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  // Nie zakładamy zwrotki JSON (może być opaque, jeśli kiedyś zmienisz CORS)
  return true;
}

// === LOGIKA FORMULARZA ===
function fillSelects() {
  const hours = [...Array(24)].map((_,i)=>i);
  const minsFrom  = [0, 10, 20, 30, 40, 50];
  const minsTo    = [0, 10, 20, 30, 40, 50, 59];
  const sFH = $id('f_from_h'), sFM = $id('f_from_m');
  const sTH = $id('f_to_h'),   sTM = $id('f_to_m');
  sFH.innerHTML = hours.map(h => `<option value="${h}">${pad2(h)}</option>`).join('');
  sTH.innerHTML = hours.map(h => `<option value="${h}">${pad2(h)}</option>`).join('');
  sFM.innerHTML = minsFrom.map(m => `<option value="${m}">${pad2(m)}</option>`).join('');
  sTM.innerHTML = minsTo  .map(m => `<option value="${m}">${pad2(m)}</option>`).join('');
}

function setDefaults() {
  // Domyślna data: dziś
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm   = pad2(today.getMonth()+1);
  const dd   = pad2(today.getDate());
  $id('f_from_d').value = `${yyyy}-${mm}-${dd}`;
  $id('f_to_d').value   = `${yyyy}-${mm}-${dd}`;
  // symboliczne godziny start/koniec
  $id('f_from_h').value = '20'; $id('f_from_m').value = '0';
  $id('f_to_h').value   = '23'; $id('f_to_m').value   = '59';
}

function openSubmitModal() {
  $id('submitModal').style.display = 'block';
}
function closeSubmitModal() {
  $id('submitModal').style.display = 'none';
}

function openHint(title) {
  $id('hintTitle').textContent = title;
  $id('hintText').textContent  = HINTS[title] || '';
  $id('hintModal').style.display = 'block';
}
function closeHint() {
  $id('hintModal').style.display = 'none';
}

function getPayload() {
  const name = $id('f_name').value.trim();
  const addr = $id('f_addr').value.trim();
  const dow  = $id('f_dow').value.trim();

  if (!name || !addr) {
    window.showMessage?.('Podaj przynajmniej „Nazwa wydarzenia” i „Adres”.');
    return null;
  }

  const fromD = $id('f_from_d').value;
  const fromH = +$id('f_from_h').value;
  const fromM = +$id('f_from_m').value;

  const toD   = $id('f_to_d').value;
  const toH   = +$id('f_to_h').value;
  const toM   = +$id('f_to_m').value;

  const payload = {
    action: 'submitEvent',
    // Klucze odpowiadają nazwom kolumn w głównym arkuszu:
    'Nazwa': name,
    'Adres': addr,
    'Dzien_tygodnia': dow || '',

    'Data od': makeDateTime(fromD, fromH, fromM),
    'Data do': makeDateTime(toD,   toH,   toM),

    'Parkietowe':  $id('f_fee').value.trim(),
    'Organizator': $id('f_org').value.trim(),
    'TDJ':         $id('f_tdj').value.trim(),
    'Typ muzyki':  $id('f_music').value.trim(),
    'Link':        $id('f_link').value.trim(),
    'Informacje':  $id('f_info').value.trim(),

    // domyślne/techniczne:
    'Klikniete': 0,
    'Trasa':     0,
    'Kalendarz': 0,
    'Opłacone':  '' // Ty ręcznie ustawiasz „Tak”
  };

  return payload;
}

async function validateBeforeSubmit() {
  // Zbieramy surowe wartości z formularza
  const name = $id('f_name').value.trim();
  const addr = $id('f_addr').value.trim();
  const dow  = ($id('f_dow').value.trim() || '').toLocaleLowerCase('pl-PL');

  const fromD = $id('f_from_d').value;
  const fromH = $id('f_from_h').value;
  const fromM = $id('f_from_m').value;

  const toD   = $id('f_to_d').value;
  const toH   = $id('f_to_h').value;
  const toM   = $id('f_to_m').value;

  // 1) Nazwa >= 10 znaków
  if (name.length < 10) {
    msg('Podaj pełną nazwę wydarzenia (minimum 10 znaków).');
    return { ok:false };
  }

  // 2) Adres – podstawowy sanity check + opcjonalnie geocoding
  if (addr.length < 5 || !/[a-zA-ZĄąĆćĘęŁłŃńÓóŚśŹźŻż]/.test(addr)) {
    msg('Adres wygląda na niepoprawny. Podaj pełny adres (ulica, numer, miasto).');
    return { ok:false };
  }
  const geoOK = await geocodeAddress(addr);
  if (geoOK === false) {
    msg('Nie udało się potwierdzić adresu w geokoderze Google. Sprawdź adres.');
    return { ok:false };
  }
  // jeśli true lub USE_GEOCODING=false — idziemy dalej

  // 3) Daty/godziny – budujemy obiekty Date (lokalne)
  const start = toLocalDate(fromD, fromH, fromM);
  const end   = toLocalDate(toD,   toH,   toM);

  if (!start || !end) {
    msg('Uzupełnij poprawnie datę i godzinę rozpoczęcia oraz zakończenia.');
    return { ok:false };
  }

  const now = new Date();

  // 3a) Start w przeszłości → zapytaj, czy na pewno
  if (start < now) {
    const go = confirm('Start wydarzenia jest w przeszłości. Czy na pewno chcesz wysłać?');
    if (!go) return { ok:false };
  }

  // 4) Koniec >= start + min. 2 godziny
  const TWO_H = 2 * 60 * 60 * 1000;
  if (end < start) {
    msg('Data i godzina zakończenia nie mogą być wcześniejsze niż rozpoczęcia.');
    return { ok:false };
  }
  if ((end - start) < TWO_H) {
    msg('Wydarzenie nie może być krótsze niż 2 godziny.');
    return { ok:false };
  }

  // 5) Całość nie dłuższa niż 4 dni → jeśli dłuższa, zapytaj, czy na pewno
  const FOUR_D = 4 * 24 * 60 * 60 * 1000;
  if ((end - start) > FOUR_D) {
    const go = confirm('Wydarzenie trwa dłużej niż 4 dni. Czy na pewno tak ma być?');
    if (!go) return { ok:false };
  }

  // 6) Link – format + próba sprawdzenia istnienia
  const link = $id('f_link').value.trim();
  if (link) {
    const exists = await checkUrlExists(link);
    if (exists === false) {
      msg('Podany link wygląda na nieistniejący. Sprawdź adres strony.');
      return { ok:false };
    }
    if (exists === 'unknown') {
      const go = confirm('Nie udało się potwierdzić istnienia strony (CORS). Czy mimo to wysłać?');
      if (!go) return { ok:false };
    }
  }

  return { ok:true };
}

function clearForm() {
  $id('f_name').value = '';
  $id('f_addr').value = '';
  $id('f_dow').value  = '';
  setDefaults();
  $id('f_fee').value = '';
  $id('f_org').value = '';
  $id('f_tdj').value = '';
  $id('f_music').value = '';
  $id('f_link').value = '';
  $id('f_info').value = '';
}

function bindForm() {
  // koperta (panel) otwiera modal – mamy też „bezpiecznik” w HTML (krok 3)
  const emailPanel = document.getElementById('emailPanel');
  if (emailPanel) emailPanel.addEventListener('click', (e)=>{ e.stopPropagation(); openSubmitModal(); });

  // przyciski modala
  $id('submitCloseBtn').addEventListener('click', closeSubmitModal);
  $id('submitCancelBtn').addEventListener('click', closeSubmitModal);
  $id('hintCloseBtn').addEventListener('click', closeHint);

  // podpowiedzi
  document.querySelectorAll('#submitModal a.hint').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      openHint(a.dataset.name || 'Podpowiedź');
    });
  });

  // wysyłka
$id('submitSendBtn').addEventListener('click', async ()=>{
  const payload = getPayload();
  if (!payload) return;

  // ← tu wpinamy walidację:
  const v = await validateBeforeSubmit();
  if (!v.ok) return;

  // blokada przycisku na czas wysyłki
  const btn = $id('submitSendBtn');
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = 'Wysyłanie…';

  try {
    await submitEvent(payload);
    (window.showMessage ? showMessage : alert)(
      'Dziękujemy! Zgłoszenie zapisane — po weryfikacji pojawi się na mapie.'
    );
    closeSubmitModal();
    clearForm();
  } catch(e) {
    console.error(e);
    (window.showMessage ? showMessage : alert)(
      'Nie udało się zapisać. Spróbuj ponownie.'
    );
  } finally {
    btn.disabled = false; btn.textContent = old;
  }
});

