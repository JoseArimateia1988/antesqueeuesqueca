
const COLORS = {blush:"#E36888",tangerine:"#F08C21",butter:"#F2D88F",sea:"#6698CC",matcha:"#B4B534"};
const qs = new URLSearchParams(location.search);
const $ = (s) => document.querySelector(s);

function tagHTML(tag){
  const colors = ["#E36888","#F08C21","#F2D88F","#6698CC","#B4B534"];
  const i = [...tag].reduce((a,c)=>a+c.charCodeAt(0),0)%colors.length;
  return `<a class="tag" style="--tag-color:${colors[i]}" href="gaveta.html?tag=${encodeURIComponent(tag)}">${tag}</a>`;
}
function cardHTML(post){
  return `<a class="post-card" href="artigo.html?slug=${post.slug}" style="--accent:${COLORS[post.accent]}">
    <div class="post-date">${post.date}<br>${post.reading}</div>
    <div><h3>${post.title}</h3><p>${post.excerpt}</p><div class="tags">${post.tags.map(tagHTML).join("")}</div></div>
    <div class="arrow">↗</div>
  </a>`;
}
function renderPosts(list, selector="#posts"){
  const el=$(selector); if(!el) return;
  el.innerHTML=list.map(cardHTML).join("");
}
function initHome(){
  renderPosts(window.POSTS);
  const drawers = {};
  POSTS.forEach(p=>p.tags.forEach(t=>drawers[t]=(drawers[t]||0)+1));
  const colors=Object.values(COLORS);
  const dg=$("#drawer-grid");
  if(dg) dg.innerHTML=Object.entries(drawers).slice(0,9).map(([t,n],i)=>
    `<a class="drawer" href="gaveta.html?tag=${encodeURIComponent(t)}" style="background:${colors[i%colors.length]}">
      <strong>${t}</strong><span>${n} ${n===1?"coisa guardada":"coisas guardadas"} →</span>
    </a>`).join("");
}
function initArticle(){
  const slug=qs.get("slug")||POSTS[0].slug;
  const p=POSTS.find(x=>x.slug===slug)||POSTS[0];
  document.title=`${p.title} | Antes que eu esqueça`;
  document.documentElement.style.setProperty("--accent",COLORS[p.accent]);
  $("#article-title").textContent=p.title;
  $("#article-date").textContent=`${p.date} · ${p.reading}`;
  $("#article-body").innerHTML=p.body.map(x=>`<p>${x}</p>`).join("")+
    `<div class="callout"><strong>Vale guardar porque...</strong><br>${p.why}</div>`;
  $("#article-tags").innerHTML=p.tags.map(tagHTML).join("");
  $("#article-links").innerHTML=p.links.length?p.links.map(l=>`<li><a href="${l.url}">${l.label} ↗</a></li>`).join(""):"<li>Nenhum link externo desta vez.</li>";
  renderPosts(POSTS.filter(x=>x.slug!==p.slug).slice(0,3),"#related");
}
function initDrawer(){
  const tag=qs.get("tag")||"Internet";
  const list=POSTS.filter(p=>p.tags.includes(tag));
  $("#drawer-title").textContent=tag;
  $("#drawer-subtitle").textContent=`${list.length} ${list.length===1?"coisa que fui guardando":"coisas que fui guardando"} por aqui.`;
  renderPosts(list);
}
function initSearch(){
  const input=$("#search-input"), empty=$("#empty");
  const run=()=>{
    const q=input.value.trim().toLowerCase();
    const list=POSTS.filter(p=>[p.title,p.excerpt,...p.tags,...p.body].join(" ").toLowerCase().includes(q));
    renderPosts(list);
    empty.style.display=list.length?"none":"block";
  };
  input.addEventListener("input",run);
  const initial=qs.get("q")||"";
  input.value=initial; run();
}
function initArchive(){
  const el=$("#archive");
  if(el) el.innerHTML=POSTS.map(p=>`<a href="artigo.html?slug=${p.slug}"><strong>${p.title}</strong><br><small>${p.date} · ${p.tags.join(" • ")}</small></a>`).join("");
}
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelector(".menu-btn")?.addEventListener("click",()=>document.querySelector(".nav-links").classList.toggle("open"));
  const page=document.body.dataset.page;
  if(page==="home") initHome();
  if(page==="article") initArticle();
  if(page==="drawer") initDrawer();
  if(page==="search") initSearch();
  initArchive();
  document.querySelector("#home-search")?.addEventListener("submit",e=>{
    e.preventDefault(); const q=e.target.querySelector("input").value; location.href=`busca.html?q=${encodeURIComponent(q)}`;
  });
});
