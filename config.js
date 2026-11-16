// API_URL: máy chủ Apps Script (…/exec). Chạy thử trên máy (localhost) thì dùng '/api' của dev_server.
window.APP_CONFIG = {
  API_URL: /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '/api' : 'https://script.google.com/macros/s/AKfycbynsYNju_H3ibhdGSa5fUwrNCZ-8sUGJ5VVLWD_GptbTCoNNr0Ba9imbhnb3kJIrIxO/exec',
  APP_NAME: 'HR Analytics',
};
