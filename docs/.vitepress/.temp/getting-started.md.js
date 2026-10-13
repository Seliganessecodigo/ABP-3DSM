import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
//#region getting-started.md
var __pageData = JSON.parse("{\"title\":\"Primeiros passos\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"getting-started.md\",\"filePath\":\"getting-started.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "getting-started.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="primeiros-passos" tabindex="-1">Primeiros passos <a class="header-anchor" href="#primeiros-passos" aria-label="Permalink to “Primeiros passos”">​</a></h1><h2 id="pre-requisitos" tabindex="-1">Pré-requisitos <a class="header-anchor" href="#pre-requisitos" aria-label="Permalink to “Pré-requisitos”">​</a></h2><ul><li>Docker Desktop com Docker Compose v2 disponível como <code>docker compose</code>.</li><li>Node.js 24 ou superior e npm para executar os scripts da raiz.</li></ul><h2 id="iniciar-o-ambiente" tabindex="-1">Iniciar o ambiente <a class="header-anchor" href="#iniciar-o-ambiente" aria-label="Permalink to “Iniciar o ambiente”">​</a></h2><p>Clone o projeto e entre na pasta:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> ABP-3DSM</span></span></code></pre></div><p>Crie a configuração local a partir do exemplo:</p><div class="language-powershell"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">powershell</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env.example .env</span></span></code></pre></div><p>No macOS ou Linux:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env</span></span></code></pre></div><p>Inicie frontend, API e PostgreSQL:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> dev</span></span></code></pre></div><p>O Compose instala as dependências dos containers. Migrations pendentes são aplicadas antes de iniciar a API. A API tenta descobrir aplicações no início; se o agregador estiver indisponível, ela registra a falha e continua iniciando.</p><h2 id="enderecos-locais" tabindex="-1">Endereços locais <a class="header-anchor" href="#enderecos-locais" aria-label="Permalink to “Endereços locais”">​</a></h2><table tabindex="0"><thead><tr><th>Serviço</th><th>Endereço</th></tr></thead><tbody><tr><td>Frontend</td><td><code>http://localhost:5173</code></td></tr><tr><td>API</td><td><code>http://localhost:3000</code></td></tr><tr><td>OpenAPI</td><td><code>http://localhost:3000/docs</code></td></tr><tr><td>Saúde da API</td><td><code>http://localhost:3000/health</code></td></tr><tr><td>PostgreSQL</td><td>localhost:5432</td></tr></tbody></table><h2 id="comandos-uteis" tabindex="-1">Comandos úteis <a class="header-anchor" href="#comandos-uteis" aria-label="Permalink to “Comandos úteis”">​</a></h2><table tabindex="0"><thead><tr><th>Comando</th><th>Ação</th></tr></thead><tbody><tr><td><code>npm run dev:detached</code></td><td>Inicia os serviços em segundo plano</td></tr><tr><td><code>npm run dev:logs</code></td><td>Acompanha os logs</td></tr><tr><td><code>npm run dev:down</code></td><td>Para os containers e mantém o volume de dados</td></tr><tr><td><code>docker compose up --build</code></td><td>Reconstrói as imagens</td></tr></tbody></table><p>Para repetir a descoberta sem reiniciar a API, execute <code>docker compose exec api npm run applications:discover</code>.</p><h2 id="problemas-comuns" tabindex="-1">Problemas comuns <a class="header-anchor" href="#problemas-comuns" aria-label="Permalink to “Problemas comuns”">​</a></h2><ul><li>Se Docker não for encontrado, inicie o Docker Desktop e confira <code>docker compose version</code>.</li><li>Se uma porta estiver ocupada, ajuste <code>FRONTEND_PORT</code>, <code>API_PORT</code> ou <code>POSTGRES_PORT</code> em <code>.env</code>.</li><li>Se a API não ficar saudável, consulte <code>npm run dev:logs</code>. Ela depende do PostgreSQL e aplica migrations ao iniciar.</li><li>Os valores de <code>.env.example</code> são apenas para desenvolvimento local. Não versione credenciais reais nem o arquivo <code>.env</code>.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("getting-started.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var getting_started_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, getting_started_default as default };
