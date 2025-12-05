// App.tsx: プラグイン設定画面のReactコンポーネント。ショートカット有効/無効を画面別に切り替えるUIを提供する。
// どこで: プラグインの設定ページ内でレンダリングされ、kintoneのプラグインIDを受け取って動作する。
// なぜ: 設定値を視覚的に編集し、利用者が安全に保存できるようにするため。
import { getPluginConfig, setPluginConfig } from "../helpers/plugin.ts";
import { useState, useEffect } from "react";

type Action = {
  id: string;
  shortcut: string;
  description: string;
};

type ScreenDefinition = {
  id: string;
  title: string;
  description: string;
  actions: Action[];
};

const SCREEN_DEFINITIONS: ScreenDefinition[] = [
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

type Settings = {
  [screenId: string]: {
    [actionId: string]: boolean;
  };
};

type Props = {
  pluginId: string;
};

function App({ pluginId }: Props) {
  // settings: 画面ID→アクションID→有効/無効 のマップ。チェックボックス状態と双方向バインド。
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    // 初回マウント時に保存済み設定を読み込み、未設定部分はデフォルトtrueで埋める。
    const config = getPluginConfig(pluginId);
    const rawSettings = config.shortcutSettings;

    const defaultSettings: Settings = {};
    SCREEN_DEFINITIONS.forEach(screen => {
      defaultSettings[screen.id] = {};
      screen.actions.forEach(action => {
        defaultSettings[screen.id][action.id] = true;
      });
    });

    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings);
        // 保存済み設定をデフォルトへマージし、未設定のアクションは安全側で有効にしておく。
        SCREEN_DEFINITIONS.forEach(screen => {
          if (parsed[screen.id]) {
            screen.actions.forEach(action => {
              if (parsed[screen.id][action.id] !== undefined) {
                defaultSettings[screen.id][action.id] = parsed[screen.id][action.id];
              }
            });
          }
        });
      } catch (e) {
        // パース失敗時はデフォルト設定にフォールバックして動作継続する。
        console.warn('設定の読み込みに失敗しました', e);
      }
    }
    setSettings(defaultSettings);
  }, [pluginId]);

  // 単一アクションのトグル更新。screenId/actionIdをキーにimmutableに状態更新。
  const handleToggle = (screenId: string, actionId: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [screenId]: {
        ...prev[screenId],
        [actionId]: checked
      }
    }));
  };

  // 画面内の全アクションをまとめてON/OFFするマスター切り替え。
  const handleMasterToggle = (screenId: string, checked: boolean) => {
    setSettings(prev => {
      const newScreenSettings = { ...prev[screenId] };
      SCREEN_DEFINITIONS.find(s => s.id === screenId)?.actions.forEach(action => {
        newScreenSettings[action.id] = checked;
      });
      return {
        ...prev,
        [screenId]: newScreenSettings
      };
    });
  };

  // JSON文字列として保存し、kintoneの設定保存完了後に設定画面一覧へ戻す。
  const handleSave = async () => {
    await setPluginConfig({ shortcutSettings: JSON.stringify(settings) });
    alert('設定を保存しました。アプリの設定を更新すると反映されます。');
    window.location.href = `../../flow?app=${kintone.app.getId()}`;
  };

  // 変更を破棄してプラグイン一覧へ戻る。
  const handleCancel = () => {
    window.location.href = `../../${kintone.app.getId()}/plugin/`;
  };

  return (
    <div className="shortcut-config">
      <div className="shortcut-config__header">
        <h1 className="shortcut-config__title">ショートカットキー ON/OFF 設定</h1>
        <p className="shortcut-config__lead">
          kintoneアプリの各画面でショートカットキーの有効・無効を切り替えます。
        </p>
      </div>

      <div className="shortcut-config__main">
        {SCREEN_DEFINITIONS.map(screen => {
          const screenSettings = settings[screen.id] || {};
          const allChecked = screen.actions.every(action => screenSettings[action.id]);
          const someChecked = screen.actions.some(action => screenSettings[action.id]);
          const isIndeterminate = someChecked && !allChecked;

          return (
            <article key={screen.id} className="shortcut-config__screen">
              <div className="shortcut-config__screen-header">
                <div>
                  <h2 className="shortcut-config__screen-title">{screen.title}</h2>
                  <p className="shortcut-config__screen-description">{screen.description}</p>
                </div>
                <label className="shortcut-config__toggle">
                  <input
                    type="checkbox"
                    className="shortcut-config__toggle-input"
                    checked={allChecked}
                    ref={el => {
                      // 全選択のチェック状態に応じて中間状態を反映し、UIの誤解を防ぐ。
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleMasterToggle(screen.id, e.target.checked)}
                  />
                  一括で有効にする
                </label>
              </div>

              <table className="shortcut-config__table">
                <thead>
                  <tr>
                    <th>ショートカット</th>
                    <th>操作</th>
                    <th>有効設定</th>
                  </tr>
                </thead>
                <tbody>
                  {screen.actions.map(action => (
                    <tr key={action.id}>
                      <td className="shortcut-config__shortcut-key">{action.shortcut}</td>
                      <td>{action.description}</td>
                      <td>
                        <label className="shortcut-config__toggle">
                          <input
                            type="checkbox"
                            className="shortcut-config__toggle-input"
                            checked={screenSettings[action.id] || false}
                            onChange={(e) => handleToggle(screen.id, action.id, e.target.checked)}
                          />
                          有効にする
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          );
        })}
      </div>

      <div className="shortcut-config__footer">
        <button
          type="button"
          className="shortcut-config__button shortcut-config__button--secondary"
          onClick={handleCancel}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="shortcut-config__button shortcut-config__button--primary"
          onClick={handleSave}
        >
          保存する
        </button>
      </div>
    </div>
  );
}

export default App;
