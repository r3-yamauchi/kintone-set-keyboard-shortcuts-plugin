// desktop/index.ts: kintoneアプリ画面でショートカット設定を読み込み、該当イベントで適用するエントリーポイント。
// どこで: レコード一覧/詳細/作成画面の表示イベントフック内で実行される。
// なぜ: 設定画面で保存した有効/無効を実際の画面操作に反映させるため。

// 設定値が保存されるconfigキー。設定画面と共有しているので、変更時は双方を揃えること。
const CONFIG_KEY = 'shortcutSettings';

// 画面ごとに許可されるアクションIDのリスト。
// kintone側でショートカットの割り当てが増減した際はここを更新する。
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

// 画面ごとにショートカットを適用するタイミングとなるイベント名。
// イベント配列を分けておくことで、画面追加にも柔軟に対応できる。
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
  // 初期値をすべてtrueで生成し、設定が存在しない場合の安全なデフォルトとする。
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

  // プラグイン設定からJSONを読み込み、未設定はデフォルトで補完する。
  // 異常な値が入っていてもアプリを止めずにデフォルトへフォールバックする防御的実装。
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
            // createDefaultSettingsで生成されたデフォルトを上書きすることで、安全に保存値を優先する。
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

  // kintone.setKeyboardShortcutsに渡すペイロードを生成。
  // すべてtrue/falseならシンプルなbooleanに圧縮し、混在時のみ詳細マップを返す。
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

  // 指定画面の設定を読み込み、kintoneへ適用する。
  // 非同期失敗時はコンソールにのみ出力し、ユーザー操作をブロックしない。
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

  // 画面ごとに表示イベントへハンドラを登録し、表示のたびに最新設定を適用する。
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
  // 登録後はイベント発火のタイミングでapplyShortcutsが逐次実行される。
  registerEventHandlers(settings);

})(kintone.$PLUGIN_ID);
