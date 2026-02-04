// Основная логика приложения: навигация, CRUD, поиск, статистика, валидация.
// Этот файл связывает чистую логику данных (filesystem.js, storage.js) и DOM (ui.js).


var fsTree = null;
var currentFolderId = 'root';

var btnCreateFile = document.getElementById('btn-create-file');
var btnCreateFolder = document.getElementById('btn-create-folder');
var btnSearch = document.getElementById('btn-search');
var btnStats = document.getElementById('btn-stats');

function init() {
  fsTree = loadFS();
  if (!fsTree || fsTree.type !== 'folder') {
    fsTree = createRoot();
    saveFS(fsTree);
  }
  currentFolderId = 'root';

  attachHandlers();
  renderCurrentState();
}

function attachHandlers() {
  if (btnCreateFile) {
    btnCreateFile.addEventListener('click', function () {
      openModal('create-file', { parentId: currentFolderId });
    });
  }

  if (btnCreateFolder) {
    btnCreateFolder.addEventListener('click', function () {
      openModal('create-folder', { parentId: currentFolderId });
    });
  }

  if (btnSearch) {
    btnSearch.addEventListener('click', function () {
      openModal('search-input', {});
    });
  }

  if (btnStats) {
    btnStats.addEventListener('click', function () {
      var stats = countStats(fsTree);
      openModal('stats', stats);
    });
  }

  // Глобальные обработчики для ui.js
  window.handleOpenFolder = function (id) {
    currentFolderId = id;
    renderCurrentState();
  };

  window.handleOpenFile = function (id) {
    var file = findById(id, fsTree);
    if (!file || file.type !== 'file') return;
    openModal('edit-file', {
      id: file.id,
      name: file.name,
      content: file.content || '',
    });
  };

  window.handlePathClick = function (id) {
    currentFolderId = id;
    renderCurrentState();
  };

  window.handleCreateFile = function (payload) {
    var name = (payload.name || '').trim();
    var content = payload.content || '';
    var parentId = payload.parentId || currentFolderId;
    var errorEl = payload.errorEl;

    var validationError = validateNameInFolder(parentId, name);
    if (validationError) {
      showError(errorEl, validationError);
      return;
    }

    var file = createFile(name, content);
    addItem(parentId, file, fsTree);
    saveFS(fsTree);
    closeModal();
    renderCurrentState();
  };

  window.handleCreateFolder = function (payload) {
    var name = (payload.name || '').trim();
    var parentId = payload.parentId || currentFolderId;
    var errorEl = payload.errorEl;

    var validationError = validateNameInFolder(parentId, name);
    if (validationError) {
      showError(errorEl, validationError);
      return;
    }

    var folder = createFolder(name);
    addItem(parentId, folder, fsTree);
    saveFS(fsTree);
    closeModal();
    renderCurrentState();
  };

  window.handleRename = function (payload) {
    var id = payload.id;
    var newName = (payload.newName || '').trim();
    var errorEl = payload.errorEl;

    var parentInfo = findParentAndIndex(id, fsTree, null);
    if (!parentInfo || !parentInfo.parent) {
      return;
    }

    var parentFolder = parentInfo.parent;
    var validationError = validateNameInSpecificFolder(parentFolder, newName, id);
    if (validationError) {
      showError(errorEl, validationError);
      return;
    }

    renameItem(id, newName, fsTree);
    saveFS(fsTree);
    closeModal();
    renderCurrentState();
  };

  window.handleDelete = function (payload) {
    var id = payload.id;
    var name = payload.name;
    var type = payload.type;

    var confirmed = window.confirm(
      'Вы действительно хотите удалить ' +
        (type === 'folder' ? 'папку' : 'файл') +
        ' "' +
        name +
        '"?'
    );
    if (!confirmed) return;

    deleteItem(id, fsTree);
    saveFS(fsTree);

    if (currentFolderId === id) {
      currentFolderId = 'root';
    }

    renderCurrentState();
  };

  window.handleSaveFile = function (payload) {
    var id = payload.id;
    var content = payload.content || '';
    var file = findById(id, fsTree);
    if (!file || file.type !== 'file') return;

    file.content = content;
    saveFS(fsTree);
    closeModal();
    renderCurrentState();
  };

  window.handleSearchSubmit = function (payload) {
    var query = (payload.query || '').trim();
    if (!query) {
      return;
    }
    var results = searchByName(fsTree, query);
    openModal('search-results', { results: results });
  };

  window.handleOpenFromSearch = function (item) {
    if (item.type === 'folder') {
      currentFolderId = item.id;
      closeModal();
      renderCurrentState();
    } else {
      currentFolderId = item.parentId;
      renderCurrentState();
      closeModal();
      window.handleOpenFile(item.id);
    }
  };
}

