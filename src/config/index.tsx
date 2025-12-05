// index.tsx: 設定画面をkintoneプラグイン領域にマウントするエントリーポイント。
// どこで: kintoneのプラグイン設定ページに組み込まれたルート要素へReactを描画する。
// なぜ: DOMの初期化とアプリケーションコンポーネントの分離で、描画失敗時の原因箇所を明確にするため。
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./51-modern-default.css";
import "./style.css";
import App from "./App.tsx";

const rootElementId = "kintone-plugin-template-root";
const rootElement = document.getElementById(rootElementId);
if (!rootElement) {
  // ビルドやテンプレート変更でroot要素が欠損した場合に早期に気付けるよう例外化。
  throw new Error(`root element (#${rootElementId}) not found`);
}

createRoot(rootElement).render(
  <StrictMode>
    {/* kintoneが提供するプラグインIDをPropsとして設定画面に渡す */}
    <App pluginId={kintone.$PLUGIN_ID} />
  </StrictMode>,
);
