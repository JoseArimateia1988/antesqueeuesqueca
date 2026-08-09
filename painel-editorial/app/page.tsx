"use client";

import { FormEvent, useEffect, useState } from "react";

const steps = [
  { label: "Direção", short: "01" },
  { label: "Radar", short: "02" },
  { label: "Pesquisa", short: "03" },
  { label: "Arquitetura", short: "04" },
  { label: "Conteúdo", short: "05" },
  { label: "Prévia", short: "06" },
  { label: "QA + publicar", short: "07" },
];

type Edition = "Explorar" | "Aprender" | "Usar" | "Pessoas" | "Mergulhos" | "Bonitezas" | "Reencontros" | "";
type StartMode = "specific" | "moment" | "explore";
type DirectionState = { edition: Edition; mode: StartMode; prompt: string; avoid: string; confirmed: boolean };
type Idea = {
  id: number;
  type: string;
  title: string;
  description: string;
  reason: string;
  connection: string;
  time: string;
  status: string;
  url?: string;
  verification?: string;
};
type EditorialBlock = { id: string; icon: string; function: string; idea: string; media: string; ratio: string; origin: string };

const initialDirection: DirectionState = {
  edition: "",
  mode: "moment",
  prompt: "",
  avoid: "",
  confirmed: false,
};

const weeklyLenses = [
  { name: "Explorar" as Edition, day: "segunda", icon: "↗", summary: "Sites, ferramentas e experiências interativas para abrir, testar e navegar — não só contemplar.", rule: "Só sugerir o que foi aberto ou testado; avisar quando algo não puder ser verificado.", status: "confirmada" },
  { name: "Aprender" as Edition, day: "terça", icon: "?", summary: "Coisas grandes, pequenas, práticas, culturais ou deliciosamente desnecessárias que ajudam a entender algo novo.", rule: "Não transformar aprender em lista de cursos; variar entre curiosidade, aplicação e repertório.", status: "confirmada" },
  { name: "Usar" as Edition, day: "quarta", icon: "＋", summary: "Ferramentas, atalhos, recursos e jeitos de fazer que possam sair da aba e entrar na vida ou no trabalho.", rule: "Definição provisória: priorizar aplicação real, sem confundir utilidade com produtividade obrigatória.", status: "provisória" },
  { name: "Pessoas" as Edition, day: "quinta", icon: "♡", summary: "Pessoas para conhecer pelo que criam, pensam, ensinam ou movimentam — e não só por uma biografia pronta.", rule: "Definição provisória: partir do trabalho e da contribuição; evitar perfil genérico ou idolatria.", status: "provisória" },
  { name: "Mergulhos" as Edition, day: "sexta", icon: "↓", summary: "Um assunto que merece mais tempo: leitura longa, documentário, investigação, aula ou toca de coelho.", rule: "Definição provisória: aprofundar um recorte com fontes; não montar uma lista superficial sobre tudo.", status: "provisória" },
  { name: "Bonitezas" as Edition, day: "sábado", icon: "✦", summary: "Lugares, projetos e experiências da internet que despertam curiosidade e dão vontade de explorar.", rule: "Nada entra só porque alguém indicou ou a IA achou bonito; precisa ser explorado antes.", status: "confirmada" },
  { name: "Reencontros" as Edition, day: "domingo", icon: "⌁", summary: "Músicas, filmes, cenas e referências da vida que ainda dizem alguma coisa quando voltam hoje.", rule: "Não inventar memória ou reação; a conexão pessoal precisa vir da Camis.", status: "confirmada" },
];

const initialIdeas: Idea[] = [
  {
    id: 1,
    type: "site interativo",
    title: "The Useless Web",
    description: "Um botão que te joga em cantos inúteis, estranhos e deliciosamente antigos da internet.",
    reason: "Tem cara de internet explorável, sem feed, sem recompensa e sem produtividade disfarçada.",
    connection: "Bonitezas",
    time: "5 min",
    status: "idle",
  },
  {
    id: 2,
    type: "arquivo visual",
    title: "Public Domain Review",
    description: "Ensaios e coleções de imagens curiosas vindas de arquivos públicos do mundo inteiro.",
    reason: "É o tipo de lugar em que uma busca puxa outra e você sai com mais perguntas do que entrou.",
    connection: "Bonitezas",
    time: "12 min",
    status: "idle",
  },
  {
    id: 3,
    type: "experimento digital",
    title: "Drive & Listen",
    description: "Passeios de carro por cidades do mundo ouvindo rádio e sons locais pela janela.",
    reason: "Mistura viagem, cotidiano e voyeurismo urbano sem tentar vender absolutamente nada.",
    connection: "Bonitezas",
    time: "8 min",
    status: "idle",
  },
];

function buildBlocks(ideas: Idea[], direction: DirectionState, camisNote: string): EditorialBlock[] {
  const itemBlocks = ideas.map((idea, index) => ({
    id: `item-${idea.id}`,
    icon: String(index + 1).padStart(2, "0"),
    function: idea.title,
    idea: `Apresentar ${idea.title}, explicar por que entrou no Radar e o que ele acrescenta ao Guardado.`,
    media: "Imagem + link",
    ratio: "16:9",
    origin: idea.url ? "fonte original / captura própria" : "a confirmar",
  }));
  return [
    { id: "opening", icon: "✦", function: "Abertura", idea: camisNote || `Apresentar o ponto de partida desta busca em ${direction.edition}.`, media: "Texto + destaque", ratio: "sem imagem", origin: "—" },
    ...itemBlocks,
    { id: "connection", icon: "♡", function: "O que junta estes achados", idea: ideas.length > 1 ? "Construir a conexão editorial entre os itens sem fingir que eles são a mesma coisa." : "Registrar a percepção da Camis sobre o achado escolhido.", media: "Texto", ratio: "sem imagem", origin: "—" },
    { id: "shelf", icon: "⌁", function: "Ficha da estante", idea: "Registrar links, fontes, data de acesso e motivo para voltar.", media: "Ficha", ratio: "sem imagem", origin: "—" },
  ];
}

