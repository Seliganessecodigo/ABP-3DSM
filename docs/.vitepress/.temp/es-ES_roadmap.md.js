import { t as _plugin_vue_export_helper_default } from "./plugin-vue_export-helper.BOaGB7Aw.js";
import { useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
//#region es-ES/roadmap.md
var __pageData = JSON.parse("{\"title\":\"Épicas del producto\",\"description\":\"\",\"frontmatter\":{},\"headers\":[],\"relativePath\":\"es-ES/roadmap.md\",\"filePath\":\"es-ES/roadmap.md\",\"lastUpdated\":0}");
var _sfc_main = { name: "es-ES/roadmap.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
	_push(`<div${ssrRenderAttrs(_attrs)}><h1 id="epicas-del-producto" tabindex="-1">Épicas del producto <a class="header-anchor" href="#epicas-del-producto" aria-label="Permalink to “Épicas del producto”">​</a></h1><p>El backlog de GreenER agrupa las historias de usuario en seis épicas. Los criterios de aceptación y las tareas permanecen en las issues vinculadas; consulta GitHub para conocer su estado actual.</p><table tabindex="0"><thead><tr><th>Épica</th><th>Alcance</th></tr></thead><tbody><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/1" target="_blank" rel="noreferrer">EP01 — Catálogo de Aplicaciones</a></td><td>Consultar y navegar por las aplicaciones supervisadas.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/2" target="_blank" rel="noreferrer">EP02 — Supervisión de Aplicaciones</a></td><td>Descubrimiento, ciclo de vida, estados y recopilación de aplicaciones.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/3" target="_blank" rel="noreferrer">EP03 — Cálculo del Impacto Ambiental</a></td><td>Estimar energía y CO₂e con métodos y limitaciones trazables.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/4" target="_blank" rel="noreferrer">EP04 — Panel Ambiental</a></td><td>Resúmenes e indicadores agregados por periodo.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/5" target="_blank" rel="noreferrer">EP05 — Análisis y Simulación</a></td><td>Comparar aplicaciones y simular escenarios regionales.</td></tr><tr><td><a href="https://github.com/Seliganessecodigo/ABP-3DSM/issues/6" target="_blank" rel="noreferrer">EP06 — Configuración y Administración</a></td><td>Configurar y administrar la supervisión con autorización.</td></tr></tbody></table><h2 id="principios-del-producto" tabindex="-1">Principios del producto <a class="header-anchor" href="#principios-del-producto" aria-label="Permalink to “Principios del producto”">​</a></h2><ul><li>Los errores o la falta de observaciones nunca se convierten en consumo cero.</li><li>La energía y el CO₂e conservan sus unidades, periodo, cobertura y contexto.</li><li>Los cambios de configuración o metodología no deben reescribir resultados históricos.</li><li>El panel público no requiere inicio de sesión; el backend autoriza los cambios administrativos.</li></ul></div>`);
}
var _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("es-ES/roadmap.md");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var roadmap_default = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
//#endregion
export { __pageData, roadmap_default as default };
