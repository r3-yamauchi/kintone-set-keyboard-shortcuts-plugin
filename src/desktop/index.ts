

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
} as const;

type ScreenId = keyof typeof SCREEN_ACTIONS;
type ActionId = typeof SCREEN_ACTIONS[ScreenId][number];

const EVENT_MAP: Record<ScreenId, string[]> = {
  index: ['app.record.index.show'],
  record: ['app.record.detail.show', 'app.record.edit.show'],
  create: ['app.record.create.show']
};

type Settings = {
  [key in ScreenId]?: {
    [key: string]: boolean;
  };
};

(function (PLUGIN_ID) {
  function createDefaultSettings(): Settings {
    const base: Settings = {};
    const screenIds = Object.keys(SCREEN_ACTIONS) as ScreenId[];
    for (const screenId of screenIds) {
      const actionIds = SCREEN_ACTIONS[screenId];
      const actionDefaults: Record<string, boolean> = {};
      for (const actionId of actionIds) {
        actionDefaults[actionId] = true;
      }
      base[screenId] = actionDefaults;
    }
    return base;
  }

  function loadSettings(): Settings {
    const defaults = createDefaultSettings();
    const rawConfig = kintone.plugin.app.getConfig(PLUGIN_ID) || {};

    if (!rawConfig[CONFIG_KEY]) {
      return defaults;
    }

    try {
      const parsed = JSON.parse(rawConfig[CONFIG_KEY]);
      const screenIds = Object.keys(SCREEN_ACTIONS) as ScreenId[];

      for (const screenId of screenIds) {
        const storedActions = parsed[screenId];
        if (!storedActions) {
          continue;
        }

        const actionIds = SCREEN_ACTIONS[screenId];
        for (const actionId of actionIds) {
          if (Object.prototype.hasOwnProperty.call(storedActions, actionId)) {
            // Ensure defaults[screenId] exists (it should from createDefaultSettings)
            if (defaults[screenId]) {
              defaults[screenId]![actionId] = Boolean(storedActions[actionId]);
            }
          }
        }
      }
    } catch (error) {
      console.warn('ショートカット設定の読み込みに失敗', error);
    }
    return defaults;
  }

  function composePayload(actionSettings: Record<string, boolean>, actionIds: readonly string[]) {
    let allEnabled = true;
    let allDisabled = true;
    const payload: Record<string, boolean> = {};

    for (const actionId of actionIds) {
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

  async function applyShortcuts(screenId: ScreenId, settings: Settings) {
    const actionIds = SCREEN_ACTIONS[screenId];
    if (!actionIds) {
      return;
    }

    const screenSettings = settings[screenId] || {};
    const payload = composePayload(screenSettings, actionIds);

    try {
      await kintone.setKeyboardShortcuts(payload);
    } catch (error) {
      console.error(`ショートカット設定の適用に失敗しました (${screenId})`, error);
    }
  }

  function registerEventHandlers(settings: Settings) {
    const screenIds = Object.keys(EVENT_MAP) as ScreenId[];
    for (const screenId of screenIds) {
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
