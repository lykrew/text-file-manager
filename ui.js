// Логика отображения и модальные окна (только DOM)


// Глобальные колбэки, которые задаёт script.js
window.handleOpenFolder = window.handleOpenFolder || function () {};
window.handleOpenFile = window.handleOpenFile || function () {};
window.handlePathClick = window.handlePathClick || function () {};
window.handleRename = window.handleRename || function () {};
window.handleDelete = window.handleDelete || function () {};
window.handleCreateFile = window.handleCreateFile || function () {};
window.handleCreateFolder = window.handleCreateFolder || function () {};
window.handleSaveFile = window.handleSaveFile || function () {};
window.handleSearchSubmit = window.handleSearchSubmit || function () {};
window.handleOpenFromSearch = window.handleOpenFromSearch || function () {};

var itemsContainer = document.getElementById('items-container');
var emptyStateEl = document.getElementById('empty-state');
var pathContainer = document.getElementById('path');

var modalBackdrop = document.getElementById('modal-backdrop');
var modalTitleEl = document.getElementById('modal-title');
var modalBodyEl = document.getElementById('modal-body');
var modalFooterEl = document.getElementById('modal-footer');
var modalCloseBtn = document.getElementById('modal-close');

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener('click', function (e) {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });
}

function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function renderFolder(folder) {
  if (!itemsContainer || !emptyStateEl) return;
  clearElement(itemsContainer);

  var children = (folder && folder.children) || [];

  if (!children.length) {
    emptyStateEl.classList.remove('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');

  children.forEach(function (child) {
    var card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.id = child.id;
    card.dataset.type = child.type;

    var header = document.createElement('div');
    header.className = 'item-card__header';

    var title = document.createElement('div');
    title.className = 'item-card__title';

    var icon = document.createElement('span');
    icon.className = 'item-card__icon';
    icon.textContent = child.type === 'folder' ? '📁' : '📄';

    var name = document.createElement('span');
    name.className = 'item-card__name';
    name.textContent = child.name;

    title.appendChild(icon);
    title.appendChild(name);

    var actions = document.createElement('div');
    actions.className = 'item-card__actions';

    var renameBtn = document.createElement('button');
    renameBtn.className = 'icon-btn';
    renameBtn.type = 'button';
    renameBtn.title = 'Переименовать';
    renameBtn.innerHTML = '✏️';

    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.type = 'button';
    deleteBtn.title = 'Удалить';
    deleteBtn.innerHTML = '🗑️';

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(title);
    header.appendChild(actions);

    var meta = document.createElement('div');
    meta.className = 'item-card__meta';
    if (child.type === 'file') {
      var length = (child.content || '').length;
      meta.textContent = 'Файл · ' + length + ' символов';
    } else {
      var count = (child.children || []).length;
      meta.textContent = 'Папка · ' + count + ' элементов';
    }

    card.appendChild(header);
    card.appendChild(meta);

    card.addEventListener('click', function () {
      if (child.type === 'folder') {
        window.handleOpenFolder(child.id);
      } else {
        window.handleOpenFile(child.id);
      }
    });

    renameBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openModal('rename', { id: child.id, name: child.name });
    });

    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      window.handleDelete({ id: child.id, name: child.name, type: child.type });
    });

    itemsContainer.appendChild(card);
  });
}

function renderPath(pathArray) {
  if (!pathContainer) return;
  clearElement(pathContainer);

  var breadcrumb = document.createElement('div');
  breadcrumb.className = 'breadcrumb';

  pathArray.forEach(function (node, index) {
    var item = document.createElement('span');
    item.textContent = node.name;
    item.className =
      'breadcrumb__item' +
      (index === pathArray.length - 1 ? ' breadcrumb__item--active' : '');

    if (index !== pathArray.length - 1) {
      item.addEventListener('click', function () {
        window.handlePathClick(node.id);
      });
    }

    breadcrumb.appendChild(item);

    if (index < pathArray.length - 1) {
      var sep = document.createElement('span');
      sep.textContent = '›';
      sep.className = 'breadcrumb__separator';
      breadcrumb.appendChild(sep);
    }
  });

  pathContainer.appendChild(breadcrumb);
}