function showError(errorEl, message) {
  if (!errorEl) {
    window.alert(message);
    return;
  }
  errorEl.textContent = message;
}

function validateNameInFolder(parentId, name) {
  if (!name) {
    return 'Имя не должно быть пустым.';
  }
  if (name.length > 20) {
    return 'Имя не должно быть длиннее 20 символов.';
  }

  var parent = findById(parentId, fsTree);
  if (!parent || parent.type !== 'folder') {
    return 'Текущая папка не найдена.';
  }

  var exists = (parent.children || []).some(function (child) {
    return child.name === name;
  });
  if (exists) {
    return 'Элемент с таким именем уже существует в этой папке.';
  }

  return null;
}

function validateNameInSpecificFolder(folder, name, excludeId) {
  if (!name) {
    return 'Имя не должно быть пустым.';
  }
  if (name.length > 20) {
    return 'Имя не должно быть длиннее 20 символов.';
  }

  var exists = (folder.children || []).some(function (child) {
    return child.name === name && child.id !== excludeId;
  });
  if (exists) {
    return 'Элемент с таким именем уже существует в этой папке.';
  }

  return null;
}

function buildPathArray(id) {
  var path = [];

  function walk(node, acc) {
    if (!node) return false;
    acc.push(node);
    if (node.id === id) {
      path = acc.slice();
      return true;
    }
    if (node.type === 'folder' && Array.isArray(node.children)) {
      for (var i = 0; i < node.children.length; i++) {
        if (walk(node.children[i], acc)) return true;
      }
    }
    acc.pop();
    return false;
  }

  walk(fsTree, []);

  if (!path.length) {
    path = [fsTree];
  }
  return path;
}

function renderCurrentState() {
  var folder = findById(currentFolderId, fsTree);
  if (!folder || folder.type !== 'folder') {
    currentFolderId = 'root';
    folder = fsTree;
  }

  var path = buildPathArray(folder.id);
  renderPath(path);
  renderFolder(folder);
}

function searchByName(node, query) {
  var results = [];
  var lowerQuery = query.toLowerCase();

  function walk(n, pathArr) {
    if (!n) return;
    var nextPath = pathArr.slice();
    if (n.type === 'folder') {
      nextPath.push(n.name);
    }

    if (n.name && n.name.toLowerCase().indexOf(lowerQuery) !== -1) {
      var pathStr = nextPath.join(' / ');
      if (n.type === 'file') {
        var parentPath = pathArr.slice();
        results.push({
          id: n.id,
          type: n.type,
          name: n.name,
          path: parentPath.concat([n.name]).join(' / '),
          parentId: pathArr._lastFolderId || findParentId(n.id),
        });
      } else {
        results.push({
          id: n.id,
          type: n.type,
          name: n.name,
          path: pathStr,
        });
      }
    }

    if (n.type === 'folder' && Array.isArray(n.children)) {
      for (var i = 0; i < n.children.length; i++) {
        walk(n.children[i], nextPath);
      }
    }
  }

  function findParentId(childId) {
    var info = findParentAndIndex(childId, fsTree, null);
    if (info && info.parent) {
      return info.parent.id;
    }
    return 'root';
  }

  walk(node, ['root']);
  return results;
}

document.addEventListener('DOMContentLoaded', init);

