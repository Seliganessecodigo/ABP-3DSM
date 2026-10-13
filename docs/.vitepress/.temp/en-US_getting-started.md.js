import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
//#region en-US/getting-started.md
var __pageData = JSON.parse("{\"title\":\"Getting started\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"en-US/getting-started.md\",\"filePath\":\"en-US/getting-started.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "en-US/getting-started.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="getting-started" tabindex="-1">Getting started <a class="header-anchor" href="#getting-started" aria-label="Permalink to “Getting started”">​</a></h1><h2 id="prerequisites" tabindex="-1">Prerequisites <a class="header-anchor" href="#prerequisites" aria-label="Permalink to “Prerequisites”">​</a></h2><ul><li>Docker Desktop with Docker Compose v2 available as <code>docker compose</code>.</li><li>Node.js 24 or later and npm to run the root scripts.</li></ul><h2 id="start-the-environment" tabindex="-1">Start the environment <a class="header-anchor" href="#start-the-environment" aria-label="Permalink to “Start the environment”">​</a></h2><p>Clone the repository and open its directory:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> ABP-3DSM</span></span></code></pre></div><p>Create a local configuration from the example:</p><div class="language-powershell"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">powershell</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env.example .env</span></span></code></pre></div><p>On macOS or Linux:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env</span></span></code></pre></div><p>Start the frontend, API, and PostgreSQL:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> dev</span></span></code></pre></div><p>Compose installs dependencies inside the containers. Pending migrations run before the API starts. The API attempts application discovery at startup; if the aggregator is unavailable, it logs the failure and continues starting.</p><h2 id="local-addresses" tabindex="-1">Local addresses <a class="header-anchor" href="#local-addresses" aria-label="Permalink to “Local addresses”">​</a></h2><table tabindex="0"><thead><tr><th>Service</th><th>Address</th></tr></thead><tbody><tr><td>Frontend</td><td><code>http://localhost:5173</code></td></tr><tr><td>API</td><td><code>http://localhost:3000</code></td></tr><tr><td>OpenAPI</td><td><code>http://localhost:3000/docs</code></td></tr><tr><td>API health check</td><td><code>http://localhost:3000/health</code></td></tr><tr><td>PostgreSQL</td><td>localhost:5432</td></tr></tbody></table><h2 id="useful-commands" tabindex="-1">Useful commands <a class="header-anchor" href="#useful-commands" aria-label="Permalink to “Useful commands”">​</a></h2><table tabindex="0"><thead><tr><th>Command</th><th>Action</th></tr></thead><tbody><tr><td><code>npm run dev:detached</code></td><td>Start services in the background</td></tr><tr><td><code>npm run dev:logs</code></td><td>Follow service logs</td></tr><tr><td><code>npm run dev:down</code></td><td>Stop containers and keep the data volume</td></tr><tr><td><code>docker compose up --build</code></td><td>Rebuild the images</td></tr></tbody></table><p>To repeat discovery without restarting the API, run <code>docker compose exec api npm run applications:discover</code>.</p><h2 id="common-issues" tabindex="-1">Common issues <a class="header-anchor" href="#common-issues" aria-label="Permalink to “Common issues”">​</a></h2><ul><li>If Docker is not found, start Docker Desktop and check <code>docker compose version</code>.</li><li>If a port is already in use, update <code>FRONTEND_PORT</code>, <code>API_PORT</code>, or <code>POSTGRES_PORT</code> in <code>.env</code>.</li><li>If the API does not become healthy, inspect <code>npm run dev:logs</code>. It depends on PostgreSQL and runs migrations at startup.</li><li>Values in <code>.env.example</code> are for local development only. Do not commit real credentials or the <code>.env</code> file.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("en-US/getting-started.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var getting_started_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, getting_started_default as default };
