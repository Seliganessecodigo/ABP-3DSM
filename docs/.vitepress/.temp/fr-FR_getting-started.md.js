import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
//#region fr-FR/getting-started.md
var __pageData = JSON.parse("{\"title\":\"Bien démarrer\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"fr-FR/getting-started.md\",\"filePath\":\"fr-FR/getting-started.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "fr-FR/getting-started.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="bien-demarrer" tabindex="-1">Bien démarrer <a class="header-anchor" href="#bien-demarrer" aria-label="Permalink to “Bien démarrer”">​</a></h1><h2 id="prerequis" tabindex="-1">Prérequis <a class="header-anchor" href="#prerequis" aria-label="Permalink to “Prérequis”">​</a></h2><ul><li>Docker Desktop avec Docker Compose v2 accessible via <code>docker compose</code>.</li><li>Node.js 24 ou supérieur et npm pour exécuter les scripts à la racine.</li></ul><h2 id="demarrer-l-environnement" tabindex="-1">Démarrer l’environnement <a class="header-anchor" href="#demarrer-l-environnement" aria-label="Permalink to “Démarrer l’environnement”">​</a></h2><p>Clonez le dépôt et ouvrez son dossier :</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> ABP-3DSM</span></span></code></pre></div><p>Créez la configuration locale à partir du fichier d’exemple :</p><div class="language-powershell"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">powershell</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env.example .env</span></span></code></pre></div><p>Sur macOS ou Linux :</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> .env</span></span></code></pre></div><p>Démarrez le frontend, l’API et PostgreSQL :</p><div class="language-sh"><button title="Copy code" data-copied="Copied" class="copy"></button><span class="lang">sh</span><pre class="shiki shiki-themes github-light github-dark" style="${ssrRenderStyle({
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
	})}"> dev</span></span></code></pre></div><p>Compose installe les dépendances dans les conteneurs. Les migrations en attente sont exécutées avant le démarrage de l’API. L’API tente de découvrir les applications au démarrage ; si l’agrégateur est indisponible, elle journalise l’échec et continue de démarrer.</p><h2 id="adresses-locales" tabindex="-1">Adresses locales <a class="header-anchor" href="#adresses-locales" aria-label="Permalink to “Adresses locales”">​</a></h2><table tabindex="0"><thead><tr><th>Service</th><th>Adresse</th></tr></thead><tbody><tr><td>Frontend</td><td><code>http://localhost:5173</code></td></tr><tr><td>API</td><td><code>http://localhost:3000</code></td></tr><tr><td>OpenAPI</td><td><code>http://localhost:3000/docs</code></td></tr><tr><td>Santé de l’API</td><td><code>http://localhost:3000/health</code></td></tr><tr><td>PostgreSQL</td><td>localhost:5432</td></tr></tbody></table><h2 id="commandes-utiles" tabindex="-1">Commandes utiles <a class="header-anchor" href="#commandes-utiles" aria-label="Permalink to “Commandes utiles”">​</a></h2><table tabindex="0"><thead><tr><th>Commande</th><th>Action</th></tr></thead><tbody><tr><td><code>npm run dev:detached</code></td><td>Démarre les services en arrière-plan</td></tr><tr><td><code>npm run dev:logs</code></td><td>Suit les journaux des services</td></tr><tr><td><code>npm run dev:down</code></td><td>Arrête les conteneurs et conserve le volume de données</td></tr><tr><td><code>docker compose up --build</code></td><td>Reconstruit les images</td></tr></tbody></table><p>Pour relancer la découverte sans redémarrer l’API, exécutez <code>docker compose exec api npm run applications:discover</code>.</p><h2 id="problemes-courants" tabindex="-1">Problèmes courants <a class="header-anchor" href="#problemes-courants" aria-label="Permalink to “Problèmes courants”">​</a></h2><ul><li>Si Docker est introuvable, démarrez Docker Desktop et vérifiez <code>docker compose version</code>.</li><li>Si un port est déjà utilisé, modifiez <code>FRONTEND_PORT</code>, <code>API_PORT</code> ou <code>POSTGRES_PORT</code> dans <code>.env</code>.</li><li>Si l’API n’est pas saine, consultez <code>npm run dev:logs</code>. Elle dépend de PostgreSQL et applique les migrations au démarrage.</li><li>Les valeurs de <code>.env.example</code> sont réservées au développement local. Ne partagez pas de véritables identifiants ni le fichier <code>.env</code>.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("fr-FR/getting-started.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var getting_started_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, getting_started_default as default };
