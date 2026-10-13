import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
//#region ja-JP/getting-started.md
var __pageData = JSON.parse("{\"title\":\"はじめに\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"ja-JP/getting-started.md\",\"filePath\":\"ja-JP/getting-started.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "ja-JP/getting-started.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="はじめに" tabindex="-1">はじめに <a class="header-anchor" href="#はじめに" aria-label="Permalink to “はじめに”">​</a></h1><h2 id="必要条件" tabindex="-1">必要条件 <a class="header-anchor" href="#必要条件" aria-label="Permalink to “必要条件”">​</a></h2><ul><li>Docker Desktopと、<code>docker compose</code>コマンドで利用できるDocker Compose v2。</li><li>ルートのスクリプトを実行するためのNode.js 24以降とnpm。</li></ul><h2 id="環境を起動する" tabindex="-1">環境を起動する <a class="header-anchor" href="#環境を起動する" aria-label="Permalink to “環境を起動する”">​</a></h2><p>リポジトリをクローンして、プロジェクトのディレクトリに移動します。</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#6F42C1",
		"--shiki-dark": "#B392F0"
	})}">git</span><span style="${ssrRenderStyle({
		"--shiki-light": "#032F62",
		"--shiki-dark": "#9ECBFF"
	})}"> clone</span><span style="${ssrRenderStyle({
		"--shiki-light": "#032F62",
		"--shiki-dark": "#9ECBFF"
	})}"> https://github.com/Seliganessecodigo/ABP-3DSM.git</span></span>
<span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#005CC5",
		"--shiki-dark": "#79B8FF"
	})}">cd</span><span style="${ssrRenderStyle({
		"--shiki-light": "#032F62",
		"--shiki-dark": "#9ECBFF"
	})}"> ABP-3DSM</span></span></code></pre></div><p>サンプルからローカル設定を作成します。</p><div class="language-powershell"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">powershell</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#005CC5",
		"--shiki-dark": "#79B8FF"
	})}">Copy-Item</span><span style="${ssrRenderStyle({
		"--shiki-light": "#24292E",
		"--shiki-dark": "#E1E4E8"
	})}"> .env.example .env</span></span></code></pre></div><p>macOSまたはLinuxの場合:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#6F42C1",
		"--shiki-dark": "#B392F0"
	})}">cp</span><span style="${ssrRenderStyle({
		"--shiki-light": "#032F62",
		"--shiki-dark": "#9ECBFF"
	})}"> .env.example</span><span style="${ssrRenderStyle({
		"--shiki-light": "#032F62",
		"--shiki-dark": "#9ECBFF"
	})}"> .env</span></span></code></pre></div><p>フロントエンド、API、PostgreSQLを起動します。</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
		"--shiki-light": "#24292e",
		"--shiki-dark": "#e1e4e8",
		"--shiki-light-bg": "#fff",
		"--shiki-dark-bg": "#24292e"
	})}" tabindex="0" dir="ltr"><code><span class="line"><span style="${ssrRenderStyle({
		"--shiki-light": "#6F42C1",
		"--shiki-dark": "#B392F0"
	})}">npm</span><span style="${ssrRenderStyle({
		"--shiki-light": "#032F62",
		"--shiki-dark": "#9ECBFF"
	})}"> run</span><span style="${ssrRenderStyle({
		"--shiki-light": "#032F62",
		"--shiki-dark": "#9ECBFF"
	})}"> dev</span></span></code></pre></div><p>Composeがコンテナ内に依存関係をインストールします。未適用のマイグレーションはAPI起動前に実行されます。APIは起動時にアプリケーションの検出を試みます。Aggregatorが利用できない場合はエラーをログに記録して起動を続けます。</p><h2 id="ローカルアドレス" tabindex="-1">ローカルアドレス <a class="header-anchor" href="#ローカルアドレス" aria-label="Permalink to “ローカルアドレス”">​</a></h2><table tabindex="0"><thead><tr><th>サービス</th><th>アドレス</th></tr></thead><tbody><tr><td>フロントエンド</td><td><code>http://localhost:5173</code></td></tr><tr><td>API</td><td><code>http://localhost:3000</code></td></tr><tr><td>OpenAPI</td><td><code>http://localhost:3000/docs</code></td></tr><tr><td>APIヘルスチェック</td><td><code>http://localhost:3000/health</code></td></tr><tr><td>PostgreSQL</td><td>localhost:5432</td></tr></tbody></table><h2 id="よく使うコマンド" tabindex="-1">よく使うコマンド <a class="header-anchor" href="#よく使うコマンド" aria-label="Permalink to “よく使うコマンド”">​</a></h2><table tabindex="0"><thead><tr><th>コマンド</th><th>操作</th></tr></thead><tbody><tr><td><code>npm run dev:detached</code></td><td>サービスをバックグラウンドで起動</td></tr><tr><td><code>npm run dev:logs</code></td><td>サービスログを表示</td></tr><tr><td><code>npm run dev:down</code></td><td>データボリュームを残してコンテナを停止</td></tr><tr><td><code>docker compose up --build</code></td><td>イメージを再ビルド</td></tr></tbody></table><p>APIを再起動せず検出を再実行するには、<code>docker compose exec api npm run applications:discover</code>を実行します。</p><h2 id="よくある問題" tabindex="-1">よくある問題 <a class="header-anchor" href="#よくある問題" aria-label="Permalink to “よくある問題”">​</a></h2><ul><li>Dockerが見つからない場合はDocker Desktopを起動し、<code>docker compose version</code>を確認してください。</li><li>ポートが使用中の場合は、<code>.env</code>の<code>FRONTEND_PORT</code>、<code>API_PORT</code>、<code>POSTGRES_PORT</code>を変更してください。</li><li>APIが正常にならない場合は<code>npm run dev:logs</code>を確認してください。APIはPostgreSQLに依存し、起動時にマイグレーションを実行します。</li><li><code>.env.example</code>の値はローカル開発専用です。実際の認証情報や<code>.env</code>ファイルを共有・コミットしないでください。</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("ja-JP/getting-started.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var getting_started_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, getting_started_default as default };
