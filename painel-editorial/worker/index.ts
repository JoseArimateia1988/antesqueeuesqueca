/** Cloudflare Worker entry point for the vinext-starter template. */
import handler from "vinext/server/app-router-entry";

type RadarRequest = {
  lens?: string;
  mode?: "specific" | "moment" | "explore";
  prompt?: string;
  avoid?: string;
};

const lensRules: Record<string, string> = {
  Explorar: "Sites, ferramentas e experiências interativas para abrir, testar e navegar. Só indicar o que tenha um destino direto verificável.",
  Aprender: "Aprendizados grandes, pequenos, práticos, culturais ou deliciosamente desnecessários. Não transformar tudo em curso.",
  Usar: "Ferramentas, atalhos, recursos e jeitos de fazer com aplicação real, sem produtividade obrigatória.",
  Pessoas: "Pessoas conhecidas pelo que criam, pensam, ensinam ou movimentam. Evitar biografia genérica e idolatria.",
  Mergulhos: "Um recorte que mereça leitura longa, documentário, investigação, aula ou toca de coelho com fontes.",
  Bonitezas: "Lugares, projetos e experiências da internet que despertem curiosidade. Precisam poder ser explorados antes de entrar.",
  Reencontros: "Músicas, filmes, cenas e referências que possam voltar ao repertório de vida. Nunca inventar memória, opinião ou reação da Camis.",
};

const lensByWeekday: Record<string, string> = {
  Mon: "Explorar",
  Tue: "Aprender",
  Wed: "Usar",
  Thu: "Pessoas",
  Fri: "Mergulhos",
  Sat: "Bonitezas",
  Sun: "Reencontros",
};

const lensSummaries: Record<string, string> = {
  Explorar: "sites, ferramentas e experiências interativas para abrir, testar e navegar.",
  Aprender: "curiosidades, ideias, habilidades e pontos de vista para aprender alguma coisa de verdade.",
  Usar: "aplicativos, workflows e recursos práticos que podem entrar na vida ou no trabalho.",
  Pessoas: "criadores, projetos, entrevistas e perfis que valem conhecer pelo que fazem e movimentam.",
  Mergulhos: "leituras longas, documentários e investigações que merecem mais tempo.",
  Bonitezas: "arte, design, internet criativa e experiências visuais que dão vontade de explorar.",
  Reencontros: "coisas guardadas para rever, resgatar ou perceber como evoluíram.",
};

function saoPauloEditorialNow() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(now);
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  return { lens: lensByWeekday[weekday] || "Explorar", dateLabel };
}

function patchDashboardForToday(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  const today = saoPauloEditorialNow();
  const script = `(() => {
    const lens = ${JSON.stringify(today.lens)};
    const dateLabel = ${JSON.stringify(today.dateLabel)};
    const summary = ${JSON.stringify(lensSummaries[today.lens] || "")};
    const patch = () => {
      const eyebrow = document.querySelector('.dashboard .intro .eyebrow');
      if (eyebrow) eyebrow.textContent = 'painel editorial · ' + dateLabel;
      const intention = document.querySelector('.intention-note');
      if (intention) {
        const strong = intention.querySelector('strong');
        const text = intention.querySelector('p');
        if (strong) strong.textContent = lens;
        if (text) text.textContent = summary;
      }
      const buttons = Array.from(document.querySelectorAll('.week-grid > button'));
      buttons.forEach((button) => {
        const name = button.querySelector('strong')?.textContent?.trim();
        button.classList.toggle('today', name === lens);
      });
    };
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('.intention-note button') : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      const match = Array.from(document.querySelectorAll('.week-grid > button')).find((button) => button.querySelector('strong')?.textContent?.trim() === lens);
      if (match instanceof HTMLElement) match.click();
    }, true);
    patch();
    queueMicrotask(patch);
    setTimeout(patch, 50);
    setTimeout(patch, 300);
    setTimeout(patch, 1000);
  })();`;
  return new HTMLRewriter().on("body", {
    element(element) {
      element.onEndTag((tag) => tag.before(`<script>${script}</script>`, { html: true }));
    },
  }).transform(response);
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const SESSION_COOKIE = "aqe_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function bytesToBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function encryptionKey(secret: string) {
  const bytes = base64ToBytes(secret);
  if (bytes.byteLength !== 32) throw new Error("invalid_encryption_key");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptSecret(value: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(secret), new TextEncoder().encode(value));
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

async function decryptSecret(ciphertext: string, iv: string, secret: string) {
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, await encryptionKey(secret), base64ToBytes(ciphertext));
  return new TextDecoder().decode(decrypted);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Bytes(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function sha256(value: string) {
  return bytesToHex(await sha256Bytes(value));
}

async function secretsEqual(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([sha256Bytes(left), sha256Bytes(right)]);
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual(left: ArrayBufferView, right: ArrayBufferView): boolean;
  };
  return subtle.timingSafeEqual(leftHash, rightHash);
}

async function passwordHash(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations: 100000 }, material, 256);
  return bytesToBase64(new Uint8Array(bits));
}

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return "";
}

