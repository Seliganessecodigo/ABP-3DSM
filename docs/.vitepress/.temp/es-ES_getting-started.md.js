import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
//#region es-ES/getting-started.md
var __pageData = JSON.parse("{\"title\":\"Primeros pasos\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"es-ES/getting-started.md\",\"filePath\":\"es-ES/getting-started.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "es-ES/getting-started.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="primeros-pasos" tabindex="-1">Primeros pasos <a class="header-anchor" href="#primeros-pasos" aria-label="Permalink to “Primeros pasos”">​</a></h1><h2 id="requisitos-previos" tabindex="-1">Requisitos previos <a class="header-anchor" href="#requisitos-previos" aria-label="Permalink to “Requisitos previos”">​</a></h2><ul><li>Docker Desktop con Docker Compose v2 disponible como <code>docker compose</code>.</li><li>Node.js 24 o superior y npm para ejecutar los scripts de la raíz.</li></ul><h2 id="iniciar-el-entorno" tabindex="-1">Iniciar el entorno <a class="header-anchor" href="#iniciar-el-entorno" aria-label="Permalink to “Iniciar el entorno”">​</a></h2><p>Clona el repositorio y entra en su carpeta:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> ABP-3DSM</span></span></code></pre></div><p>Crea la configuración local a partir del ejemplo:</p><div class="language-powershell"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">powershell</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env.example .env</span></span></code></pre></div><p>En macOS o Linux:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env</span></span></code></pre></div><p>Inicia el frontend, la API y PostgreSQL:</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> dev</span></span></code></pre></div><p>Compose instala las dependencias dentro de los contenedores. Las migraciones pendientes se ejecutan antes de iniciar la API. La API intenta descubrir aplicaciones al arrancar; si el agregador no está disponible, registra el error y continúa iniciando.</p><h2 id="direcciones-locales" tabindex="-1">Direcciones locales <a class="header-anchor" href="#direcciones-locales" aria-label="Permalink to “Direcciones locales”">​</a></h2><table tabindex="0"><thead><tr><th>Servicio</th><th>Dirección</th></tr></thead><tbody><tr><td>Frontend</td><td><code>http://localhost:5173</code></td></tr><tr><td>API</td><td><code>http://localhost:3000</code></td></tr><tr><td>OpenAPI</td><td><code>http://localhost:3000/docs</code></td></tr><tr><td>Estado de la API</td><td><code>http://localhost:3000/health</code></td></tr><tr><td>PostgreSQL</td><td>localhost:5432</td></tr></tbody></table><h2 id="comandos-utiles" tabindex="-1">Comandos útiles <a class="header-anchor" href="#comandos-utiles" aria-label="Permalink to “Comandos útiles”">​</a></h2><table tabindex="0"><thead><tr><th>Comando</th><th>Acción</th></tr></thead><tbody><tr><td><code>npm run dev:detached</code></td><td>Inicia los servicios en segundo plano</td></tr><tr><td><code>npm run dev:logs</code></td><td>Muestra los registros de los servicios</td></tr><tr><td><code>npm run dev:down</code></td><td>Detiene los contenedores y conserva el volumen de datos</td></tr><tr><td><code>docker compose up --build</code></td><td>Reconstruye las imágenes</td></tr></tbody></table><p>Para repetir el descubrimiento sin reiniciar la API, ejecuta <code>docker compose exec api npm run applications:discover</code>.</p><h2 id="problemas-frecuentes" tabindex="-1">Problemas frecuentes <a class="header-anchor" href="#problemas-frecuentes" aria-label="Permalink to “Problemas frecuentes”">​</a></h2><ul><li>Si no se encuentra Docker, inicia Docker Desktop y comprueba <code>docker compose version</code>.</li><li>Si un puerto está ocupado, cambia <code>FRONTEND_PORT</code>, <code>API_PORT</code> o <code>POSTGRES_PORT</code> en <code>.env</code>.</li><li>Si la API no alcanza el estado saludable, consulta <code>npm run dev:logs</code>. Depende de PostgreSQL y ejecuta las migraciones al iniciar.</li><li>Los valores de <code>.env.example</code> son solo para desarrollo local. No compartas credenciales reales ni el archivo <code>.env</code>.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("es-ES/getting-started.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var getting_started_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, getting_started_default as default };
