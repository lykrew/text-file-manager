// Логика работы с древовидной файловой системой (без DOM и localStorage)

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createRoot() {
  return {
    id: 'root',
    name: 'root',
    type: 'folder',
    children: [],
  };
}

function createFolder(name) {
  return {
    id: generateId(),
    name,
    type: 'folder',
    children: [],
  };
}

function createFile(name, content) {
  return {
    id: generateId(),
    name,
    type: 'file',
    content: content || '',
    createdAt: new Date().toISOString(),
  };
}

function findById(id, node) {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.type === 'folder' && Array.isArray(node.children)) {
    for (var i = 0; i < node.children.length; i++) {
      var found = findById(id, node.children[i]);
      if (found) return found;
    }
  }
  return null;
}

function findParentAndIndex(id, node, parent) {
  if (!node || node.type !== 'folder' || !Array.isArray(node.children)) {
    return null;
  }
  for (var i = 0; i < node.children.length; i++) {
    var child = node.children[i];
    if (child.id === id) {
      return { parent: node, index: i };
    }
    if (child.type === 'folder') {
      var res = findParentAndIndex(id, child, node);
      if (res) return res;
    }
  }
  return null;
}

function addItem(parentId, item, fs) {
  var parent = findById(parentId, fs);
  if (!parent || parent.type !== 'folder') {
    return fs;
  }
  parent.children.push(item);
  return fs;
}

function deleteItem(id, fs) {
  if (id === 'root') {
    return fs;
  }
  var root = fs;
  var res = findParentAndIndex(id, root, null);
  if (res && res.parent && res.parent.children) {
    res.parent.children.splice(res.index, 1);
  }
  return root;
}

function renameItem(id, newName, fs) {
  var item = findById(id, fs);
  if (item && typeof newName === 'string' && newName.trim() !== '') {
    item.name = newName.trim();
  }
  return fs;
}

function countStats(node) {
  var stats = {
    files: 0,
    folders: 0,
    totalChars: 0,
    largestFile: null,
  };

  function walk(n) {
    if (!n) return;
    if (n.type === 'folder') {
      stats.folders += 1;
      if (Array.isArray(n.children)) {
        for (var i = 0; i < n.children.length; i++) {
          walk(n.children[i]);
        }
      }
    } else if (n.type === 'file') {
      stats.files += 1;
      var len = (n.content || '').length;
      stats.totalChars += len;
      if (!stats.largestFile || len > stats.largestFile.size) {
        stats.largestFile = {
          id: n.id,
          name: n.name,
          size: len,
        };
      }
    }
  }

  walk(node);
  return stats;
}

