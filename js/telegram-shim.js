
// Minimal shim to allow running outside Telegram
export const Telegram = window.Telegram || {};
Telegram.WebApp = Telegram.WebApp || {
  initDataUnsafe: { user: { id: 1, first_name: 'Demo', username: 'demo_user' } },
  colorScheme: 'light',
  themeParams: {},
  MainButton: { show(){}, hide(){}, setText(){}, onClick(){} },
  HapticFeedback: { impactOccurred(){} },
  close(){ alert('WebApp closed (shim)'); }
};
window.Telegram = Telegram;