async function ensureTables(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS panel_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS panel_sessions (
      token_hash TEXT PRIMARY KEY NOT NULL,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_settings (
      user_email TEXT PRIMARY KEY NOT NULL,
      anthropic_key_ciphertext TEXT,
      anthropic_key_iv TEXT,
      anthropic_key_last_four TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
  ]);
}

type PanelUser = { id: number; username: string };

async function sessionUser(request: Request, env: Env): Promise<PanelUser | null> {
  if (!env.DB) return null;
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  await ensureTables(env.DB);
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`SELECT u.id, u.username, s.expires_at
    FROM panel_sessions s JOIN panel_users u ON u.id = s.user_id
    WHERE s.token_hash = ?`).bind(tokenHash).first<{ id: number; username: string; expires_at: string }>();
  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    await env.DB.prepare("DELETE FROM panel_sessions WHERE token_hash = ?").bind(tokenHash).run();
    return null;
  }
  return { id: row.id, username: row.username };
}

async function createSession(userId: number, env: Env) {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_MAX_AGE * 1000);
  await env.DB.prepare("INSERT INTO panel_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, expires.toISOString(), now.toISOString()).run();
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

function authJson(body: unknown, status: number, cookie?: string) {
  const response = json(body, status);
  if (cookie) response.headers.set("set-cookie", cookie);
  return response;
}

async function handleAuthStatus(request: Request, env: Env) {
  if (!env.DB) return json({ error: "O banco do painel ainda não está disponível." }, 503);
  await ensureTables(env.DB);
  const user = await sessionUser(request, env);
  const registered = await env.DB.prepare("SELECT id FROM panel_users LIMIT 1").first<{ id: number }>();
  return json({ authenticated: Boolean(user), setupRequired: !registered, username: user?.username || "" });
}

async function handleSetup(request: Request, env: Env) {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (!env.DB || !env.APP_SETUP_TOKEN) return json({ error: "A ativação do painel não está disponível." }, 503);
  await ensureTables(env.DB);
  if (await env.DB.prepare("SELECT id FROM panel_users LIMIT 1").first()) return json({ error: "O painel já foi ativado." }, 409);

  let token = "", username = "", password = "";
  try {
    const body = await request.json() as { token?: string; username?: string; password?: string };
    token = typeof body.token === "string" ? body.token : "";
    username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }
  if (!(await secretsEqual(token, env.APP_SETUP_TOKEN))) return json({ error: "Este link de ativação não é válido." }, 403);
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return json({ error: "Use de 3 a 32 letras, números, ponto, traço ou sublinhado no usuário." }, 400);
  if (password.length < 12) return json({ error: "A senha precisa ter pelo menos 12 caracteres." }, 400);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const now = new Date().toISOString();
  const result = await env.DB.prepare("INSERT INTO panel_users (username, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .bind(username, await passwordHash(password, salt), bytesToBase64(salt), now, now).run();
  return authJson({ ok: true, username }, 200, await createSession(Number(result.meta.last_row_id), env));
}

async function handleLogin(request: Request, env: Env) {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (!env.DB) return json({ error: "O banco do painel ainda não está disponível." }, 503);
  await ensureTables(env.DB);
  let username = "", password = "";
  try {
    const body = await request.json() as { username?: string; password?: string };
    username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }
  const user = await env.DB.prepare("SELECT id, username, password_hash, password_salt FROM panel_users WHERE username = ?")
    .bind(username).first<{ id: number; username: string; password_hash: string; password_salt: string }>();
  if (!user || !(await secretsEqual(await passwordHash(password, base64ToBytes(user.password_salt)), user.password_hash))) {
    return json({ error: "Usuário ou senha incorretos." }, 401);
  }
  await env.DB.prepare("DELETE FROM panel_sessions WHERE expires_at <= ?").bind(new Date().toISOString()).run();
  return authJson({ ok: true, username: user.username }, 200, await createSession(user.id, env));
}

async function handleLogout(request: Request, env: Env) {
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const token = cookieValue(request, SESSION_COOKIE);
  if (token && env.DB) await env.DB.prepare("DELETE FROM panel_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return authJson({ ok: true }, 200, `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

async function handleAccount(request: Request, env: Env) {
  const user = await sessionUser(request, env);
  if (!user) return json({ error: "Sua sessão expirou. Entre novamente." }, 401);
  if (!env.DB) return json({ error: "O banco de configurações ainda não está disponível." }, 503);
  await ensureTables(env.DB);

  if (request.method === "GET") {
    const row = await env.DB.prepare("SELECT anthropic_key_last_four, updated_at FROM user_settings WHERE user_email = ?")
      .bind(user.username).first<{ anthropic_key_last_four: string | null; updated_at: string | null }>();
    return json({
      email: user.username,
      configured: Boolean(row?.anthropic_key_last_four),
      lastFour: row?.anthropic_key_last_four || "",
      updatedAt: row?.updated_at || "",
    });
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM user_settings WHERE user_email = ?").bind(user.username).run();
    return json({ ok: true });
  }

  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (!env.APP_ENCRYPTION_KEY) return json({ error: "A proteção das configurações ainda não foi ativada." }, 503);

  let apiKey = "";
  try {
    const body = await request.json() as { apiKey?: string };
    apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }
  if (apiKey.length < 30) return json({ error: "A chave parece incompleta." }, 400);

  let validation: Response;
  try {
    validation = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    });
  } catch {
    return json({ error: "Não consegui validar a chave com a Anthropic agora." }, 502);
  }
  if (!validation.ok) return json({ error: validation.status === 401 ? "A Anthropic não aceitou essa chave." : "A Anthropic não conseguiu validar essa chave agora." }, 400);

  const protectedKey = await encryptSecret(apiKey, env.APP_ENCRYPTION_KEY);
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO user_settings
    (user_email, anthropic_key_ciphertext, anthropic_key_iv, anthropic_key_last_four, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_email) DO UPDATE SET
      anthropic_key_ciphertext = excluded.anthropic_key_ciphertext,
      anthropic_key_iv = excluded.anthropic_key_iv,
      anthropic_key_last_four = excluded.anthropic_key_last_four,
      updated_at = excluded.updated_at`)
    .bind(user.username, protectedKey.ciphertext, protectedKey.iv, apiKey.slice(-4), now, now).run();
  return json({ ok: true, configured: true, lastFour: apiKey.slice(-4), updatedAt: now });
}

async function anthropicKeyFor(username: string, env: Env) {
  if (!env.DB || !env.APP_ENCRYPTION_KEY) return null;
  await ensureTables(env.DB);
  const row = await env.DB.prepare("SELECT anthropic_key_ciphertext, anthropic_key_iv FROM user_settings WHERE user_email = ?")
    .bind(username).first<{ anthropic_key_ciphertext: string | null; anthropic_key_iv: string | null }>();
  if (!row?.anthropic_key_ciphertext || !row.anthropic_key_iv) return null;
  return decryptSecret(row.anthropic_key_ciphertext, row.anthropic_key_iv, env.APP_ENCRYPTION_KEY);
}

function extractRadarJson(content: Array<{ type?: string; text?: string }>) {
  const text = content.filter((block) => block.type === "text" && block.text).map((block) => block.text).join("\n");
  const tagged = text.match(/<RADAR_JSON>\s*([\s\S]*?)\s*<\/RADAR_JSON>/i)?.[1];
  const candidate = (tagged || text).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
    throw new Error("invalid_radar_response");
  }
}

async function handleRadar(request: Request, env: Env) {
  const user = await sessionUser(request, env);
  if (!user) return json({ error: "Sua sessão expirou. Entre novamente para usar o Radar." }, 401);
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const anthropicApiKey = await anthropicKeyFor(user.username, env);
  if (!anthropicApiKey) return json({ code: "missing_key", error: "Cadastre a chave da Anthropic em Conta para usar o Radar." }, 503);

  let input: RadarRequest;
  try {
    input = await request.json() as RadarRequest;
  } catch {
    return json({ error: "Pedido inválido." }, 400);
  }

  const today = saoPauloEditorialNow();
  const requestedLens = typeof input.lens === "string" ? input.lens : "";
  const lens = lensRules[requestedLens] ? requestedLens : today.lens;
  const mode = input.mode === "specific" || input.mode === "moment" || input.mode === "explore" ? input.mode : "explore";
  const prompt = typeof input.prompt === "string" ? input.prompt.trim().slice(0, 4000) : "";
  const avoid = typeof input.avoid === "string" ? input.avoid.trim().slice(0, 1200) : "";
  if (!lensRules[lens]) return json({ error: "Escolha uma lente válida." }, 400);
  if (mode !== "explore" && !prompt) return json({ error: "Conte de onde a busca deve partir." }, 400);

  const specialLearningRules = lens === "Aprender" ? `\nREGRAS ESPECÍFICAS DE APRENDER
- Aprender não é sinônimo de curso e não deve se concentrar em IA ou em um único tema.
- Varie escala, assunto e formato: utilidade prática, curiosidade quase inútil mas deliciosa, cultura/comportamento, algo fora da bolha e no máximo um curso estruturado.
- Dica básica não basta. Procure o detalhe que gere “como eu não sabia disso?”.
- Tecnologia cotidiana deve privilegiar funções nativas pouco conhecidas, combinações de recursos e possibilidades práticas, não atalhos elementares.
- Comparações linguísticas devem usar exemplos neutros e curiosos, sem termos ofensivos, sexuais ou discriminatórios.
- O achado precisa poder ser compreendido ou avaliado inicialmente em até 20 minutos, mesmo que permita aprofundamento depois.` : "";

  const system = `Você conduz o Radar editorial do projeto brasileiro “Antes que eu esqueça”, criado pela Camis.

CONTEXTO DE DATA
- Agora, pelo horário oficial de São Paulo, é ${today.dateLabel}.
- A editoria oficial de hoje é ${today.lens}.
- A busca atual está usando ${lens}${lens !== today.lens ? ", escolhida manualmente no painel pela Camis" : ""}.
- Nunca assuma domingo, nem use uma data fixa. Para atualidade, considere esta data como referência.

PRINCÍPIO CENTRAL
- O texto da Camis é uma SEMENTE, não uma resposta pronta e nem uma consulta literal.
- Nunca devolva cinco paráfrases do que ela escreveu.
- Antes de pesquisar, abra internamente de 6 a 10 rotas diferentes para a mesma semente. Inclua, quando fizer sentido: rota direta; adjacência inesperada; contraponto; mudança de escala; exemplo brasileiro ou próximo do cotidiano; outra disciplina; pessoa/projeto que materialize a ideia; e uma interpretação que a Camis provavelmente não escreveria sozinha.
- Não mostre essas rotas no resultado. Use-as para pesquisar melhor.
- Se a Camis trouxer um exemplo, ele não deve virar automaticamente uma sugestão. Trate-o como pista para descobrir coisas além dele.

REGRA DE QUALIDADE
- A unidade do Radar não é “tema”. É “motivo real para querer abrir isso”.
- Cada sugestão precisa ter um gancho diferente. Se quatro itens poderiam morar no mesmo artigo, descarte e procure de novo.
- Evite cinco achados da mesma bolha, cinco ferramentas, cinco pesquisas, cinco perfis ou cinco versões da mesma tese.
- Quando houver qualidade, misture proximidade brasileira/cotidiana, utilidade, repertório cultural ou comportamental, algo fora da bolha e no máximo um achado internacional muito conceitual.
- Prefira achados específicos e testáveis a categorias vagas. “Um recurso escondido do gov.br” é melhor que “produtividade digital”. “Uma artista que transformou micélio em instalação têxtil” é melhor que “arte sustentável”.
- Surpresa sem substância não entra. Utilidade óbvia sem descoberta também não.
- Não force cinco posições. Se só 2 ou 3 passarem no filtro, entregue 2 ou 3.
- Não use repetidamente a mesma fonte, domínio ou tipo de publicação quando houver alternativas boas.

REGRAS FIXAS
- A unidade publicada chama-se Guardado. Curadoria pode acontecer todo dia; publicação não é diária.
- O Radar traz possibilidades curtas. Não escreva artigo, edição, arquitetura ou HTML.
- Não invente memórias, opiniões, relações pessoais ou reações da Camis.
- Use busca na web para encontrar destinos atuais e links diretos. Não invente URLs.
- Dê preferência à fonte original. Evite agregadores quando houver fonte primária.
- Explique por que cada item entrou a partir da semente e por que combina com a lente, sem repetir a mesma justificativa em outras palavras.
- Já foram publicados: Bonitezas #001, Reencontros #001, Explorar #001 (“4 sites que eu não conhecia e agora já estão nos meus favoritos”) e Aprender #001 (“Aprender também pode ser descobrir que existem 50 pessoas chamadas Pan”). Evite repetir os mesmos achados: Pingo Utilitários, SP Mais Cultura, Internet Artifacts, Web Design Museum, Elements of AI, Nomes no Brasil, Ações Rápidas do MacBook, comparação de palavras Brasil/Portugal/Itália e os furinhos da caneta BIC.

LENTE ATUAL: ${lens}
CRITÉRIO: ${lensRules[lens]}${specialLearningRules}

ANTES DE RESPONDER, faça uma checagem silenciosa:
1. As sugestões têm motivos diferentes para serem abertas?
2. Alguma é só uma versão literal do texto da Camis? Se sim, substitua.
3. Existe proximidade suficiente com Brasil ou cotidiano quando havia boas opções?
4. Há variedade de formato, escala e assunto?
5. Cada link é direto e verificável?
6. Eu ficaria curioso mesmo sem saber qual foi o prompt original? Se não, continue pesquisando.

Retorne somente um objeto JSON entre as tags <RADAR_JSON> e </RADAR_JSON>, sem markdown e sem texto antes ou depois. Formato:
{"ideas":[{"type":"tipo curto e específico","title":"nome real","description":"o que é em linguagem simples, destacando o detalhe interessante","reason":"por que entrou no radar a partir da semente, sem parafrasear a semente","connection":"por que combina especificamente com ${lens}","time":"tempo para explorar","url":"https://link-direto","verification":"o que foi verificado e o que ainda precisa de exploração manual"}]}`;

  const modeDescription = mode === "specific"
    ? "A Camis trouxe uma pista concreta. Expanda a pista em vertentes antes de pesquisar. Não devolva simplesmente exemplos do que ela já nomeou."
    : mode === "moment"
      ? "A busca parte de algo que a Camis está vivendo ou pensando. Preserve a tensão central, mas traduza isso em rotas editoriais diferentes, inclusive adjacentes e inesperadas."
      : "A Camis quer descoberta de verdade. Abra caminhos variados dentro da lente, sem cair nos mesmos sites, ferramentas, temas cult ou referências internacionais de sempre.";
  const userMessage = `${modeDescription}\n\nSemente escrita pela Camis: ${prompt || "nenhum tema adicional; abra caminhos realmente variados dentro da lente"}\n\nO que ela não quer receber: ${avoid || "nenhuma restrição adicional"}\n\nData de referência em São Paulo: ${today.dateLabel}.`;

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 3400,
        output_config: { effort: "medium" },
        system,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch {
    return json({ error: "Não consegui alcançar a busca do Claude agora. Tente novamente em alguns instantes." }, 502);
  }

  if (!response.ok) {
    const message = response.status === 401 ? "A chave da Anthropic não foi aceita." : response.status === 429 ? "O limite da API foi atingido. Espere um pouco e tente novamente." : "Claude não conseguiu concluir esta busca agora.";
    return json({ error: message }, response.status === 401 ? 503 : 502);
  }

  try {
    const message = await response.json() as { content?: Array<{ type?: string; text?: string }> };
    const parsed = extractRadarJson(message.content || []) as { ideas?: Array<Record<string, unknown>> };
    const ideas = Array.isArray(parsed.ideas) ? parsed.ideas.slice(0, 5).filter((idea) => typeof idea.title === "string" && typeof idea.url === "string").map((idea, index) => ({
      id: index + 1,
      type: String(idea.type || "achado"),
      title: String(idea.title),
      description: String(idea.description || ""),
      reason: String(idea.reason || ""),
      connection: String(idea.connection || lens),
      time: String(idea.time || "a conferir"),
      url: String(idea.url),
      verification: String(idea.verification || "link encontrado; exploração manual pendente"),
      status: "idle",
    })) : [];
    if (!ideas.length) return json({ error: "Claude não encontrou sugestões verificáveis para este rumo. Tente deixar o recorte um pouco mais aberto." }, 422);
    return json({ ideas, today: { lens: today.lens, dateLabel: today.dateLabel } });
  } catch {
    return json({ error: "Claude pesquisou, mas devolveu o Radar em um formato inesperado. Tente novamente." }, 502);
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/auth/status") return handleAuthStatus(request, env);
    if (url.pathname === "/api/auth/setup") return handleSetup(request, env);
    if (url.pathname === "/api/auth/login") return handleLogin(request, env);
    if (url.pathname === "/api/auth/logout") return handleLogout(request, env);
    if (url.pathname === "/api/account") return handleAccount(request, env);
    if (url.pathname === "/api/radar") return handleRadar(request, env);

    const response = await handler.fetch(request, env, ctx);
    return request.method === "GET" ? patchDashboardForToday(response) : response;
  },
} satisfies ExportedHandler<Env>;

export default worker;