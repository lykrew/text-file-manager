// Работа с localStorage (без DOM)

var STORAGE_KEY = 'text_fs_tree';

function saveFS(fs) {
  try {
    var serialized = JSON.stringify(fs);
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Не удалось сохранить файловую систему в localStorage', e);
  }
}

function loadFS() {
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      var root = createRoot();
      saveFS(root);
      return root;
    }
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      var freshRoot = createRoot();
      saveFS(freshRoot);
      return freshRoot;
    }
    return parsed;
  } catch (e) {
    console.error('Не удалось загрузить файловую систему из localStorage', e);
    var rootFallback = createRoot();
    saveFS(rootFallback);
    return rootFallback;
  }
}

