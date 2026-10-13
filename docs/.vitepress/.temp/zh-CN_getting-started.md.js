import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
//#region zh-CN/getting-started.md
var __pageData = JSON.parse("{\"title\":\"开始使用\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"zh-CN/getting-started.md\",\"filePath\":\"zh-CN/getting-started.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "zh-CN/getting-started.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="开始使用" tabindex="-1">开始使用 <a class="header-anchor" href="#开始使用" aria-label="Permalink to “开始使用”">​</a></h1><h2 id="环境要求" tabindex="-1">环境要求 <a class="header-anchor" href="#环境要求" aria-label="Permalink to “环境要求”">​</a></h2><ul><li>Docker Desktop，并通过 <code>docker compose</code> 命令使用 Docker Compose v2。</li><li>Node.js 24 或更高版本，以及用于执行根目录脚本的 npm。</li></ul><h2 id="启动环境" tabindex="-1">启动环境 <a class="header-anchor" href="#启动环境" aria-label="Permalink to “启动环境”">​</a></h2><p>克隆仓库并进入项目目录：</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> ABP-3DSM</span></span></code></pre></div><p>根据示例文件创建本地配置：</p><div class="language-powershell"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">powershell</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env.example .env</span></span></code></pre></div><p>macOS 或 Linux：</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env</span></span></code></pre></div><p>启动前端、API 和 PostgreSQL：</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> dev</span></span></code></pre></div><p>Compose 会在容器中安装依赖。API 启动前会运行待执行的迁移。API 启动时会尝试发现应用；如果聚合器不可用，API 会记录错误并继续启动。</p><h2 id="本地地址" tabindex="-1">本地地址 <a class="header-anchor" href="#本地地址" aria-label="Permalink to “本地地址”">​</a></h2><table tabindex="0"><thead><tr><th>服务</th><th>地址</th></tr></thead><tbody><tr><td>前端</td><td><code>http://localhost:5173</code></td></tr><tr><td>API</td><td><code>http://localhost:3000</code></td></tr><tr><td>OpenAPI</td><td><code>http://localhost:3000/docs</code></td></tr><tr><td>API 健康检查</td><td><code>http://localhost:3000/health</code></td></tr><tr><td>PostgreSQL</td><td>localhost:5432</td></tr></tbody></table><h2 id="常用命令" tabindex="-1">常用命令 <a class="header-anchor" href="#常用命令" aria-label="Permalink to “常用命令”">​</a></h2><table tabindex="0"><thead><tr><th>命令</th><th>操作</th></tr></thead><tbody><tr><td><code>npm run dev:detached</code></td><td>在后台启动服务</td></tr><tr><td><code>npm run dev:logs</code></td><td>持续查看服务日志</td></tr><tr><td><code>npm run dev:down</code></td><td>停止容器并保留数据卷</td></tr><tr><td><code>docker compose up --build</code></td><td>重新构建镜像</td></tr></tbody></table><p>无需重启 API 即可重新执行发现：<code>docker compose exec api npm run applications:discover</code>。</p><h2 id="常见问题" tabindex="-1">常见问题 <a class="header-anchor" href="#常见问题" aria-label="Permalink to “常见问题”">​</a></h2><ul><li>如果找不到 Docker，请启动 Docker Desktop 并检查 <code>docker compose version</code>。</li><li>如果端口已被占用，请修改 <code>.env</code> 中的 <code>FRONTEND_PORT</code>、<code>API_PORT</code> 或 <code>POSTGRES_PORT</code>。</li><li>如果 API 未通过健康检查，请查看 <code>npm run dev:logs</code>。API 依赖 PostgreSQL，并在启动时运行迁移。</li><li><code>.env.example</code> 中的值仅供本地开发使用。请勿共享真实凭据或提交 <code>.env</code> 文件。</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("zh-CN/getting-started.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var getting_started_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, getting_started_default as default };
