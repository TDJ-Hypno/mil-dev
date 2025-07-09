// settings.js

// znajdź elementy
const btn   = document.getElementById('settingsPanel');
const modal = document.getElementById('settingsModal');

// 1) klik → pokaz
btn.addEventListener('click', () => {
  modal.style.display = 'block';
});

// 2) klik na obszar poza zawartością modala → ukryj
modal.addEventListener('click', e => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// 3) przycisk w modalu (na razie alert)
document.getElementById('addShortcutBtn')
  .addEventListener('click', () => alert('Dodaj skrót'));
