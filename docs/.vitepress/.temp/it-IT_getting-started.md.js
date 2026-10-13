import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
//#region it-IT/getting-started.md
var __pageData = JSON.parse("{\"title\":\"Per iniziare\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"it-IT/getting-started.md\",\"filePath\":\"it-IT/getting-started.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "it-IT/getting-started.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="per-iniziare" tabindex="-1">Per iniziare <a class="header-anchor" href="#per-iniziare" aria-label="Permalink to “Per iniziare”">​</a></h1><h2 id="prerequisiti" tabindex="-1">Prerequisiti <a class="header-anchor" href="#prerequisiti" aria-label="Permalink to “Prerequisiti”">​</a></h2><ul><li>Docker Desktop con Docker Compose v2 disponibile come <code>docker compose</code>.</li><li>Node.js 24 o successivo e npm per eseguire gli script dalla cartella principale.</li></ul><h2 id="avviare-l-ambiente" tabindex="-1">Avviare l&#39;ambiente <a class="header-anchor" href="#avviare-l-ambiente" aria-label="Permalink to “Avviare l&#39;ambiente”">​</a></h2><p>Clona il repository e apri la sua cartella:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> ABP-3DSM</span></span></code></pre></div><p>Crea la configurazione locale partendo dal file di esempio:</p><div class="language-powershell"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">powershell</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env.example .env</span></span></code></pre></div><p>Su macOS o Linux:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env</span></span></code></pre></div><p>Avvia frontend, API e PostgreSQL:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> dev</span></span></code></pre></div><p>Compose installa le dipendenze nei container. Le migrazioni in sospeso vengono eseguite prima dell&#39;avvio dell&#39;API. L&#39;API tenta di individuare le applicazioni all&#39;avvio; se l&#39;aggregatore non è disponibile, registra l&#39;errore e continua ad avviarsi.</p><h2 id="indirizzi-locali" tabindex="-1">Indirizzi locali <a class="header-anchor" href="#indirizzi-locali" aria-label="Permalink to “Indirizzi locali”">​</a></h2><table tabindex="0"><thead><tr><th>Servizio</th><th>Indirizzo</th></tr></thead><tbody><tr><td>Frontend</td><td><code>http://localhost:5173</code></td></tr><tr><td>API</td><td><code>http://localhost:3000</code></td></tr><tr><td>OpenAPI</td><td><code>http://localhost:3000/docs</code></td></tr><tr><td>Stato dell&#39;API</td><td><code>http://localhost:3000/health</code></td></tr><tr><td>PostgreSQL</td><td>localhost:5432</td></tr></tbody></table><h2 id="comandi-utili" tabindex="-1">Comandi utili <a class="header-anchor" href="#comandi-utili" aria-label="Permalink to “Comandi utili”">​</a></h2><table tabindex="0"><thead><tr><th>Comando</th><th>Azione</th></tr></thead><tbody><tr><td><code>npm run dev:detached</code></td><td>Avvia i servizi in background</td></tr><tr><td><code>npm run dev:logs</code></td><td>Segue i log dei servizi</td></tr><tr><td><code>npm run dev:down</code></td><td>Arresta i container mantenendo il volume dati</td></tr><tr><td><code>docker compose up --build</code></td><td>Ricostruisce le immagini</td></tr></tbody></table><p>Per ripetere l&#39;individuazione senza riavviare l&#39;API, esegui <code>docker compose exec api npm run applications:discover</code>.</p><h2 id="problemi-comuni" tabindex="-1">Problemi comuni <a class="header-anchor" href="#problemi-comuni" aria-label="Permalink to “Problemi comuni”">​</a></h2><ul><li>Se Docker non viene trovato, avvia Docker Desktop e verifica <code>docker compose version</code>.</li><li>Se una porta è occupata, modifica <code>FRONTEND_PORT</code>, <code>API_PORT</code> o <code>POSTGRES_PORT</code> in <code>.env</code>.</li><li>Se l&#39;API non diventa disponibile, consulta <code>npm run dev:logs</code>. Dipende da PostgreSQL ed esegue le migrazioni all&#39;avvio.</li><li>I valori di <code>.env.example</code> sono solo per lo sviluppo locale. Non condividere credenziali reali né il file <code>.env</code>.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("it-IT/getting-started.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var getting_started_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, getting_started_default as default };
