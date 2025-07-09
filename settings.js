// settings.js

function handleSettingsClick() {
  // pokaż modal Ustawień
  document.getElementById('settingsModal').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  // istniejący listener na przycisk “Ustawienia”
  const btn = document.getElementById('settingsPanel');
  btn.addEventListener('click', handleSettingsClick);

  // zamknij modal po kliknięciu poza nim
  window.addEventListener('click', e => {
    const modal = document.getElementById('settingsModal');
    if (modal.style.display === 'block' && !modal.contains(e.target) && e.target.id !== 'settingsPanel') {
      modal.style.display = 'none';
    }
  });

  // tymczasowo: przycisk “Dodaj skrót” tylko wyświetla alert
  document.getElementById('addShortcutBtn')
    .addEventListener('click', () => alert('Tu uruchomisz kod tworzący skrót PWA'));
});
