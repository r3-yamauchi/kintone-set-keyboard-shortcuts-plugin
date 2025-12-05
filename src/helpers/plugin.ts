// plugin.ts: プラグイン設定の読み書きを一元化し、UI層からkintone API呼び出しを分離するためのヘルパー集。
// どこで: 設定画面とデスクトップ処理双方から利用される共通モジュール。
// なぜ: 設定形式の変更や非同期処理を一箇所で制御し、変更影響を最小化するため。

// 設定値の入れ物。必要に応じて項目を追加する際は設定画面・デスクトップ双方で型を共有する。
export type PluginConfig = {
  shortcutSettings?: string;
};

// プロキシ設定の型。kintone標準のvalue1,value2に対応。
export type PluginProxyConfig = {
  headers: {
    value1?: string;
  };
  data: {
    value1?: string;
  };
};

export const getPluginConfig = (pluginId: string): PluginConfig => {
  // 指定プラグインIDの設定値をkintoneからそのまま取得する。
  return kintone.plugin.app.getConfig(pluginId);
};

export const setPluginConfig = async (config: PluginConfig) => {
  // kintone標準のsetConfigはコールバック型のため、Promise化して呼び出し側をシンプルにする。
  return new Promise<void>((resolve) => {
    kintone.plugin.app.setConfig(config, () => resolve());
  });
};

export const getPluginProxyConfig = (
  url: Parameters<typeof kintone.plugin.app.getProxyConfig>[0],
  method: Parameters<typeof kintone.plugin.app.getProxyConfig>[1],
): PluginProxyConfig | null => {
  // プロキシ設定を取得し、存在しなければnullを返す薄いラッパー。
  return kintone.plugin.app.getProxyConfig(url, method);
};

export const setPluginProxyConfig = async (
  url: Parameters<typeof kintone.plugin.app.setProxyConfig>[0],
  method: Parameters<typeof kintone.plugin.app.setProxyConfig>[1],
  pluginProxyConfig: PluginProxyConfig,
) => {
  // プロキシ設定の登録もPromise化して非同期処理の扱いを統一する。
  return new Promise<void>((resolve) => {
    kintone.plugin.app.setProxyConfig(
      url,
      method,
      pluginProxyConfig.headers,
      pluginProxyConfig.data,
      () => resolve(),
    );
  });
};
