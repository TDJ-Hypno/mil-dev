// settings.js

// Funkcja wywoływana przy kliknięciu przycisku Ustawień
function handleSettingsClick() {
  // TODO: tu dodaj swoją logikę, np. otwarcie dialogu ustawień
  console.log('Kliknięto Ustawienia');
}

// Po załadowaniu DOM-u rejestrujemy listener
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('settingsPanel');
  if (btn) {
    btn.addEventListener('click', handleSettingsClick);
  }
});