function initialCopyFor(blocks: EditorialBlock[], ideas: Idea[], direction: DirectionState, camisNote: string) {
  return Object.fromEntries(blocks.map((block) => {
    const idea = ideas.find((item) => block.id === `item-${item.id}`);
    if (idea) return [block.id, `${idea.description}\n\nEntrou neste Radar porque ${idea.reason}`];
    if (block.id === "opening") return [block.id, camisNote || `Este Guardado começou com uma busca pela lente ${direction.edition}.`];
    if (block.id === "connection") return [block.id, direction.prompt || "Escreva aqui, com as suas palavras, o que conecta estes achados."];
    return [block.id, ideas.map((item) => `${item.title}${item.url ? ` — ${item.url}` : ""}`).join("\n")];
  }));
}

const qaItems = [
  "Scroll funciona sem travar",
  "Proporções conferidas",
  "Prévia mobile revisada",
  "Prévia desktop revisada",
  "Home e arquivo conferidos",
  "Links e fallback testados",
  "Analytics incluído",
  "Título, descrição e compartilhamento revisados",
];

function Dashboard({ onStart }: { onStart: (step?: number, edition?: Edition) => void }) {
  const editions = [
    { type: "Bonitezas" as Edition, number: "#002", title: "Coisas bonitas que fazem a internet parecer um lugar melhor", step: "Arquitetura", progress: 4, updated: "hoje, 16h42", tone: "pink", start: 3 },
    { type: "Reencontros" as Edition, number: "#002", title: "A música que eu sabia inteira sem perceber", step: "Pesquisa", progress: 3, updated: "ontem, 21h18", tone: "green", start: 2 },
  ];

  return (
    <section className="dashboard" id="top">
      <div className="intro">
        <div>
          <p className="eyebrow">painel editorial · domingo, 2 de agosto</p>
          <h1>O que você quer<br /><em>guardar hoje?</em></h1>
          <p className="lede">Curadoria pode ser todo dia. Publicar, só quando tiver alguma coisa que mereça mesmo ficar por aqui.</p>
        </div>
        <button className="new-edition" type="button" onClick={() => onStart(0)}>
          <span className="new-icon">＋</span>
          <span><strong>novo Guardado</strong><small>escolher lente e rumo</small></span>
        </button>
      </div>

      <div className="intention-note">
        <span className="pin" aria-hidden="true" />
        <div><small>intenção de hoje</small><strong>Reencontros</strong></div>
        <p>nostalgia e repertório de vida: música, filme, cena, referência.</p>
        <button type="button" onClick={() => onStart(0, "Reencontros")}>começar por aqui →</button>
      </div>

      <section className="week-strip" aria-labelledby="week-title">
        <div className="week-strip-heading">
          <div><p className="eyebrow">semana de curadoria</p><h2 id="week-title">Uma lente para cada dia</h2></div>
          <p>É um jeito de orientar o olhar — não uma obrigação de publicar diariamente.</p>
        </div>
        <div className="week-grid">
          {weeklyLenses.map((lens) => (
            <button className={lens.name === "Reencontros" ? "today" : ""} key={lens.name} onClick={() => onStart(0, lens.name)} type="button">
              <div><small>{lens.day}</small><span>{lens.icon}</span></div>
              <strong>{lens.name}</strong><p>{lens.summary}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">na mesa agora</p><h2>Edições em andamento</h2></div>
          <button className="text-button" type="button">ver todas (2)</button>
        </div>
        <div className="edition-grid">
          {editions.map((edition) => (
            <article className={`edition-card ${edition.tone}`} key={edition.type}>
              <div className="edition-topline"><span>{edition.type}</span><span>{edition.number}</span></div>
              <h3>{edition.title}</h3>
              <div className="stepper" aria-label={`Etapa atual: ${edition.step}`}>
                {steps.map((step, index) => <span className={index < edition.progress ? "done" : ""} key={step.label} title={step.label} />)}
              </div>
              <div className="edition-footer">
                <div><small>etapa atual</small><strong>{edition.step}</strong></div>
                <button type="button" onClick={() => onStart(edition.start, edition.type)}>continuar →</button>
              </div>
              <p className="updated">salvo automaticamente · {edition.updated}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="quick-grid">
        <article className="quick-card saved-ideas"><span className="quick-number">07</span><div><p className="eyebrow">para olhar depois</p><h3>Ideias guardadas</h3><p>Achados que passaram pelo radar, mas ainda não viraram edição.</p></div><button type="button">abrir caixa →</button></article>
        <article className="quick-card library-card"><span className="quick-number">04</span><div><p className="eyebrow">já estão na estante</p><h3>Guardados publicados</h3><p>Quatro Guardados já estão no ar na gaveta.</p></div><a href="https://nagaveta.moodlabs.com.br/" rel="noreferrer" target="_blank">ver arquivo →</a></article>
      </section>
    </section>
  );
}

function WorkspaceHeader({ current, maxStep, edition, onStep, onExit }: { current: number; maxStep: number; edition: Edition; onStep: (step: number) => void; onExit: () => void }) {
  return (
    <>
      <div className="edition-meta">
        <button className="back-link" type="button" onClick={onExit}>← voltar às edições</button>
        <div><span className="edition-badge">{edition || "nova edição"}</span><span>{edition ? "#002" : "sem número"} · rascunho</span></div>
        <div className="autosave"><span /> salvo automaticamente</div>
      </div>
      <div className="workflow-steps" aria-label="Etapas da edição">
        {steps.map((step, index) => (
          <button
            className={`${index === current ? "current" : ""} ${index < current ? "complete" : ""}`}
            disabled={index > maxStep}
            key={step.label}
            onClick={() => onStep(index)}
            type="button"
          >
            <span>{index < current ? "✓" : step.short}</span>
            {step.label}
          </button>
        ))}
      </div>
    </>
  );
}

function Direction({ value, showLensPicker, searching, searchError, onChange, onShowLensPicker, onNext }: { value: DirectionState; showLensPicker: boolean; searching: boolean; searchError: string; onChange: React.Dispatch<React.SetStateAction<DirectionState>>; onShowLensPicker: () => void; onNext: () => void }) {
  const promptLabels: Record<StartMode, { title: string; description: string; placeholder: string }> = {
    specific: { title: "Tenho uma pista", description: "Você traz um tema, link, filme, conversa ou pergunta e a busca parte dali.", placeholder: "Ex.: vi uma conversa sobre internet antiga e queria encontrar projetos que…" },
    moment: { title: "Quero partir de mim", description: "Você conta o que anda pensando, vivendo ou querendo entender — sem precisar chegar com um tema pronto.", placeholder: "O que anda voltando para a sua cabeça? O que está te atravessando agora?" },
    explore: { title: "Quero que a IA abra caminhos", description: "A IA parte da lente escolhida. Você pode dar um clima, um limite ou simplesmente deixar o campo em branco.", placeholder: "Opcional: hoje quero algo mais leve / prático / nostálgico / estranho…" },
  };
  const active = promptLabels[value.mode];
  const ready = Boolean(value.edition && (value.mode === "explore" || value.prompt.trim()) && value.confirmed);
  const selectedLens = weeklyLenses.find((lens) => lens.name === value.edition);

  return (
    <div className="stage-content direction-stage">
      <div className="stage-heading"><div><p className="eyebrow">etapa 1 · direção</p><h2>Antes de buscar: qual é a lente?</h2><p>Primeiro você escolhe a intenção do dia e dá o rumo. O Radar só entra depois — já procurando coisas que partam de você.</p></div><div className="stage-rule">a lente orienta.<br /><strong>você dá o ponto de partida.</strong></div></div>

      {showLensPicker || !selectedLens ? <section className="direction-section">
          <div className="direction-number">01</div>
          <div className="direction-question"><p className="eyebrow">escolha a lente do dia</p><h3>Por qual intenção você quer olhar?</h3><p>Esta escolha completa aparece quando você começa por “novo Guardado”.</p></div>
          <div className="edition-choice-grid">
            {weeklyLenses.map((lens) => (
              <button className={`${value.edition === lens.name ? "selected" : ""} ${lens.status === "provisória" ? "provisional" : ""}`} key={lens.name} type="button" onClick={() => onChange((current) => ({ ...current, edition: lens.name, confirmed: false }))}>
                <span>{lens.icon}</span>
                <div className="lens-card-top"><em>{lens.day}</em>{lens.status === "provisória" && <b>provisório</b>}</div>
                <strong>{lens.name}</strong><small>{lens.summary}</small><p>{lens.rule}</p>
              </button>
            ))}
          </div>
          <p className="lens-distinction"><strong>A lente começa a curadoria.</strong> Bonitezas, Reencontros, Explorar e Aprender já viraram séries públicas. Usar, Pessoas e Mergulhos ainda podem existir só como intenção até a arquitetura decidir.</p>
        </section> : <section className="selected-lens-panel">
          <div className="selected-lens-icon">{selectedLens.icon}</div>
          <div><p className="eyebrow">lente de {selectedLens.day} já escolhida</p><h3>{selectedLens.name}</h3><p>{selectedLens.summary}</p><small>{selectedLens.rule}</small></div>
          <button type="button" onClick={onShowLensPicker}>trocar lente</button>
        </section>}

      <section className="direction-section stacked">
        <div className="direction-number">{showLensPicker ? "02" : "01"}</div>
        <div className="direction-question"><p className="eyebrow">escolha o ponto de partida</p><h3>De onde a busca começa hoje?</h3><p>Da sua pista, do que está te atravessando ou da IA abrindo caminhos.</p></div>
        <div className="start-mode-grid">
          {(Object.keys(promptLabels) as StartMode[]).map((mode) => <button className={value.mode === mode ? "selected" : ""} key={mode} type="button" onClick={() => onChange((current) => ({ ...current, mode, confirmed: false }))}><span>{mode === "specific" ? "↗" : mode === "moment" ? "♡" : "?"}</span><strong>{promptLabels[mode].title}</strong><small>{promptLabels[mode].description}</small></button>)}
        </div>
        <div className="direction-input">
          <label htmlFor="direction-prompt"><strong>{active.title}</strong><span>{active.description}</span></label>
          <textarea id="direction-prompt" value={value.prompt} placeholder={active.placeholder} onChange={(event) => onChange((current) => ({ ...current, prompt: event.target.value, confirmed: false }))} />
          <label className="avoid-label" htmlFor="direction-avoid">o que você não quer receber agora? <span>(opcional)</span></label>
          <input id="direction-avoid" value={value.avoid} placeholder="Ex.: nada genérico, nenhuma indicação de livro, sem coisa muito técnica…" onChange={(event) => onChange((current) => ({ ...current, avoid: event.target.value, confirmed: false }))} />
        </div>
      </section>

      <section className="search-brief">
        <span className="pin" aria-hidden="true" />
        <div><p className="eyebrow">brief da busca</p><h3>{value.edition || "Escolha uma lente"}</h3></div>
        <dl><div><dt>partir de</dt><dd>{value.prompt || (value.mode === "explore" ? "a IA abre caminhos dentro desta lente" : "Conte o que está te atravessando ou dê uma pista.")}</dd></div><div><dt>evitar</dt><dd>{value.avoid || "nenhum limite definido"}</dd></div></dl>
      </section>
      <label className={`brief-confirmation ${value.confirmed ? "confirmed" : ""}`}>
        <input checked={value.confirmed} disabled={!value.edition || (value.mode !== "explore" && !value.prompt.trim())} onChange={(event) => onChange((current) => ({ ...current, confirmed: event.target.checked }))} type="checkbox" />
        <span><strong>É isso que eu quero buscar.</strong><small>Confirme o brief antes de a IA abrir o Radar. Se você mudar qualquer campo, esta confirmação volta a ficar pendente.</small></span>
      </label>
      {searchError && <div className="search-error" role="alert"><strong>O Radar ainda não conseguiu sair.</strong><p>{searchError}</p></div>}
      <StageFooter hint={searching ? "Claude está lendo o rumo e buscando possibilidades na web." : ready ? "A IA vai buscar até 5 possibilidades a partir deste brief." : "Revise o brief e confirme que é isso que você quer buscar."} disabled={!ready || searching} onNext={onNext} nextLabel={searching ? "buscando" : "buscar com este rumo"} />
    </div>
  );
}

function Radar({ ideas, setIdeas, direction, camisNote, setCamisNote, onNext, onBack }: { ideas: Idea[]; setIdeas: React.Dispatch<React.SetStateAction<Idea[]>>; direction: DirectionState; camisNote: string; setCamisNote: (value: string) => void; onNext: () => void; onBack: () => void }) {
  const approved = ideas.filter((idea) => idea.status === "approved");
  const changeStatus = (id: number, status: string) => setIdeas((current) => current.map((idea) => idea.id === id ? { ...idea, status: idea.status === status ? "idle" : status } : idea));
  return (
    <div className="stage-content">
      <div className="stage-heading"><div><p className="eyebrow">etapa 2 · radar</p><h2>O que apareceu a partir do rumo</h2><p>Claude leu seu contexto e pesquisou possibilidades atuais. Nada vira texto ou edição até você escolher.</p></div><div className="stage-rule">até 5 sugestões é teto,<br /><strong>não é meta.</strong></div></div>
      <div className="radar-direction"><div><small>busca atual</small><strong>{direction.edition}</strong></div><p>{direction.prompt || "A IA abre caminhos dentro da lente, sem um tema obrigatório."}</p><button type="button" onClick={onBack}>mudar o rumo</button></div>
      <div className="live-radar-note"><strong>Radar real · Claude + web</strong><p>Os links vieram da busca atual. Abra os que chamarem atenção antes de aprovar.</p></div>
      <div className="radar-grid">
        {ideas.map((idea) => (
          <article className={`idea-card ${idea.status}`} key={idea.id}>
            <div className="idea-index">0{idea.id}</div>
            <p className="idea-type">{idea.type}</p>
            <h3>{idea.title}</h3>
            <p>{idea.description}</p>
            <dl><div><dt>por que entrou</dt><dd>{idea.reason}</dd></div><div><dt>lente desta busca</dt><dd>{idea.connection}</dd></div><div><dt>tempo para explorar</dt><dd>{idea.time}</dd></div>{idea.verification && <div><dt>verificação</dt><dd>{idea.verification}</dd></div>}</dl>
            {idea.url && <a className="idea-source" href={idea.url} target="_blank" rel="noreferrer">abrir fonte ↗</a>}
            <div className="idea-actions">
              <button className="approve" type="button" onClick={() => changeStatus(idea.id, "approved")}>{idea.status === "approved" ? "✓ aprovado" : "aprovar"}</button>
              <button type="button" onClick={() => changeStatus(idea.id, "saved")}>{idea.status === "saved" ? "✓ guardado" : "guardar"}</button>
              <button type="button" onClick={() => changeStatus(idea.id, "discarded")}>descartar</button>
            </div>
          </article>
        ))}
      </div>
      <div className="personal-note"><label htmlFor="camis-note">o que te chamou atenção? <span>(opcional, mas ajuda a IA a não inventar o seu ponto)</span></label><textarea id="camis-note" value={camisNote} onChange={(event) => setCamisNote(event.target.value)} placeholder="Escreva com as suas palavras o que vale seguir, como os itens podem se juntar ou o que deve ficar separado." /></div>
      <StageFooter backLabel="voltar à direção" onBack={onBack} hint={approved.length ? `${approved.length} ${approved.length === 1 ? "achado vai" : "achados vão"} para pesquisa.` : "Escolha um ou mais achados para liberar a pesquisa."} disabled={!approved.length} onNext={onNext} nextLabel={approved.length > 1 ? `pesquisar ${approved.length} escolhidos` : "pesquisar o escolhido"} />
    </div>
  );
}

function Research({ ideas, camisNote, onNext, onBack }: { ideas: Idea[]; camisNote: string; onNext: () => void; onBack: () => void }) {
  return (
    <div className="stage-content narrow-stage">
      <div className="stage-heading"><div><p className="eyebrow">etapa 3 · pesquisa</p><h2>O que a gente sabe antes de escrever</h2><p>Fatos, fontes, limites e caminhos possíveis. Pesquisa não vira texto automaticamente.</p></div><span className="research-stamp">fontes<br />abertas</span></div>
      <div className="research-batch">
        {ideas.map((idea, index) => <article className="research-summary" key={idea.id}><div><p className="eyebrow">achado {String(index + 1).padStart(2, "0")}</p><h3>{idea.title}</h3><p>{idea.description}</p><dl><div><dt>por que entrou</dt><dd>{idea.reason}</dd></div>{idea.verification && <div><dt>o que já foi verificado</dt><dd>{idea.verification}</dd></div>}</dl></div>{idea.url && <a href={idea.url} target="_blank" rel="noreferrer">abrir fonte ↗</a>}</article>)}
      </div>
      {camisNote && <section className="research-section camis-direction"><h3>O ponto da Camis</h3><p>{camisNote}</p></section>}
      <div className="research-columns"><section><h3>O que ainda precisa ser confirmado</h3><p>Autoria, data, contexto, disponibilidade do link e qualquer afirmação factual que entre no texto final.</p><span className="status-chip warn">pesquisa antes da escrita</span></section><section><h3>Imagem e embed</h3><p>Priorizar captura própria ou material autorizado. Toda mídia externa precisa de crédito e fallback por link.</p><span className="status-chip good">decidir na arquitetura</span></section></div>
      <StageFooter backLabel="voltar ao radar" onBack={onBack} hint={`${ideas.length} ${ideas.length === 1 ? "achado será organizado" : "achados serão organizados"} na mesma arquitetura.`} onNext={onNext} nextLabel="montar arquitetura" />
    </div>
  );
}

function Architecture({ blocks, onNext, onBack }: { blocks: EditorialBlock[]; onNext: () => void; onBack: () => void }) {
  return (
    <div className="stage-content">
      <div className="stage-heading"><div><p className="eyebrow">etapa 4 · arquitetura</p><h2>A edição antes do texto pronto</h2><p>A ordem, a função e a mídia de cada bloco. Aqui ainda dá para mudar tudo sem jogar texto fora.</p></div><button className="outline-button" type="button">＋ adicionar bloco</button></div>
      <div className="block-list">
        {blocks.map((block, index) => <article className="architecture-block" key={block.id}><div className="drag-handle">⠿</div><div className="block-icon">{block.icon}</div><div className="block-main"><span>bloco {String(index + 1).padStart(2,"0")} · {block.function}</span><h3>{block.idea}</h3><div className="block-specs"><span><small>mídia</small>{block.media}</span><span><small>proporção</small>{block.ratio}</span><span><small>origem</small>{block.origin}</span></div></div><div className="block-actions"><button type="button" aria-label="Mover bloco para cima">↑</button><button type="button" aria-label="Mover bloco para baixo">↓</button><button type="button" aria-label="Mais opções">•••</button></div></article>)}
      </div>
      <div className="approval-note"><strong>trava desta etapa</strong><p>A escrita só começa depois que a arquitetura for aprovada. Se você voltar e alterar um bloco depois, o painel avisa quais textos precisam ser revistos — não apaga nada.</p></div>
      <StageFooter backLabel="voltar à pesquisa" onBack={onBack} hint={`${blocks.length} blocos serão levados para escrita e imagens.`} onNext={onNext} nextLabel="aprovar arquitetura" />
    </div>
  );
}

function Content({ blocks, copy, setCopy, onNext, onBack }: { blocks: EditorialBlock[]; copy: Record<string, string>; setCopy: React.Dispatch<React.SetStateAction<Record<string, string>>>; onNext: () => void; onBack: () => void }) {
  return (
    <div className="stage-content">
      <div className="stage-heading"><div><p className="eyebrow">etapa 5 · conteúdo</p><h2>Texto e imagem no mesmo lugar</h2><p>Cada bloco é independente. Pedir outra versão aqui não bagunça o resto da edição.</p></div><span className="version-tag">versão 1 · agora</span></div>
      <div className="content-blocks">
        {blocks.map((block, index) => <article className="content-block" key={block.id}><header><span>{block.icon}</span><div><small>bloco {String(index + 1).padStart(2,"0")}</small><h3>{block.function}</h3></div><button type="button">•••</button></header><div className="content-grid"><div className="copy-editor"><label htmlFor={`copy-${block.id}`}>texto do bloco</label><textarea id={`copy-${block.id}`} value={copy[block.id] || ""} onChange={(event) => setCopy((current) => ({...current, [block.id]: event.target.value}))} /><div className="copy-actions"><button type="button">pedir alternativa</button><span>{(copy[block.id] || "").length} caracteres</span></div></div><div className={`media-editor ${block.media.includes("Imagem") ? "" : "no-media"}`}>{block.media.includes("Imagem") ? <><div className="image-placeholder"><span>↥</span><strong>arraste ou escolha uma imagem</strong><small>recomendado · {block.ratio} · {block.origin}</small></div><div className="media-fields"><input aria-label="Legenda" placeholder="legenda da imagem" /><input aria-label="Crédito" placeholder="crédito / origem" /></div></> : <><span className="no-media-icon">—</span><p>Este bloco não precisa de imagem.</p><button type="button">adicionar mesmo assim</button></>}</div></div></article>)}
      </div>
      <StageFooter backLabel="voltar à arquitetura" onBack={onBack} hint="A prévia usará exatamente estes textos — sem uma nova interpretação." onNext={onNext} nextLabel="ver prévia" />
    </div>
  );
}

function Preview({ copy, ideas, edition, onNext, onBack }: { copy: Record<string, string>; ideas: Idea[]; edition: Edition; onNext: () => void; onBack: () => void }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  return (
    <div className="stage-content preview-stage">
      <div className="stage-heading"><div><p className="eyebrow">etapa 6 · prévia</p><h2>Como o Guardado vai aparecer</h2><p>Conteúdo real, na ordem aprovada. A prévia não reescreve nada.</p></div><div className="device-switch"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} type="button">▱ desktop</button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} type="button">▯ mobile</button></div></div>
      <div className={`preview-frame ${device}`}><div className="preview-browser"><span /><span /><span /><small>nagaveta.moodlabs.com.br/guardado-003</small></div><article className="guardado-preview"><header><p>antes que eu esqueça · guardado 003</p><span>lente: {edition || "a decidir"}</span></header><section className="guardado-hero"><div><small>{edition}</small><h3>{ideas.length > 1 ? `${ideas.length} achados que vale juntar.` : ideas[0]?.title || "Novo Guardado"}</h3></div><p>{copy.opening}</p></section>{ideas.map((idea, index) => <section className="guardado-chapter" key={idea.id}><div className="fake-image"><span>imagem / captura</span><strong>{String(index + 1).padStart(2, "0")}</strong><small>{idea.type}</small></div><div><small>isso me chamou atenção</small><h4>{idea.title}</h4><p>{copy[`item-${idea.id}`]}</p>{idea.url && <a href={idea.url} target="_blank" rel="noreferrer">abrir e explorar ↗</a>}</div></section>)}<blockquote>{copy.connection}</blockquote><footer><small>ficha da estante</small><p>{copy.shelf}</p></footer></article></div>
      <StageFooter backLabel="voltar ao conteúdo" onBack={onBack} hint="Depois daqui entram somente conferência e publicação." onNext={onNext} nextLabel="seguir para o QA" />
    </div>
  );
}

function QA({ edition, onBack, onPublished }: { edition: Edition; onBack: () => void; onPublished: () => void }) {
  const [checks, setChecks] = useState<boolean[]>(qaItems.map(() => false));
  const complete = checks.every(Boolean);
  const toggle = (index: number) => setChecks((current) => current.map((item, itemIndex) => itemIndex === index ? !item : item));
  return (
    <div className="stage-content narrow-stage qa-stage">
      <div className="stage-heading"><div><p className="eyebrow">etapa 7 · QA e publicação</p><h2>Última olhada antes de guardar</h2><p>Publicar só fica disponível quando o essencial estiver conferido.</p></div><div className="qa-counter"><strong>{checks.filter(Boolean).length}/{checks.length}</strong><small>itens conferidos</small></div></div>
      <div className="qa-layout"><section className="qa-checklist"><h3>Checklist obrigatório</h3>{qaItems.map((item, index) => <label className={checks[index] ? "checked" : ""} key={item}><input checked={checks[index]} onChange={() => toggle(index)} type="checkbox" /><span>{checks[index] ? "✓" : ""}</span>{item}</label>)}<button className="mark-all" type="button" onClick={() => setChecks(qaItems.map(() => true))}>marcar tudo para testar o protótipo</button></section><aside className="publish-card"><span className="publish-stamp">guardado<br />003</span><p className="eyebrow">resumo da publicação</p><h3>Lente: {edition || "a decidir"}</h3><dl><div><dt>endereço</dt><dd>/guardado-003</dd></div><div><dt>home</dt><dd>entra em destaque</dd></div><div><dt>gaveta pública</dt><dd>{edition === "Bonitezas" || edition === "Reencontros" ? edition : "a decidir na arquitetura"}</dd></div><div><dt>analytics</dt><dd>G-EP2SKWWE0S</dd></div></dl><button disabled={!complete} onClick={onPublished} type="button">{complete ? "publicar Guardado" : `faltam ${checks.filter((item) => !item).length} conferências`}</button><small>neste protótipo, o botão só simula a publicação.</small></aside></div>
      <div className="stage-footer"><button className="back-button" type="button" onClick={onBack}>← voltar à prévia</button></div>
    </div>
  );
}

function Published({ edition, onExit }: { edition: Edition; onExit: () => void }) {
  return <div className="published-state"><div className="published-mark">✓</div><p className="eyebrow">simulação concluída</p><h2>Guardado na estante.</h2><p>O Guardado criado pela lente {edition || "escolhida"} atravessou o fluxo inteiro. No MVP funcional, esta tela também registra o aprendizado pós-publicação e abre a conferência da home, do arquivo e do Analytics.</p><div><button className="primary-button" type="button" onClick={onExit}>voltar ao painel</button><button className="outline-button" type="button">ver Guardado ↗</button></div></div>;
}

type AccountStatus = {
  email: string;
  configured: boolean;
  lastFour: string;
  updatedAt: string;
};

type AuthStatus = { authenticated: boolean; setupRequired: boolean; username: string };

function LoginScreen({ status, setupToken, onAuthenticated }: { status: AuthStatus; setupToken: string; onAuthenticated: (username: string) => void }) {
  const activating = status.setupRequired && Boolean(setupToken);
  const [username, setUsername] = useState("camis");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activating && password !== confirmation) return setMessage("As duas senhas precisam ser iguais.");
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(activating ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password, token: setupToken }),
      });
      const responseText = await response.text();
      let payload: { error?: string; username?: string } = {};
      try {
        payload = JSON.parse(responseText) as { error?: string; username?: string };
      } catch {
        throw new Error("O painel não conseguiu concluir o acesso. Tente novamente em alguns instantes.");
      }
      if (!response.ok) throw new Error(payload.error || "Não consegui entrar no painel.");
      window.history.replaceState({}, "", "/");
      onAuthenticated(payload.username || username);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não consegui entrar no painel.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand"><span className="brand-mark">✦</span><p>antes que eu esqueça</p><small>painel editorial interno</small></div>
        <div className="login-copy"><p className="eyebrow">{activating ? "primeiro acesso" : "área restrita"}</p><h1>{activating ? <>Crie seu acesso<br /><em>ao painel.</em></> : <>Entre para<br /><em>continuar.</em></>}</h1><p>{activating ? "Escolha um usuário e uma senha. O link de ativação deixa de funcionar assim que a conta é criada." : "Seu processo editorial, os Guardados e as integrações ficam protegidos atrás deste acesso."}</p></div>
        {status.setupRequired && !setupToken ? <div className="activation-missing"><strong>Conta ainda não ativada</strong><p>Abra o link único de ativação enviado para criar seu usuário e sua senha.</p></div> : <form className="login-form" onSubmit={submit}><label htmlFor="panel-user">usuário</label><input id="panel-user" autoCapitalize="none" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /><label htmlFor="panel-password">senha</label><input id="panel-password" type="password" autoComplete={activating ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={activating ? 12 : undefined} required />{activating && <><label htmlFor="panel-password-confirmation">repita a senha</label><input id="panel-password-confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} required /><small>Use pelo menos 12 caracteres.</small></>}<button className="primary-button" disabled={submitting} type="submit">{submitting ? "aguarde…" : activating ? "criar acesso" : "entrar"}</button>{message && <p className="login-message" role="alert">{message}</p>}</form>}
      </section>
      <aside className="login-note"><span>✦</span><p>Um lugar para escolher o rumo, pesquisar com intenção e transformar achados em Guardados.</p></aside>
    </main>
  );
}

function Account({ onLogout }: { onLogout: () => void }) {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/account", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não consegui abrir as configurações da conta.");
        return response.json() as Promise<AccountStatus>;
      })
      .then((payload) => { if (active) setStatus(payload); })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Não consegui abrir a conta."); });
    return () => { active = false; };
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiKey || saving) return;
    setSaving(true);
    setMessage("Validando a chave com a Anthropic…");
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const payload = await response.json() as AccountStatus & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não consegui salvar a chave.");
      setApiKey("");
      setStatus((current) => ({ email: current?.email || "", configured: true, lastFour: payload.lastFour, updatedAt: payload.updatedAt }));
      setMessage("Chave validada e guardada com segurança.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não consegui salvar a chave.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remover a conexão com o Claude deste painel?")) return;
    const response = await fetch("/api/account", { method: "DELETE" });
    if (!response.ok) return setMessage("Não consegui remover a chave.");
    setStatus((current) => current ? { ...current, configured: false, lastFour: "", updatedAt: "" } : current);
    setMessage("Conexão removida.");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  };

  return (
    <section className="account-page">
      <div className="account-heading"><div><p className="eyebrow">área interna · conta</p><h1>Configurações<br /><em>do painel.</em></h1><p className="lede">Aqui ficam sua sessão e as integrações usadas no processo editorial. A chave nunca aparece novamente depois de salva.</p></div><span className="account-stamp">acesso<br />restrito</span></div>
      <div className="account-grid">
        <article className="account-card identity-card"><p className="eyebrow">sessão</p><h2>Camis</h2><dl><div><dt>usuário</dt><dd>{status?.email || "carregando…"}</dd></div><div><dt>acesso</dt><dd>Login e senha do painel</dd></div></dl><button className="outline-button account-signout" type="button" onClick={logout}>sair desta conta</button></article>
        <article className="account-card integration-card"><div className="integration-title"><div><p className="eyebrow">variáveis e integrações</p><h2>Claude · Anthropic</h2></div><span className={status?.configured ? "connection-status connected" : "connection-status"}>{status?.configured ? "conectado" : "não conectado"}</span></div>{status?.configured ? <div className="saved-key"><span>chave protegida</span><strong>•••• •••• •••• {status.lastFour}</strong><small>Ela é descriptografada somente no servidor, no instante em que o Radar faz uma busca.</small></div> : <p className="integration-help">Cole sua chave da Anthropic aqui. Ela será validada antes de ser criptografada e guardada.</p>}<form className="key-form" onSubmit={save}><label htmlFor="anthropic-key">{status?.configured ? "substituir chave" : "chave da API Anthropic"}</label><div><input id="anthropic-key" name="anthropic-key" type="password" autoComplete="off" spellCheck={false} placeholder="sk-ant-…" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /><button className="primary-button" disabled={!apiKey || saving} type="submit">{saving ? "validando…" : status?.configured ? "substituir" : "conectar"}</button></div></form>{message && <p className="account-message" role="status">{message}</p>}{status?.configured && <button className="remove-key" type="button" onClick={remove}>remover conexão</button>}</article>
      </div>
      <aside className="security-note"><strong>Como a proteção funciona</strong><p>O painel usa uma sessão segura criada depois do login. A senha é guardada como hash, nunca em texto comum. A chave da Anthropic fica criptografada no banco e nunca é enviada ao navegador depois do cadastro.</p></aside>
    </section>
  );
}

