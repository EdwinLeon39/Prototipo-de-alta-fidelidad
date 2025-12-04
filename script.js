

/* ---------- Utilidades de rol y navegación ---------- */
function setRole(role){
  localStorage.setItem("bpo_role", role);
  // Keep for login page UX
  const btns = document.querySelectorAll(".role-btn");
  btns.forEach(b=>b.classList.remove("active"));
  const sel = document.querySelector(`[data-role="${role}"]`);
  if(sel) sel.classList.add("active");
}

function getRole(){
  return localStorage.getItem("bpo_role") || null;
}

function requireRoleRedirect(){

  const role = getRole();
  if(!role){
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function logout(){
  localStorage.removeItem("bpo_role");
  window.location.href = "index.html";
}

/* ---------- Documentos (simulado) ---------- */
function uploadDocument(meta){
  // meta: {name, desc, uploadedBy}
  const docs = JSON.parse(localStorage.getItem("bpo_docs") || "[]");
  docs.unshift({
    id:Date.now(),
    name: meta.name || "documento.pdf",
    desc: meta.desc || "",
    uploadedBy: meta.uploadedBy || "cliente",
    date: new Date().toLocaleString(),
    status: "Enviado"
  });
  localStorage.setItem("bpo_docs", JSON.stringify(docs));
}

function listDocuments(){
  return JSON.parse(localStorage.getItem("bpo_docs") || "[]");
}

/* ---------- Projecto (simulado) ---------- */
function createProject(project){
  // project: {title, client, bpo, desc}
  const projects = JSON.parse(localStorage.getItem("bpo_projects") || "[]");
  projects.unshift({
    id: Date.now(),
    title: project.title,
    client: project.client || "Cliente X",
    bpo: project.bpo || "BPO X",
    desc: project.desc || "",
    status: "En revisión",
    created: new Date().toLocaleString()
  });
  localStorage.setItem("bpo_projects", JSON.stringify(projects));
}

function listProjects(){
  return JSON.parse(localStorage.getItem("bpo_projects") || "[]");
}

/* ---------- Chat  ---------- */
function sendChat(room, author, text){
  if(!text || !room) return;
  const key = "bpo_chat_"+room;
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.push({
    id:Date.now(),
    author: author,
    text: text,
    time: new Date().toLocaleTimeString()
  });
  localStorage.setItem(key, JSON.stringify(arr));
}

function getChat(room){
  const key = "bpo_chat_"+room;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

/
function initLoginPage(){
  // highlight previously chosen role
  const r = getRole();
  if(r){
    const el = document.querySelector(`[data-role="${r}"]`);
    if(el) el.classList.add("active");
  }
}

function initDashboardCliente(){
  if(!requireRoleRedirect()) return;
    
 
  const docs = listDocuments();
  const projects = listProjects();
  document.getElementById("docCount").innerText = docs.length;
  document.getElementById("projCount").innerText = projects.length;
}

function initDashboardBPO(){
  if(!requireRoleRedirect()) return;
  const docs = listDocuments();
  const projects = listProjects();
  document.getElementById("docCountB").innerText = docs.length;
  document.getElementById("projCountB").innerText = projects.length;
}

function initBuscar(){
    

  const container = document.getElementById("results");
  const sample = [
    {name:"GlobalBPO Solutions", sector:"Servicios empresariales", score:4.7},
    {name:"OutsourcePro Ltd.", sector:"Back-office", score:4.3},
    {name:"DocsSecure SAS", sector:"Gestión documental", score:4.9}
  ];
  sample.forEach(s=>{
    const div = document.createElement("div");
    div.className = "result-card";
    div.innerHTML = `<h4>${s.name}</h4>
      <div style="font-size:13px;color:var(--muted)">${s.sector}</div>
      <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between">
        <div><span class="badge">${s.score} ★</span></div>
        <div>
          <button class="btn btn-ghost" onclick="openProfile('${s.name}')">Ver perfil</button>
          <button class="btn btn-primary" onclick="openCreateProject('${s.name}')">Iniciar proyecto</button>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function openProfile(name){
  alert("Abrir perfil: " + name + " (simulado).");
}

function openCreateProject(bpoName){
  const title = prompt("Nombre del proyecto a crear con " + bpoName + ":","Proyecto de prueba");
  if(title){
    createProject({title: title, client: getRole()==="cliente" ? "Cliente (tú)" : "Cliente X", bpo: bpoName, desc:"Generado desde búsqueda"});
    alert("Proyecto creado: " + title);
    // reload counts if on dashboard
    try{ initDashboardCliente(); initDashboardBPO(); }catch(e){}
  }
}


function handleUploadForm(e){
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const desc = document.getElementById("fileDesc").value;
  if(fileInput.files.length === 0){
    alert("Selecciona un archivo (simulado)");
    return;
  }
  const filename = fileInput.files[0].name;
  uploadDocument({name:filename, desc:desc, uploadedBy:getRole() || "cliente"});
  alert("Archivo subido (simulado): " + filename);
  // reset
  fileInput.value = "";
  document.getElementById("fileDesc").value = "";
}


function renderDocumentsList(){
  const list = listDocuments();
  const container = document.getElementById("docsList");
  if(!container) return;
  container.innerHTML = "";
  if(list.length===0) container.innerHTML = `<div class="card">No hay documentos cargados.</div>`;
  list.forEach(d=>{
    const el = document.createElement("div");
    el.className = "file-row";
    el.innerHTML = `<div>
        <strong>${d.name}</strong><div style="font-size:13px;color:var(--muted)">${d.desc}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;color:var(--muted)">${d.uploadedBy} • ${d.date}</div>
        <div style="margin-top:8px"><button class="btn btn-ghost" onclick="alert('Descargar simulado: ${d.name}')">Descargar</button></div>
      </div>`;
    container.appendChild(el);
  });
}

function renderProjectsList(){
  const list = listProjects();
  const container = document.getElementById("projectsList");
  if(!container) return;
  container.innerHTML = "";
  if(list.length===0) container.innerHTML = `<div class="card">No hay proyectos.</div>`;
  list.forEach(p=>{
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h3 style="margin:0">${p.title}</h3>
        <div style="color:var(--muted);font-size:13px">${p.client} • ${p.bpo} • ${p.created}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">${p.status}</div>
        <div style="margin-top:8px">
          <button class="btn btn-primary" onclick="openProject(${p.id})">Abrir</button>
        </div>
      </div>
    </div>`;
    container.appendChild(el);
  });
}

function openProject(id){
  const projs = listProjects();
  const p = projs.find(x=>x.id===id);
  if(!p) return alert("Proyecto no encontrado");
  localStorage.setItem("bpo_current_project", JSON.stringify(p));
  window.location.href = "proyectos.html#open";
}

/* ---------- Chat ayuda ---------- */
function initChatPage(){
  // room depends on role (simple demo): chat with "OrgX"
  const room = "room_general";
  const chatBox = document.getElementById("chatBox");
  if(!chatBox) return;
  chatBox.innerHTML = "";
  const messages = getChat(room);
  messages.forEach(m=>{
    const div = document.createElement("div");
    div.className = "msg " + (m.author==="me" ? "me" : "other");
    div.innerHTML = `<div style="font-size:13px;font-weight:700">${m.author==="me" ? "Tú" : "BPO"}</div>
      <div style="margin-top:6px">${m.text}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px">${m.time}</div>`;
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendChatFromPage(){
  const txt = document.getElementById("chatInput").value;
  if(!txt) return;
  sendChat("room_general", "me", txt);
  initChatPage();
  document.getElementById("chatInput").value="";
}


document.addEventListener("DOMContentLoaded", function(){

  try{
    if(document.body.dataset.page === "login") initLoginPage();
    if(document.body.dataset.page === "dash-client") initDashboardCliente();
    if(document.body.dataset.page === "dash-bpo") initDashboardBPO();
    if(document.body.dataset.page === "buscar") initBuscar();
    if(document.body.dataset.page === "docs") renderDocumentsList();
    if(document.body.dataset.page === "projects") renderProjectsList();
    if(document.body.dataset.page === "chat") initChatPage();
  }catch(e){}
});
