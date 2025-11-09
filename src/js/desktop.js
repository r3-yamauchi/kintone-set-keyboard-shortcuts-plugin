(function(PLUGIN_ID) {
  'use strict';

  const CONFIG_KEY = 'shortcutSettings';

  const SCREEN_ACTIONS = {
    index: [
      'SHOW_RECORD',
      'FOCUS_SEARCH_BOX',
      'SHORTCUTS_HELP',
      'CREATE_RECORD',
      'EDIT_RECORD',
      'NEXT_RECORD',
      'PREVIOUS_RECORD',
      'NEXT_PAGE',
      'PREVIOUS_PAGE'
    ],
    record: [
      'FOCUS_SEARCH_BOX',
      'CANCEL_EDITING',
      'SHORTCUTS_HELP',
      'CREATE_RECORD',
      'EDIT_RECORD',
      'SHOW_VIEW',
      'SHOW_FILTER',
      'NEXT_RECORD',
      'PREVIOUS_RECORD',
      'SAVE_RECORD'
    ],
    create: [
      'FOCUS_SEARCH_BOX',
      'SHORTCUTS_HELP',
      'SAVE_RECORD'
    ]
  };

  const EVENT_MAP = {
    index: ['app.record.index.show'],
    record: ['app.record.detail.show', 'app.record.edit.show'],
    create: ['app.record.create.show']
  };

  function createDefaultSettings() {
    const base = {};
    const screenIds = Object.keys(SCREEN_ACTIONS);
    for (let screenIndex = 0; screenIndex < screenIds.length; screenIndex += 1) {
      const screenId = screenIds[screenIndex];
      const actionIds = SCREEN_ACTIONS[screenId];
      const actionDefaults = {};
      for (let actionIndex = 0; actionIndex < actionIds.length; actionIndex += 1) {
        actionDefaults[actionIds[actionIndex]] = true;
      }
      base[screenId] = actionDefaults;
    }
    return base;
  }

  function loadSettings() {
    const defaults = createDefaultSettings();
    const rawConfig = kintone.plugin.app.getConfig(PLUGIN_ID) || {};
    if (!rawConfig[CONFIG_KEY]) {
      return defaults;
    }
    try {
      const parsed = JSON.parse(rawConfig[CONFIG_KEY]);
      const screenIds = Object.keys(SCREEN_ACTIONS);
      for (let screenIndex = 0; screenIndex < screenIds.length; screenIndex += 1) {
        const screenId = screenIds[screenIndex];
        const storedActions = parsed[screenId];
        if (!storedActions) {
          continue;
        }
        const actionIds = SCREEN_ACTIONS[screenId];
        for (let actionIndex = 0; actionIndex < actionIds.length; actionIndex += 1) {
          const actionId = actionIds[actionIndex];
          if (Object.prototype.hasOwnProperty.call(storedActions, actionId)) {
            defaults[screenId][actionId] = Boolean(storedActions[actionId]);
          }
        }
      }
    } catch (error) {
      console.warn('ショートカット設定の読み込みに失敗', error);
    }
    return defaults;
  }

  function composePayload(actionSettings, actionIds) {
    let allEnabled = true;
    let allDisabled = true;
    const payload = {};

    for (let index = 0; index < actionIds.length; index += 1) {
      const actionId = actionIds[index];
      const enabled = Boolean(actionSettings[actionId]);
      payload[actionId] = enabled;
      if (enabled) {
        allDisabled = false;
      } else {
        allEnabled = false;
      }
    }

    if (allEnabled) {
      return true;
    }
    if (allDisabled) {
      return false;
    }
    return payload;
  }

  async function applyShortcuts(screenId, settings) {
    const actionIds = SCREEN_ACTIONS[screenId];
    if (!actionIds || actionIds.length === 0) {
      return;
    }
    const payload = composePayload(settings[screenId] || {}, actionIds);
    try {
      await kintone.setKeyboardShortcuts(payload);
    } catch (error) {
      console.error(`ショートカット設定の適用に失敗しました (${screenId})`, error);
    }
  }

  function registerEventHandlers(settings) {
    const screenIds = Object.keys(EVENT_MAP);
    for (let screenIndex = 0; screenIndex < screenIds.length; screenIndex += 1) {
      const screenId = screenIds[screenIndex];
      const events = EVENT_MAP[screenId];
      kintone.events.on(events, async (event) => {
        await applyShortcuts(screenId, settings);
        return event;
      });
    }
  }

  const settings = loadSettings();
  registerEventHandlers(settings);
})(kintone.$PLUGIN_ID);
