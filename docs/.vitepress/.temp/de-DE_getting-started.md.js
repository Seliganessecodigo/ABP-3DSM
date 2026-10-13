import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
//#region de-DE/getting-started.md
var __pageData = JSON.parse("{\"title\":\"Erste Schritte\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"de-DE/getting-started.md\",\"filePath\":\"de-DE/getting-started.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "de-DE/getting-started.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="erste-schritte" tabindex="-1">Erste Schritte <a class="header-anchor" href="#erste-schritte" aria-label="Permalink to “Erste Schritte”">​</a></h1><h2 id="voraussetzungen" tabindex="-1">Voraussetzungen <a class="header-anchor" href="#voraussetzungen" aria-label="Permalink to “Voraussetzungen”">​</a></h2><ul><li>Docker Desktop mit Docker Compose v2 unter dem Befehl <code>docker compose</code>.</li><li>Node.js 24 oder neuer und npm zum Ausführen der Root-Skripte.</li></ul><h2 id="umgebung-starten" tabindex="-1">Umgebung starten <a class="header-anchor" href="#umgebung-starten" aria-label="Permalink to “Umgebung starten”">​</a></h2><p>Repository klonen und in das Projektverzeichnis wechseln:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> ABP-3DSM</span></span></code></pre></div><p>Lokale Konfiguration aus der Beispieldatei erstellen:</p><div class="language-powershell"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">powershell</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env.example .env</span></span></code></pre></div><p>Unter macOS oder Linux:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env</span></span></code></pre></div><p>Frontend, API und PostgreSQL starten:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> dev</span></span></code></pre></div><p>Compose installiert die Abhängigkeiten in den Containern. Ausstehende Migrationen werden vor dem API-Start ausgeführt. Die API versucht beim Start, Anwendungen zu entdecken. Ist der Aggregator nicht erreichbar, protokolliert sie den Fehler und startet trotzdem.</p><h2 id="lokale-adressen" tabindex="-1">Lokale Adressen <a class="header-anchor" href="#lokale-adressen" aria-label="Permalink to “Lokale Adressen”">​</a></h2><table tabindex="0"><thead><tr><th>Dienst</th><th>Adresse</th></tr></thead><tbody><tr><td>Frontend</td><td><code>http://localhost:5173</code></td></tr><tr><td>API</td><td><code>http://localhost:3000</code></td></tr><tr><td>OpenAPI</td><td><code>http://localhost:3000/docs</code></td></tr><tr><td>API-Healthcheck</td><td><code>http://localhost:3000/health</code></td></tr><tr><td>PostgreSQL</td><td>localhost:5432</td></tr></tbody></table><h2 id="nutzliche-befehle" tabindex="-1">Nützliche Befehle <a class="header-anchor" href="#nutzliche-befehle" aria-label="Permalink to “Nützliche Befehle”">​</a></h2><table tabindex="0"><thead><tr><th>Befehl</th><th>Aktion</th></tr></thead><tbody><tr><td><code>npm run dev:detached</code></td><td>Dienste im Hintergrund starten</td></tr><tr><td><code>npm run dev:logs</code></td><td>Dienstprotokolle verfolgen</td></tr><tr><td><code>npm run dev:down</code></td><td>Container stoppen und Datenvolume behalten</td></tr><tr><td><code>docker compose up --build</code></td><td>Images neu erstellen</td></tr></tbody></table><p>Um die Erkennung ohne API-Neustart erneut auszuführen: <code>docker compose exec api npm run applications:discover</code>.</p><h2 id="haufige-probleme" tabindex="-1">Häufige Probleme <a class="header-anchor" href="#haufige-probleme" aria-label="Permalink to “Häufige Probleme”">​</a></h2><ul><li>Wird Docker nicht gefunden, Docker Desktop starten und <code>docker compose version</code> prüfen.</li><li>Ist ein Port belegt, <code>FRONTEND_PORT</code>, <code>API_PORT</code> oder <code>POSTGRES_PORT</code> in <code>.env</code> ändern.</li><li>Wird die API nicht gesund, <code>npm run dev:logs</code> prüfen. Die API benötigt PostgreSQL und führt beim Start Migrationen aus.</li><li>Werte in <code>.env.example</code> sind nur für die lokale Entwicklung bestimmt. Echte Zugangsdaten und die Datei <code>.env</code> nicht einchecken.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("de-DE/getting-started.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var getting_started_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, getting_started_default as default };
