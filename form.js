// === KONFIGURACJA ===
const SUBMIT_API = 'https://script.google.com/macros/s/AKfycbyAscSbg-RLfqu9qmLUGpQeOpo7G3vybQTuz2oNGpNc01swtwoJelKze4kwsMFaxmULwg/exec'; // patrz krok 5

// === POMOCNIKI ===
const $id = (x) => document.getElementById(x);
const pad2 = (n) => n.toString().padStart(2, '0');
const makeDateTime = (d, h, m) => d ? `${d} ${pad2(h)}:${pad2(m)}` : ''; // "YYYY-MM-DD HH:MM"

// Teksty podpowiedzi dla linków (kliknięcie nazwy pola)
const HINTS = {
  'Nazwa wydarzenia': 'Podaj nazwę tak, by uczestnicy łatwo rozpoznali wydarzenie i mogli je odnaleźć w sieci. (obowiązkowe)',
  'Adres*': 'Pełny adres (nazwa np. knajpy, ulica, numer, miasto, kraj). Najlepiej najpierw odszukaj dokładnie miejsce na mapie Google, a nstępnie skopiuj adres tego miejsca. Dzięki temu łatwiej wyznaczyć trasę. (obowiązkowe)',
  'Dzień tygodnia': 'Jeśli wydarzenie jest cykliczne, wybierz dzień tygodnia w którym jest organizowane (np. środa). Zostaw puste dla jednorazowych. Cykliczne wydarzenia miesięczne czy kwartalne rejestrujemy jako oddzielne.',
  'Data od': 'Data rozpoczęcia wydarzenia. (obowiązkowe)',
  'Godzina od': 'Godzina rozpoczęcia. (obowiązkowe)',
  'Data do': 'Data zakończenia, jeżeli wydarzenie ma zakończyć się choćby minutę po północy to wskaż już kolejny dzień. (obowiązkowe)',
  'Godzina do*': 'Godzina zakończenia. 59 uzyj tylko wtedy kiedy wydarzenie kończy się o północy. (obowiązkowe)',
  'Parkietowe': 'Wpisz cenę biletu wraz z walutą (np. 35-50 Euro, 40 zł) lub „free”.',
  'Organizator': 'Nazwa organizatora lub imię i nazwisko (może być kilka osób).',
  'TDj': 'Imię i nazwisko/nick DJ-a (jeśli znany) Nie dopisuj "DJ" czy "TDJ".',
  'Typ muzyki': 'Np. klasyczna / nuevo / alternatywna / mix.',
  'Link': 'Link do wydarzenia/strony (FB, WWW itp.). (obowiązkowe)',
  'Informacja': 'Krótki opis: ważne szczegóły, dress code, parking, zapisy itd. Max 2-3 zdnia pisane jedno po drugim w jednej linii.'
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
  const mins  = [0, 15, 30, 45, 59];
  const sFH = $id('f_from_h'), sFM = $id('f_from_m');
  const sTH = $id('f_to_h'),   sTM = $id('f_to_m');
  sFH.innerHTML = hours.map(h=>`<option>${h}</option>`).join('');
  sTH.innerHTML = hours.map(h=>`<option>${h}</option>`).join('');
  sFM.innerHTML = mins.map(m=>`<option>${m}</option>`).join('');
  sTM.innerHTML = mins.map(m=>`<option>${m}</option>`).join('');
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

    try {
      await submitEvent(payload);
      window.showMessage?.('Dziękujemy! Zgłoszenie zapisane — po weryfikacji pojawi się na mapie.');
      closeSubmitModal();
      clearForm();
    } catch(e) {
      window.showMessage?.('Nie udało się zapisać. Spróbuj ponownie za chwilę.');
      console.error(e);
    }
  });

  // pierwsze uruchomienie
  fillSelects();
  setDefaults();

  // eksport funkcji otwierającej (używana w kroku 3)
  window.openSubmitModal = openSubmitModal;
}

// start po załadowaniu DOM
document.addEventListener('DOMContentLoaded', bindForm);