function StageFooter({ hint, disabled = false, onNext, nextLabel, onBack, backLabel }: { hint?: string; disabled?: boolean; onNext: () => void; nextLabel: string; onBack?: () => void; backLabel?: string }) {
  return <div className="stage-footer">{onBack ? <button className="back-button" type="button" onClick={onBack}>← {backLabel}</button> : <span />}{hint && <p>{hint}</p>}<button className="primary-button" disabled={disabled} type="button" onClick={onNext}>{nextLabel} →</button></div>;
}

export default function Home() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [setupToken] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("setup") || "");
  const [view, setView] = useState<"dashboard" | "workspace" | "published" | "account">("dashboard");
  const [currentStep, setCurrentStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [direction, setDirection] = useState<DirectionState>(initialDirection);
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [copy, setCopy] = useState<Record<string, string>>({});
  const [camisNote, setCamisNote] = useState("");
  const [showLensPicker, setShowLensPicker] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const approvedIdeas = ideas.filter((idea) => idea.status === "approved");
  const editorialBlocks = buildBlocks(approvedIdeas, direction, camisNote);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não consegui verificar o acesso ao painel.");
        return response.json() as Promise<AuthStatus>;
      })
      .then((payload) => { if (active) setAuth(payload); })
      .catch(() => { if (active) setAuth({ authenticated: false, setupRequired: false, username: "" }); });
    return () => { active = false; };
  }, []);

  /* O rascunho precisa ser hidratado depois que localStorage existe no cliente. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("aqe_editorial_draft_v3") || "null") as { direction?: DirectionState; ideas?: Idea[]; copy?: Record<string, string>; camisNote?: string; currentStep?: number; maxStep?: number } | null;
      if (saved?.direction) setDirection({ ...initialDirection, ...saved.direction });
      if (saved?.ideas) setIdeas(saved.ideas);
      if (saved?.copy) setCopy(saved.copy);
      if (typeof saved?.camisNote === "string") setCamisNote(saved.camisNote);
      if (typeof saved?.currentStep === "number") setCurrentStep(saved.currentStep);
      if (typeof saved?.maxStep === "number") setMaxStep(saved.maxStep);
    } catch { /* mantém o rascunho inicial */ }
    setDraftLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!draftLoaded) return;
    localStorage.setItem("aqe_editorial_draft_v3", JSON.stringify({ direction, ideas, copy, camisNote, currentStep, maxStep }));
  }, [direction, ideas, copy, camisNote, currentStep, maxStep, draftLoaded]);

  if (!auth) return <main className="login-loading"><span>✦</span><p>abrindo o painel…</p></main>;
  if (!auth.authenticated) return <LoginScreen status={auth} setupToken={setupToken} onAuthenticated={(username) => setAuth({ authenticated: true, setupRequired: false, username })} />;

  const title = view === "dashboard" ? "edições" : view === "account" ? "conta" : `${direction.edition || "novo Guardado"} #002`;
  const start = (step = 0, edition?: Edition) => { setShowLensPicker(!edition); if (edition) setDirection((current) => ({ ...current, edition, confirmed: false })); else if (step === 0) setDirection(initialDirection); setCurrentStep(step); setMaxStep(Math.max(step, maxStep)); setView("workspace"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => { if (currentStep === 3) setCopy((current) => ({ ...initialCopyFor(editorialBlocks, approvedIdeas, direction, camisNote), ...current })); const value = Math.min(currentStep + 1, steps.length - 1); setCurrentStep(value); setMaxStep((current) => Math.max(current, value)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const runDirectedSearch = async () => {
    if (!direction.edition || searching) return;
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch("/api/radar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lens: direction.edition, mode: direction.mode, prompt: direction.prompt, avoid: direction.avoid }),
      });
      const payload = await response.json() as { ideas?: Idea[]; error?: string; code?: string };
      if (!response.ok || !payload.ideas?.length) {
        throw new Error(payload.code === "missing_key" ? "A integração está pronta, mas a chave da Anthropic ainda precisa ser cadastrada com segurança." : payload.error || "Não encontrei sugestões boas o suficiente agora. Tente ajustar o rumo.");
      }
      setIdeas(payload.ideas.map((idea, index) => ({ ...idea, id: index + 1, status: "idle" })));
      setCamisNote("");
      setCopy({});
      next();
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Ocorreu um erro inesperado ao buscar.");
    } finally {
      setSearching(false);
    }
  };
  const back = () => { setCurrentStep((current) => Math.max(0, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const exit = () => { setView("dashboard"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={exit}><span className="brand-mark">✦</span>antes que eu esqueça</button>
        <nav className="topnav" aria-label="Navegação principal"><button className={view === "dashboard" ? "active" : ""} type="button" onClick={exit}>edições</button><button type="button" onClick={() => start(0)}>criar</button><button type="button">guardados</button></nav>
        <button className={`profile ${view === "account" ? "active" : ""}`} type="button" aria-label="Abrir conta da Camis" onClick={() => { setView("account"); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span>CA</span>Camis</button>
      </header>
      {view === "dashboard" ? <Dashboard onStart={start} /> : view === "account" ? <Account onLogout={() => setAuth({ authenticated: false, setupRequired: false, username: "" })} /> : view === "published" ? <Published edition={direction.edition} onExit={exit} /> : <section className="workspace"><WorkspaceHeader current={currentStep} maxStep={maxStep} edition={direction.edition} onExit={exit} onStep={setCurrentStep} />{currentStep === 0 && <Direction value={direction} showLensPicker={showLensPicker} searching={searching} searchError={searchError} onShowLensPicker={() => setShowLensPicker(true)} onChange={setDirection} onNext={runDirectedSearch} />}{currentStep === 1 && <Radar ideas={ideas} setIdeas={setIdeas} direction={direction} camisNote={camisNote} setCamisNote={setCamisNote} onBack={back} onNext={next} />}{currentStep === 2 && <Research ideas={approvedIdeas} camisNote={camisNote} onBack={back} onNext={next} />}{currentStep === 3 && <Architecture blocks={editorialBlocks} onBack={back} onNext={next} />}{currentStep === 4 && <Content blocks={editorialBlocks} copy={copy} setCopy={setCopy} onBack={back} onNext={next} />}{currentStep === 5 && <Preview copy={copy} ideas={approvedIdeas} edition={direction.edition} onBack={back} onNext={next} />}{currentStep === 6 && <QA edition={direction.edition} onBack={back} onPublished={() => { setView("published"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />}</section>}
      <span className="sr-only" aria-live="polite">Tela atual: {title}</span>
    </main>
  );
}