function openModal(type, data) {
  if (!modalBackdrop) return;

  clearElement(modalBodyEl);
  clearElement(modalFooterEl);

  var primaryBtn = document.createElement('button');
  primaryBtn.className = 'btn primary';
  primaryBtn.type = 'button';

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Отмена';
  cancelBtn.addEventListener('click', closeModal);

  if (type === 'create-file') {
    modalTitleEl.textContent = 'Создать файл';

    var fieldName = document.createElement('div');
    fieldName.className = 'field';
    var labelName = document.createElement('label');
    labelName.textContent = 'Имя файла';
    var inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.maxLength = 20;
    inputName.autofocus = true;
    fieldName.appendChild(labelName);
    fieldName.appendChild(inputName);

    var fieldContent = document.createElement('div');
    fieldContent.className = 'field';
    var labelContent = document.createElement('label');
    labelContent.textContent = 'Содержимое';
    var textarea = document.createElement('textarea');
    fieldContent.appendChild(labelContent);
    fieldContent.appendChild(textarea);

    var errorEl = document.createElement('div');
    errorEl.className = 'field__error';

    modalBodyEl.appendChild(fieldName);
    modalBodyEl.appendChild(fieldContent);
    modalBodyEl.appendChild(errorEl);

    primaryBtn.textContent = 'Создать';
    primaryBtn.addEventListener('click', function () {
      window.handleCreateFile({
        parentId: data && data.parentId,
        name: inputName.value,
        content: textarea.value,
        errorEl: errorEl,
      });
    });

    modalFooterEl.appendChild(cancelBtn);
    modalFooterEl.appendChild(primaryBtn);
  } else if (type === 'create-folder') {
    modalTitleEl.textContent = 'Создать папку';

    var fField = document.createElement('div');
    fField.className = 'field';
    var fLabel = document.createElement('label');
    fLabel.textContent = 'Имя папки';
    var fInput = document.createElement('input');
    fInput.type = 'text';
    fInput.maxLength = 20;
    fInput.autofocus = true;
    fField.appendChild(fLabel);
    fField.appendChild(fInput);

    var fError = document.createElement('div');
    fError.className = 'field__error';

    modalBodyEl.appendChild(fField);
    modalBodyEl.appendChild(fError);

    primaryBtn.textContent = 'Создать';
    primaryBtn.addEventListener('click', function () {
      window.handleCreateFolder({
        parentId: data && data.parentId,
        name: fInput.value,
        errorEl: fError,
      });
    });

    modalFooterEl.appendChild(cancelBtn);
    modalFooterEl.appendChild(primaryBtn);
  } else if (type === 'rename') {
    modalTitleEl.textContent = 'Переименовать';

    var rField = document.createElement('div');
    rField.className = 'field';
    var rLabel = document.createElement('label');
    rLabel.textContent = 'Новое имя';
    var rInput = document.createElement('input');
    rInput.type = 'text';
    rInput.maxLength = 20;
    rInput.value = (data && data.name) || '';
    rInput.autofocus = true;
    rField.appendChild(rLabel);
    rField.appendChild(rInput);

    var rError = document.createElement('div');
    rError.className = 'field__error';

    modalBodyEl.appendChild(rField);
    modalBodyEl.appendChild(rError);

    primaryBtn.textContent = 'Сохранить';
    primaryBtn.addEventListener('click', function () {
      window.handleRename({
        id: data && data.id,
        newName: rInput.value,
        errorEl: rError,
      });
    });

    modalFooterEl.appendChild(cancelBtn);
    modalFooterEl.appendChild(primaryBtn);
  } else if (type === 'edit-file') {
    modalTitleEl.textContent = 'Редактирование файла';

    var efFieldName = document.createElement('div');
    efFieldName.className = 'field';
    var efLabelName = document.createElement('label');
    efLabelName.textContent = 'Имя файла';
    var efInputName = document.createElement('input');
    efInputName.type = 'text';
    efInputName.disabled = true;
    efInputName.value = (data && data.name) || '';
    efFieldName.appendChild(efLabelName);
    efFieldName.appendChild(efInputName);

    var efFieldContent = document.createElement('div');
    efFieldContent.className = 'field';
    var efLabelContent = document.createElement('label');
    efLabelContent.textContent = 'Содержимое';
    var efTextarea = document.createElement('textarea');
    efTextarea.value = (data && data.content) || '';
    efFieldContent.appendChild(efLabelContent);
    efFieldContent.appendChild(efTextarea);

    modalBodyEl.appendChild(efFieldName);
    modalBodyEl.appendChild(efFieldContent);

    primaryBtn.textContent = 'Сохранить';
    primaryBtn.addEventListener('click', function () {
      window.handleSaveFile({
        id: data && data.id,
        content: efTextarea.value,
      });
    });

    modalFooterEl.appendChild(cancelBtn);
    modalFooterEl.appendChild(primaryBtn);
  } else if (type === 'search-input') {
    modalTitleEl.textContent = 'Поиск';

    var sField = document.createElement('div');
    sField.className = 'field';
    var sLabel = document.createElement('label');
    sLabel.textContent = 'Имя файла или папки';
    var sInput = document.createElement('input');
    sInput.type = 'text';
    sInput.autofocus = true;
    sField.appendChild(sLabel);
    sField.appendChild(sInput);

    modalBodyEl.appendChild(sField);

    primaryBtn.textContent = 'Найти';
    primaryBtn.addEventListener('click', function () {
      window.handleSearchSubmit({ query: sInput.value });
    });

    modalFooterEl.appendChild(cancelBtn);
    modalFooterEl.appendChild(primaryBtn);
  } else if (type === 'search-results') {
    modalTitleEl.textContent = 'Результаты поиска';

    var results = (data && data.results) || [];

    if (!results.length) {
      var noRes = document.createElement('div');
      noRes.textContent = 'Ничего не найдено.';
      modalBodyEl.appendChild(noRes);
    } else {
      var list = document.createElement('div');
      list.className = 'search-results';

      results.forEach(function (item) {
        var el = document.createElement('div');
        el.className = 'search-result';

        var nameLine = document.createElement('div');
        nameLine.textContent =
          (item.type === 'folder' ? '📁 ' : '📄 ') + item.name;

        var pathLine = document.createElement('div');
        pathLine.className = 'search-result__path';
        pathLine.textContent = item.path;

        el.appendChild(nameLine);
        el.appendChild(pathLine);

        el.addEventListener('click', function () {
          window.handleOpenFromSearch(item);
        });

        list.appendChild(el);
      });

      modalBodyEl.appendChild(list);
    }

    modalFooterEl.appendChild(cancelBtn);
  } else if (type === 'stats') {
    modalTitleEl.textContent = 'Статистика';
    var s = data || {};

    var statsList = document.createElement('div');
    statsList.className = 'stats-list';

    var row1 = document.createElement('div');
    var r1l = document.createElement('span');
    var r1v = document.createElement('span');
    r1l.textContent = 'Файлов: ';
    r1v.textContent = s.files != null ? s.files : '—';
    row1.appendChild(r1l);
    row1.appendChild(r1v);

    var row2 = document.createElement('div');
    var r2l = document.createElement('span');
    var r2v = document.createElement('span');
    r2l.textContent = 'Папок: ';
    r2v.textContent = s.folders != null ? s.folders : '—';
    row2.appendChild(r2l);
    row2.appendChild(r2v);

    var row3 = document.createElement('div');
    var r3l = document.createElement('span');
    var r3v = document.createElement('span');
    r3l.textContent = 'Всего символов: ';
    r3v.textContent = s.totalChars != null ? s.totalChars : '—';
    row3.appendChild(r3l);
    row3.appendChild(r3v);

    var row4 = document.createElement('div');
    var r4l = document.createElement('span');
    var r4v = document.createElement('span');
    r4l.textContent = 'Самый большой файл: ';
    if (s.largestFile && s.largestFile.name) {
      r4v.textContent =
        s.largestFile.name + ' (' + s.largestFile.size + ' символов)';
    } else {
      r4v.textContent = '—';
    }
    row4.appendChild(r4l);
    row4.appendChild(r4v);

    statsList.appendChild(row1);
    statsList.appendChild(row2);
    statsList.appendChild(row3);
    statsList.appendChild(row4);

    modalBodyEl.appendChild(statsList);
    modalFooterEl.appendChild(cancelBtn);
  }

  modalBackdrop.classList.remove('hidden');
}

function closeModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.add('hidden');
}

