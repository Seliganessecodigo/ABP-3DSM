// Protótipo de design: os dados abaixo são ilustrativos e não fazem chamadas HTTP.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '../../..')
const output = process.argv[2] || __dirname
fs.mkdirSync(output, { recursive: true })
const asset = (name) => fs.readFileSync(path.join(root, 'frontend/src/assets', name))
const logo = 'data:image/png;base64,' + asset('green-er-mark.png').toString('base64')
const foliage = 'data:image/svg+xml;base64,' + asset('foliage-background.svg').toString('base64')
const fontFile = path.join(root, 'frontend/src/assets/fonts/InterVariable-DiVDrmQJ.woff2')
const fontPath = fs.readdirSync(path.dirname(fontFile)).find(n => n.endsWith('.woff2'))
const font = 'data:font/woff2;base64,' + fs.readFileSync(path.join(path.dirname(fontFile), fontPath)).toString('base64')
const source = fs.readFileSync(path.join(root, 'frontend/src/components/AppShell.tsx'), 'utf8')
const icons = [...source.matchAll(/<svg[^>]*viewBox="([^"]+)"[^>]*>(.*?)<\/svg>/g)].map(m => ({viewBox:m[1], body:m[2]}))
assert(icons.length >= 8, 'O shell mudou: revisar os ícones antes de gerar')
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const light = {bg:'#f4faf7',card:'#ffffff',text:'#17332d',muted:'#64716d',border:'#dce8e3',accent:'#106c55',tint:'#ddf5e9',nav:'#003d31',warn:'#895700',warnBg:'#fff2db',error:'#b83233',errorBg:'#fce8e8'}
const dark = {bg:'#101b18',card:'#182923',text:'#e8f2ed',muted:'#a7bdb2',border:'#607f70',accent:'#64d8ac',tint:'#164e3b',nav:'#082e25',warn:'#f3ca7a',warnBg:'#41331a',error:'#ffaba6',errorBg:'#492724'}
let C = light
function rect(x,y,w,h,fill=C.card,r=12,stroke='none') { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>` }
function text(x,y,value,size=15,color=C.text,weight=400) {return `<text x="${x}" y="${y}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}">${esc(value)}</text>`}
function lines(x,y,value,size=15,color=C.muted,step=24){return value.split('\n').map((v,i)=>text(x,y+i*step,v,size,color)).join('')}
function button(x,y,w,label,primary=false){return rect(x,y,w,44,primary?C.accent:C.card,8,primary?'none':C.border)+text(x+16,y+28,label,14,primary?(C===dark?'#082e25':'#fff'):C.text,600)}
function pill(x,y,label,kind='ok',w=130){const bg=kind==='warn'?C.warnBg:kind==='error'?C.errorBg:C.tint;const fg=kind==='warn'?C.warn:kind==='error'?C.error:C.accent;return rect(x,y,w,28,bg,14)+text(x+12,y+19,label,12,fg,600)}
function icon(x,y,i,color='#e8f2ed',size=20){const v=icons[i]||icons[0];return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${v.viewBox}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${v.body}</svg>`}
function shell(tab,role='Admin',theme='light'){
 C=theme==='dark'?dark:light
 let s=rect(0,0,1440,980,C.bg,0)+rect(0,0,208,980,C.nav,0)
 s+=`<image href="${logo}" x="24" y="30" width="32" height="32"/><text x="66" y="53" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="800"><tspan fill="#45d59a">Green</tspan><tspan fill="#e8f2ed">ER</tspan></text>`
 const nav=[['ACOMPANHAMENTO',null],['Dashboard',2],['Aplicações',3],['ANÁLISES',null],['Ranking',4],['Comparação',5],['Simulação regional',6],['SISTEMA',null],['Metodologia',7],['Configurações',8]]
 let y=104
 for(const [label,i] of nav){if(i===null){s+=text(24,y+18,label,10,'#64d8ac',700); y+=34;continue}if(label==='Configurações')s+=rect(12,y,184,42,'#106c55',8);s+=icon(25,y+12,i)+text(56,y+27,label,13,'#e8f2ed',label==='Configurações'?650:450);y+=46}
 s+=`<image href="${foliage}" x="0" y="770" width="208" height="210" opacity=".3"/>`
 s+=text(24,822,'PREFERÊNCIAS',10,'#64d8ac',700)+text(25,855,'Português · Brasil',13,'#e8f2ed')+text(25,892,'Tema claro / escuro',13,'#e8f2ed')+text(25,935,role==='Admin'?'Marina Alves':'Camila Souza',14,'#fff',600)+text(25,956,role,12,'#a7bdb2')
 s+=rect(208,0,1232,64,C.card,0)+text(244,39,'GreenER',16,C.accent,700)+text(1126,39,'PROTÓTIPO · DADOS ILUSTRATIVOS',10,C.muted,600)
 s+=text(248,111,'SISTEMA',11,C.accent,700)+text(248,154,'Configurações',32,C.text,700)+text(248,184,role==='Admin'?'Acompanhe a operação e administre os acessos ao GreenER.':'Cuide da sua conta e personalize sua experiência.',15,C.muted)
 const tabs=role==='Admin'?['Monitoramento','Usuários','Auditoria','Minha conta']:['Minha conta']
 let tx=248
 s+=`<path d="M248 258 H1400" stroke="${C.border}"/>`
 for(const t of tabs){const w=t==='Monitoramento'?176:t==='Minha conta'?146:128;s+=text(tx,239,t,14,t===tab?C.accent:C.muted,t===tab?650:450);if(t===tab)s+=`<path d="M${tx} 258 h${w-28}" stroke="${C.accent}" stroke-width="3"/>`;tx+=w+10}
 return s
}
function divider(y,x=248,w=1152){return `<path d="M${x} ${y} h${w}" stroke="${C.border}"/>`}
function monitor(paused=false){
 let s=text(248,310,paused?'Coleta pausada':'Coleta ativa',23,paused?C.warn:C.accent,650)+button(1222,280,178,paused?'Retomar coleta':'Pausar coleta',true)
 s+=text(248,342,paused?'Novos ciclos suspensos. O histórico mantém as lacunas do período de pausa.':'Consultas automáticas a cada 60 segundos · último ciclo às 14:32',15,C.muted)
 s+=text(248,379,'24 aplicações conhecidas',14)+text(525,379,'2 com dados desatualizados',14,C.warn)+text(903,379,'Última observação · 14:31:48',14,C.muted)+divider(409)
 s+=text(248,458,'Integrações',20,C.text,650)+text(248,487,'Diagnóstico consultado em 17/11/2026, às 14:33 · UTC−03:00',13,C.muted)+text(1214,460,'Atualizar diagnóstico',13,C.accent,600)
 s+=text(248,535,'Fonte',12,C.muted,600)+text(715,535,'Situação',12,C.muted,600)+text(1050,535,'Último sucesso',12,C.muted,600)+divider(552)
 s+=text(248,587,'Agregador de Métricas',16,C.text,600)+text(715,587,'Consulta bem-sucedida',14,C.accent)+text(1050,587,'14:32',14)+text(1220,587,'Ver detalhes →',13,C.accent)+divider(610)
 s+=text(248,645,'Intensidade de Carbono',16,C.text,600)+text(715,645,'Com falhas · 2 incidentes',14,C.warn)+text(1050,645,'14:25',14)+text(1220,645,'Ver detalhes →',13,C.accent)+divider(668)
 s+=text(248,720,'Ciclos recentes',20,C.text,650)+text(248,752,'O resultado de cada execução permanece registrado.',13,C.muted)
 const xs=[248,570,810,1040,1220];['Início · UTC−03:00','Resultado','Processadas','Falhas',''].forEach((v,i)=>s+=text(xs[i],795,v,12,C.muted,600));s+=divider(813)
 s+=text(248,850,'17/11/2026 · 14:32',14)+text(570,850,'Parcial',14,C.warn,600)+text(810,850,'24',14)+text(1040,850,'2',14)+text(1220,850,'Ver ciclo →',13,C.accent,600)+divider(873)
 return s+text(248,917,'Atualizar o diagnóstico não inicia coleta. O intervalo é configurado no ambiente.',13,C.muted)
}
function users(){
 let s=text(248,310,'Usuários e acessos',23,C.text,650)+text(248,342,'Contas da organização. Alterações de acesso exigem confirmação e motivo.',14,C.muted)+button(1235,280,165,'Criar conta',true)
 s+=rect(248,377,740,44,C.card,6,C.border)+text(264,405,'Buscar por nome, e-mail, papel ou estado',14,C.muted)+text(1014,405,'Filtros de colunas',14,C.accent,600)+text(1238,405,'Limpar filtros',14,C.accent,600)
 const xs=[248,495,825,1015,1250];['Nome ↑','E-mail','Papel','Estado','Ações'].forEach((v,i)=>s+=text(xs[i],471,v,12,C.muted,600));s+=divider(491)
 const data=[['Camila Souza','camila@example.org','Analista','Ativa'],['Marina Alves','marina@example.org','Admin','Ativa'],['Paulo Santos','paulo@example.org','Visitante','Bloqueada']]
 data.forEach((row,i)=>{const y=533+i*72;row.slice(0,3).forEach((v,j)=>s+=text(xs[j],y,v,14));s+=text(xs[3],y,row[3],14,i===2?C.warn:C.accent)+text(xs[4],y,'Gerenciar →',13,C.accent,600)+divider(y+25)})
 s+=text(248,762,'1–3 de 3 usuários',13,C.muted)+text(810,762,'Itens por página: 10',13)+text(1120,762,'Anterior',13,C.muted)+text(1232,762,'1',13,C.accent,650)+text(1285,762,'Próxima',13,C.muted)
 return s+text(248,855,'Ao bloquear ou desativar uma conta, as sessões são revogadas.',13,C.muted)+text(248,881,'O histórico e a autoria das ações permanecem preservados.',13,C.muted)
}
function audit(){
 let s=text(248,310,'Auditoria da organização',23,C.text,650)+text(248,342,'Quem realizou a ação, seu motivo e o resultado registrado.',14,C.muted)
 s+=rect(248,377,740,44,C.card,6,C.border)+text(264,405,'Buscar por responsável, operação ou motivo',14,C.muted)+text(1014,405,'Filtros de colunas',14,C.accent,600)+text(1238,405,'Limpar filtros',14,C.accent,600)
 const xs=[248,485,710,1030,1270];['Instante ↓ · UTC−03:00','Responsável','Operação','Resultado',''].forEach((v,i)=>s+=text(xs[i],471,v,12,C.muted,600));s+=divider(491)
 const rows=[['17/11 · 14:20','Marina Alves','Retomar monitoramento','Sucesso'],['17/11 · 14:12','Marina Alves','Alterar papel de conta','Sucesso']]
 rows.forEach((row,i)=>{const y=533+i*72;row.forEach((v,j)=>s+=text(xs[j],y,v,14,j===3?C.accent:C.text));s+=text(xs[4],y,'Abrir →',13,C.accent,600)+divider(y+25)})
 s+=text(248,681,'1–2 de 2 eventos',13,C.muted)+text(810,681,'Itens por página: 10',13)+text(1120,681,'Anterior',13,C.muted)+text(1232,681,'1',13,C.accent,650)+text(1285,681,'Próxima',13,C.muted)
 s+=text(248,758,'Evento selecionado',16,C.text,650)+text(248,796,'Retomar monitoramento',20,C.text,600)+text(248,833,'Coleta pausada → Coleta ativa',15)+text(248,865,'Motivo: manutenção concluída',14,C.muted)+text(248,893,'Marina Alves · 17/11/2026 às 14:20 · audit-demo-01',13,C.muted)
 return s
}
function account(){
 let s=text(248,310,'Minha conta',23,C.text,650)+text(248,342,'Dados de acesso e preferências de apresentação.',14,C.muted)+divider(378)
 s+=text(248,425,'Dados da conta',17,C.text,650)+text(248,454,'Informações do seu acesso',13,C.muted)
 s+=text(656,416,'Nome',12,C.muted)+text(656,442,'Camila Souza',16)+text(1040,416,'Papel',12,C.muted)+text(1040,442,'Analista',16)+text(656,485,'E-mail',12,C.muted)+text(656,511,'camila@example.org',16)+text(1040,485,'Método de acesso',12,C.muted)+text(1040,511,'Senha',16)+divider(548)
 s+=text(248,597,'Aparência e idioma',17,C.text,650)+text(248,626,'Preferências desta interface',13,C.muted)+text(656,581,'Tema',12,C.muted)
 s+=button(656,597,148,'Claro')+button(816,597,148,'Escuro')+button(976,597,172,'Sistema')+text(656,681,'Idioma',12,C.muted)+button(656,697,492,'Português · Brasil')+divider(769)
 s+=text(248,816,'Preferências das análises',17,C.text,650)+lines(656,808,'Limites de energia, CO₂e, cobertura e padrões de análise\ncontinuam em Metodologia e minhas preferências.',14,C.muted,23)+text(656,873,'Abrir metodologia e minhas preferências →',14,C.accent,600)+divider(909)
 return s+text(248,948,'Acesso: ativo',13,C.muted)+text(1284,948,'Sair da conta',14,C.accent,600)
}
function mobile(){C=light;let s=rect(0,0,390,1080,C.bg,0)+rect(0,0,390,64,C.card,0)+text(20,39,'Menu',14,C.accent,600)+`<image href="${logo}" x="160" y="18" width="28" height="28"/>`+text(199,39,'GreenER',16,C.accent,700)
 s+=text(20,98,'SISTEMA',10,C.accent,700)+text(20,137,'Configurações',27,C.text,700)+rect(20,166,350,44,C.card,6,C.border)+text(36,194,'Monitoramento',14,C.accent,600)+text(338,194,'↓',16,C.accent)
 s+=text(20,262,'Coleta ativa',24,C.accent,650)+text(20,294,'Consultas a cada 60 segundos.',14,C.muted)+text(20,320,'Último ciclo às 14:32 · UTC−03:00',13,C.muted)+button(20,344,350,'Pausar coleta',true)
 s+=text(20,428,'24 aplicações conhecidas',14)+text(20,455,'2 com dados desatualizados',14,C.warn)+divider(484,20,350)
 s+=text(20,530,'Integrações',21,C.text,650)+text(20,559,'Diagnóstico às 14:33 · 17/11/2026',12,C.muted)+text(20,604,'Agregador de Métricas',16,C.text,600)+text(20,635,'Consulta bem-sucedida',14,C.accent)+text(20,662,'Último sucesso às 14:32',12,C.muted)+divider(686,20,350)
 s+=text(20,724,'Intensidade de Carbono',16,C.text,600)+text(20,755,'Com falhas · 2 incidentes',14,C.warn)+text(20,782,'Último sucesso às 14:25',12,C.muted)+divider(806,20,350)+button(20,834,350,'Atualizar diagnóstico')
 s+=text(20,932,'Ciclos recentes',21,C.text,650)+text(20,970,'14:32 · Parcial · 24 processadas · 2 falhas',12,C.muted)+text(20,1001,'Ver ciclo →',14,C.accent,600)+divider(1027,20,350)
 return s
}
function states(){C=light;let s=rect(0,0,1440,980,C.bg,0)+text(32,52,'Estados e confirmações',28,C.text,700)+text(32,84,'Estados são mensagens no fluxo. Confirmações usam diálogo somente ao realizar uma ação.',15,C.muted)
 const rows=[['Carregando','Consultando o diagnóstico…','Aguardar antes de interpretar o estado.'],['Vazio','Nenhum ciclo registrado','Ausência não significa saúde.'],['Falha','Não foi possível atualizar','Preservar o contexto e permitir nova tentativa.'],['Acesso negado','Acesso restrito a Admin','Permitir retorno para Minha conta.']]
 rows.forEach((v,i)=>{const y=146+i*60;s+=text(32,y,v[0],13,C.muted,600)+text(250,y,v[1],16,C.text,600)+text(790,y,v[2],14,C.muted)+divider(y+23,32,1376)})
 s+=text(32,431,'AÇÃO: PAUSAR COLETA',11,C.accent,700)+text(750,431,'AÇÃO: ALTERAR ACESSO',11,C.accent,700)
 s+=rect(32,451,654,425,C.card,12,C.border)+text(56,492,'Pausar a coleta do GreenER?',23,C.text,650)+lines(56,531,'Novos ciclos serão suspensos. Um ciclo já iniciado pode\nconcluir. As aplicações continuam funcionando.\nO período sem coleta pode gerar lacunas no histórico.',14,C.muted,26)+text(56,632,'Motivo obrigatório',13,C.text,600)+rect(56,650,606,88,C.bg,6,C.border)+text(72,681,'Manutenção programada',15)+button(56,768,170,'Cancelar')+button(240,768,422,'Confirmar pausa',true)
 s+=rect(750,451,658,425,C.card,12,C.border)+text(774,492,'Bloquear acesso de Camila?',23,C.text,650)+lines(774,531,'As sessões serão revogadas após sucesso do servidor.\nHistórico e autoria das ações permanecem preservados.\nReativar exige novo login.',14,C.muted,26)+text(774,632,'Motivo obrigatório',13,C.text,600)+rect(774,650,610,88,C.bg,6,C.border)+text(790,681,'Revisão de acesso',15)+button(774,768,170,'Cancelar')+button(958,768,426,'Confirmar bloqueio',true)
 return s+text(32,932,'Erro preserva motivo e foco. Sucesso anuncia o resultado e atualiza somente o estado confirmado.',15,C.muted)
}
const screens=[['01 · ADMIN / MONITORAMENTO',shell('Monitoramento')+monitor()],['02 · ADMIN / USUÁRIOS',shell('Usuários')+users()],['03 · ADMIN / AUDITORIA',shell('Auditoria')+audit()],['04 · CONTA PESSOAL / ANALISTA OU VISITANTE',shell('Minha conta','Analista')+account()],['05 · ADMIN / PAUSADO / TEMA ESCURO',shell('Monitoramento','Admin','dark')+monitor(true)],['06 · ESTADOS E CONFIRMAÇÕES',states()]]
let board=rect(0,0,3460,3350,'#e5eee9',0)+text(40,53,'GreenER / Configurações',32,'#17332d',700)+text(40,88,'#255 · proposta atualizada · operação, acessos e conta pessoal · dados ilustrativos',17,'#64716d')
screens.forEach(([title,body],i)=>{const x=40+(i%2)*1500,y=150+Math.floor(i/2)*1060;board+=text(x,y-14,title,14,'#17332d',700)+`<g transform="translate(${x} ${y})">${body}</g>`})
board+=text(3050,136,'07 · MOBILE / 390 PX',14,'#17332d',700)+`<g transform="translate(3050 150)">${mobile()}</g>`+text(3050,1280,'Decisões do fluxo',21,'#17332d',700)+lines(3050,1320,'Conta pessoal para todos.\nAdmin vê as quatro áreas.\nMetodologia preservada.\nIntervalo somente leitura.\nPausa não para aplicações.\nRecálculo fora desta tela.\nExecução manual: dependência.\nEdição de parâmetros: dependência.',15,'#64716d',30)
board=board.replaceAll(`<image href="${logo}"`, '<use xlink:href="#brand"').replaceAll(`<image href="${foliage}"`, '<use xlink:href="#foliage"')
const defs=`<defs><symbol id="brand" viewBox="0 0 32 32"><image href="${logo}" width="32" height="32"/></symbol><symbol id="foliage" viewBox="0 0 208 210"><image href="${foliage}" width="208" height="210"/></symbol></defs>`
const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="3460" height="3350" viewBox="0 0 3460 3350"><title>GreenER · Configurações · #255</title>${defs}${board}</svg>`
assert(!svg.includes('undefined')); assert(Buffer.byteLength(svg)<10*1024*1024, 'Asset acima de 10 MB')
fs.writeFileSync(path.join(output,'GreenER-255-Configuracoes-v2.svg'),svg)
fs.writeFileSync(path.join(output,'preview.html'),`<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Inter;src:url('${font}')}body{margin:0}svg{display:block;width:1730px;height:1675px}</style>${svg}`)
fs.writeFileSync(path.join(output,'screen-monitoramento.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="980" viewBox="0 0 1440 980">${screens[0][1]}</svg>`)
const template=fs.readFileSync(path.join(__dirname,'prototipo.html'),'utf8')
fs.writeFileSync(path.join(output,'index.html'),template.replaceAll('__LOGO__',logo).replaceAll('__FOLIAGE__',foliage).replaceAll('__FONT__',font))
console.log(JSON.stringify({screens:screens.length+1,bytes:Buffer.byteLength(svg),output}))
