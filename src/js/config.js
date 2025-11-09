(function(PLUGIN_ID) {
  'use strict';

  const CONFIG_KEY = 'shortcutSettings';

  const SCREEN_DEFINITIONS = [
    {
      id: 'index',
      title: 'レコード一覧画面',
      description: '一覧で利用できるショートカットの有効／無効を制御します。',
      actions: [
        { id: 'SHOW_RECORD', shortcut: 'Enter / O', description: '選択したレコードの詳細を表示する' },
        { id: 'FOCUS_SEARCH_BOX', shortcut: '/', description: '検索キーワード入力欄にフォーカスする' },
        { id: 'SHORTCUTS_HELP', shortcut: '?', description: 'ショートカット一覧の表示を切り替える' },
        { id: 'CREATE_RECORD', shortcut: 'C', description: 'レコードを追加する' },
        { id: 'EDIT_RECORD', shortcut: 'E', description: '選択したレコードを編集する' },
        { id: 'NEXT_RECORD', shortcut: 'J', description: '次のレコードを選択する' },
        { id: 'PREVIOUS_RECORD', shortcut: 'K', description: '前のレコードを選択する' },
        { id: 'NEXT_PAGE', shortcut: 'N', description: '次のページを表示する' },
        { id: 'PREVIOUS_PAGE', shortcut: 'P', description: '前のページを表示する' }
      ]
    },
    {
      id: 'record',
      title: 'レコード詳細／編集画面',
      description: '詳細・編集画面共通のショートカットを設定します。',
      actions: [
        { id: 'FOCUS_SEARCH_BOX', shortcut: '/', description: '検索キーワード入力欄にフォーカスする' },
        { id: 'CANCEL_EDITING', shortcut: 'Esc', description: '編集をキャンセルする' },
        { id: 'SHORTCUTS_HELP', shortcut: '?', description: 'ショートカット一覧の表示を切り替える' },
        { id: 'CREATE_RECORD', shortcut: 'C', description: 'レコードを追加する' },
        { id: 'EDIT_RECORD', shortcut: 'E', description: 'レコードを編集する' },
        { id: 'SHOW_VIEW', shortcut: 'G → A', description: 'レコード一覧に戻る' },
        { id: 'SHOW_FILTER', shortcut: 'G → I', description: '絞り込み結果に戻る' },
        { id: 'NEXT_RECORD', shortcut: 'J', description: '次のレコードを選択する' },
        { id: 'PREVIOUS_RECORD', shortcut: 'K', description: '前のレコードを選択する' },
        { id: 'SAVE_RECORD', shortcut: 'Ctrl + S', description: '変更を保存する' }
      ]
    },
    {
      id: 'create',
      title: 'レコード追加／再利用画面',
      description: '新規作成・再利用画面で利用できるショートカットを設定します。',
      actions: [
        { id: 'FOCUS_SEARCH_BOX', shortcut: '/', description: '検索キーワード入力欄にフォーカスする' },
        { id: 'SHORTCUTS_HELP', shortcut: '?', description: 'ショートカット一覧の表示を切り替える' },
        { id: 'SAVE_RECORD', shortcut: 'Ctrl + S', description: '変更を保存する' }
      ]
    }
  ];

  const elements = {
    screenList: document.getElementById('shortcut-config-screens'),
    submit: document.getElementById('plugin-submit'),
    cancel: document.getElementById('plugin-cancel')
  };

  function createDefaultSettings() {
    const base = {};
    for (let screenIndex = 0; screenIndex < SCREEN_DEFINITIONS.length; screenIndex += 1) {
      const screen = SCREEN_DEFINITIONS[screenIndex];
      const defaultActions = {};
      for (let actionIndex = 0; actionIndex < screen.actions.length; actionIndex += 1) {
        const action = screen.actions[actionIndex];
        defaultActions[action.id] = true;
      }
      base[screen.id] = defaultActions;
    }
    return base;
  }

  function loadStoredSettings() {
    const base = createDefaultSettings();
    const rawConfig = kintone.plugin.app.getConfig(PLUGIN_ID) || {};
    try {
      if (!rawConfig[CONFIG_KEY]) {
        return base;
      }
      const parsed = JSON.parse(rawConfig[CONFIG_KEY]);
      for (let screenIndex = 0; screenIndex < SCREEN_DEFINITIONS.length; screenIndex += 1) {
        const screen = SCREEN_DEFINITIONS[screenIndex];
        const storedActions = parsed[screen.id];
        if (!storedActions) {
          continue;
        }
        for (let actionIndex = 0; actionIndex < screen.actions.length; actionIndex += 1) {
          const action = screen.actions[actionIndex];
          if (Object.prototype.hasOwnProperty.call(storedActions, action.id)) {
            base[screen.id][action.id] = Boolean(storedActions[action.id]);
          }
        }
      }
      return base;
    } catch (error) {
      console.warn('ショートカット設定の読み込みに失敗したため既定値を使用します。', error);
      return base;
    }
  }

  function findActionInputs(screenId) {
    return elements.screenList.querySelectorAll(`input[type="checkbox"][data-role="action"][data-screen="${screenId}"]`);
  }

  function findMasterInput(screenId) {
    return elements.screenList.querySelector(`input[type="checkbox"][data-role="master"][data-screen="${screenId}"]`);
  }

  function syncMasterState(screenId) {
    const masterInput = findMasterInput(screenId);
    if (!masterInput) {
      return;
    }
    const actionInputs = findActionInputs(screenId);
    let checkedCount = 0;
    let uncheckedCount = 0;

    for (let index = 0; index < actionInputs.length; index += 1) {
      if (actionInputs[index].checked) {
        checkedCount += 1;
      } else {
        uncheckedCount += 1;
      }
    }

    if (checkedCount > 0 && uncheckedCount > 0) {
      masterInput.checked = false;
      masterInput.indeterminate = true;
    } else {
      masterInput.indeterminate = false;
      masterInput.checked = checkedCount > 0;
    }
  }

  function handleMasterToggle(event) {
    const target = event.currentTarget;
    const screenId = target.dataset.screen;
    const actionInputs = findActionInputs(screenId);
    for (let index = 0; index < actionInputs.length; index += 1) {
      actionInputs[index].checked = target.checked;
    }
    target.indeterminate = false;
    syncMasterState(screenId);
  }

  function renderTableBody(screen, screenSettings) {
    const tbody = document.createElement('tbody');
    for (let index = 0; index < screen.actions.length; index += 1) {
      const action = screen.actions[index];
      const row = document.createElement('tr');

      const shortcutCell = document.createElement('td');
      shortcutCell.className = 'shortcut-config__shortcut-key';
      shortcutCell.textContent = action.shortcut;

      const descriptionCell = document.createElement('td');
      descriptionCell.textContent = action.description;

      const toggleCell = document.createElement('td');
      const label = document.createElement('label');
      label.className = 'shortcut-config__toggle';
      label.setAttribute('data-screen', screen.id);
      label.setAttribute('data-action', action.id);

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'shortcut-config__toggle-input';
      input.setAttribute('data-role', 'action');
      input.setAttribute('data-screen', screen.id);
      input.setAttribute('data-action', action.id);
      if (Object.prototype.hasOwnProperty.call(screenSettings, action.id)) {
        input.checked = Boolean(screenSettings[action.id]);
      } else {
        input.checked = true;
      }

      label.appendChild(input);
      label.appendChild(document.createTextNode('有効にする'));
      toggleCell.appendChild(label);

      input.addEventListener('change', () => {
        syncMasterState(screen.id);
      });

      row.appendChild(shortcutCell);
      row.appendChild(descriptionCell);
      row.appendChild(toggleCell);
      tbody.appendChild(row);
    }
    return tbody;
  }

  function renderScreen(screen, screenSettings) {
    const article = document.createElement('article');
    article.className = 'shortcut-config__screen';
    article.setAttribute('data-screen', screen.id);

    const header = document.createElement('div');
    header.className = 'shortcut-config__screen-header';

    const headerInfo = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'shortcut-config__screen-title';
    title.textContent = screen.title;

    const description = document.createElement('p');
    description.className = 'shortcut-config__screen-description';
    description.textContent = screen.description;

    headerInfo.appendChild(title);
    headerInfo.appendChild(description);

    const masterToggleLabel = document.createElement('label');
    masterToggleLabel.className = 'shortcut-config__toggle';

    const masterToggleInput = document.createElement('input');
    masterToggleInput.type = 'checkbox';
    masterToggleInput.className = 'shortcut-config__toggle-input';
    masterToggleInput.setAttribute('data-role', 'master');
    masterToggleInput.setAttribute('data-screen', screen.id);
    masterToggleInput.addEventListener('change', handleMasterToggle);

    masterToggleLabel.appendChild(masterToggleInput);
    masterToggleLabel.appendChild(document.createTextNode('一括で有効にする'));

    header.appendChild(headerInfo);
    header.appendChild(masterToggleLabel);

    const table = document.createElement('table');
    table.className = 'shortcut-config__table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const shortcutHeader = document.createElement('th');
    shortcutHeader.textContent = 'ショートカット';

    const descriptionHeader = document.createElement('th');
    descriptionHeader.textContent = '操作';

    const toggleHeader = document.createElement('th');
    toggleHeader.textContent = '有効設定';

    headerRow.appendChild(shortcutHeader);
    headerRow.appendChild(descriptionHeader);
    headerRow.appendChild(toggleHeader);
    thead.appendChild(headerRow);

    table.appendChild(thead);
    table.appendChild(renderTableBody(screen, screenSettings));

    article.appendChild(header);
    article.appendChild(table);

    elements.screenList.appendChild(article);
    syncMasterState(screen.id);
  }

  function renderSettings(settings) {
    elements.screenList.innerHTML = '';
    for (let index = 0; index < SCREEN_DEFINITIONS.length; index += 1) {
      const screen = SCREEN_DEFINITIONS[index];
      renderScreen(screen, settings[screen.id] || {});
    }
  }

  function collectSettings() {
    const settings = {};
    for (let screenIndex = 0; screenIndex < SCREEN_DEFINITIONS.length; screenIndex += 1) {
      const screen = SCREEN_DEFINITIONS[screenIndex];
      const actionInputs = findActionInputs(screen.id);
      const actionSettings = {};
      for (let actionIndex = 0; actionIndex < actionInputs.length; actionIndex += 1) {
        const input = actionInputs[actionIndex];
        const actionId = input.dataset.action;
        actionSettings[actionId] = input.checked;
      }
      settings[screen.id] = actionSettings;
    }
    return settings;
  }

  function handleSave(event) {
    event.preventDefault();
    const settings = collectSettings();
    const serialized = JSON.stringify(settings);
    kintone.plugin.app.setConfig({ [CONFIG_KEY]: serialized }, () => {
      alert('設定を保存しました。アプリの設定を更新すると反映されます。');
      window.location.href = `/k/admin/app/${kintone.app.getId()}/plugin/`;
    });
  }

  function handleCancel(event) {
    event.preventDefault();
    window.location.href = `/k/admin/app/${kintone.app.getId()}/plugin/`;
  }

  function initialize() {
    const settings = loadStoredSettings();
    renderSettings(settings);
    elements.submit.addEventListener('click', handleSave);
    elements.cancel.addEventListener('click', handleCancel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})(kintone.$PLUGIN_ID);
