
/* script.js - Versión mejorada: chats por cliente, evaluación de documentos, roles con ids */

/* ==========================
   UTILIDADES DE ROL & USUARIO
   ========================== */
function generateId(prefix="id"){
  return prefix + "_" + Math.random().toString(36).slice(2,10);
}

function setRole(role){
  // store role
  localStorage.setItem("bpo_role", role);

  // ensure user identity exists
  if(role === "cliente"){
    if(!localStorage.getItem("bpo_client_id")){
      const cid = generateId("client");
      localStorage.setItem("bpo_client_id", cid);
      // optionally ask for display name
      const name = prompt("Ingresa tu nombre (será visible al BPO en el chat):", "Cliente " + cid.slice(-4)) || ("Cliente " + cid.slice(-4));
      localStorage.setItem("bpo_client_name", name);
    }
  } else if(role === "bpo"){
    if(!localStorage.getItem("bpo_bpo_id")){
      const bid = generateId("bpo");
      localStorage.setItem("bpo_bpo_id", bid);
      const name = prompt("Ingresa nombre de la organización BPO (aparecerá en chats):", "BPO " + bid.slice(-4)) || ("BPO " + bid.slice(-4));
      localStorage.setItem("bpo_bpo_name", name);
    }
  }

  // UI nicety: mark active class if any buttons
  const btns = document.querySelectorAll(".role-btn");
  btns.forEach(b=>b.classList.remove("active"));
  const sel = document.querySelector(`[data-role="${role}"]`);
  if(sel) sel.classList.add("active");
}

function getRole(){
  return localStorage.getItem("bpo_role") || null;
}

function getClientId(){
  return localStorage.getItem("bpo_client_id") || null;
}
function getClientName(){
  return localStorage.getItem("bpo_client_name") || null;
}
function getBpoId(){
  return localStorage.getItem("bpo_bpo_id") || null;
}
function getBpoName(){
  return localStorage.getItem("bpo_bpo_name") || null;
}

function logout(){
  // keep identity but remove active role
  localStorage.removeItem("bpo_role");
  window.location.href = "index.html";
}

function requireRoleRedirect(){
  const r = getRole();
  if(!r){
    window.location.href = "login.html";
    return false;
  }
  return true;
}

/* ==========================
   DOCUMENTS (PERSISTENTE)
   ========================== */
function _getDocs(){
  return JSON.parse(localStorage.getItem("bpo_docs") || "[]");
}
function _saveDocs(arr){
  localStorage.setItem("bpo_docs", JSON.stringify(arr));
}

function uploadDocument(meta){
  // meta: {name, desc, uploadedByClientId (optional), uploadedByRole}
  const docs = _getDocs();
  docs.unshift({
    id: generateId("doc"),
    name: meta.name || "documento.pdf",
    desc: meta.desc || "",
    uploadedByRole: meta.uploadedByRole || (getRole() || "cliente"),
    uploadedByClientId: meta.uploadedByClientId || (getClientId() || null),
    date: new Date().toLocaleString(),
    status: "Enviado" // Enviado / Revisado / Aprobado / Rechazado
  });
  _saveDocs(docs);
}

function listDocuments(){
  return _getDocs();
}

function setDocumentStatus(docId, status){
  const docs = _getDocs();
  const idx = docs.findIndex(d=>d.id===docId);
  if(idx===-1) return false;
  docs[idx].status = status;
  _saveDocs(docs);
  return true;
}

/* ==========================
   PROJECTS (PERSISTENTE)
   ========================== */
function _getProjects(){
  return JSON.parse(localStorage.getItem("bpo_projects") || "[]");
}
function _saveProjects(arr){
  localStorage.setItem("bpo_projects", JSON.stringify(arr));
}

function createProject(project){
  // project: {title, clientId, clientName, bpoId, bpoName, desc}
  const projects = _getProjects();
  projects.unshift({
    id: generateId("proj"),
    title: project.title || "Proyecto",
    clientId: project.clientId || getClientId() || null,
    clientName: project.clientName || getClientName() || "Cliente",
    bpoId: project.bpoId || getBpoId() || null,
    bpoName: project.bpoName || getBpoName() || "BPO",
    desc: project.desc || "",
    status: "En revisión",
    created: new Date().toLocaleString()
  });
  _saveProjects(projects);
}

function listProjects(){
  return _getProjects();
}

/* ==========================
   CHAT (PERSISTENTE POR SALA)
   ========================== */
function _roomKeyForClient(clientId){
  return "bpo_chat_room_client_" + clientId;
}

function sendChatToRoom(roomKey, msgObj){
  // msgObj: {authorType: "client"|"bpo", authorId, authorName, text, time}
  if(!roomKey || !msgObj) return;
  const arr = JSON.parse(localStorage.getItem(roomKey) || "[]");
  arr.push(msgObj);
  localStorage.setItem(roomKey, JSON.stringify(arr));
}

function getChat(roomKey){
  return JSON.parse(localStorage.getItem(roomKey) || "[]");
}

function listAllChatRooms(){
  // scan localStorage keys for chat rooms
  const rooms = [];
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(key && key.startsWith("bpo_chat_room_client_")){
      rooms.push(key);
    }
  }
  // return array of objects {roomKey, clientId}
  return rooms.map(k=>({roomKey:k, clientId: k.replace("bpo_chat_room_client_","")}));
}

/* Helper to send from current user depending on role */
function sendChatCurrentRoom(roomKey, text){
  if(!text || !roomKey) return;
  const role = getRole();
  if(role === "cliente"){
    sendChatToRoom(roomKey, {
      authorType: "client",
      authorId: getClientId(),
      authorName: getClientName(),
      text: text,
      time: new Date().toLocaleTimeString()
    });
  } else if(role === "bpo"){
    sendChatToRoom(roomKey, {
      authorType: "bpo",
      authorId: getBpoId(),
      authorName: getBpoName(),
      text: text,
      time: new Date().toLocaleTimeString()
    });
  } else {
    return;
  }
}

/* ==========================
   RENDER / INIT FUNCIONES
   ========================== */

/* Login page init: highlight role; ensure name prompts when role chosen */
function initLoginPage(){
  const r = getRole();
  if(r){
    const el = document.querySelector(`[data-role="${r}"]`);
    if(el) el.classList.add("active");
  }

  // Attach click to role buttons to also create identity if absent
  const roleBtns = document.querySelectorAll(".role-btn");
  roleBtns.forEach(b=>{
    b.addEventListener("click", function(){
      const role = this.dataset.role;
      setRole(role);
    });
  });
}

/* Dashboard Cliente */
function initDashboardCliente(){
  if(!requireRoleRedirect()) return;
  // render some counts
  const docs = listDocuments().filter(d=> d.uploadedByClientId === getClientId());
  const projects = listProjects().filter(p=> p.clientId === getClientId());
  const docEl = document.getElementById("docCount");
  const projEl = document.getElementById("projCount");
  if(docEl) docEl.innerText = docs.length;
  if(projEl) projEl.innerText = projects.length;
}

/* Dashboard BPO */
function initDashboardBPO(){
  if(!requireRoleRedirect()) return;
  const docs = listDocuments();
  const projects = listProjects();
  const docEl = document.getElementById("docCountB");
  const projEl = document.getElementById("projCountB");
  if(docEl) docEl.innerText = docs.length;
  if(projEl) projEl.innerText = projects.length;
}

/* Buscar page */
function initBuscar(){
  const container = document.getElementById("results");
  if(!container) return;
  container.innerHTML = "";
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

/* abrir perfil - demo */
function openProfile(name){
  alert("Abrir perfil: " + name + " (simulado).");
}

/* crear proyecto desde search */
function openCreateProject(bpoName){
  const title = prompt("Nombre del proyecto a crear con " + bpoName + ":","Proyecto de prueba");
  if(title){
    createProject({
      title: title,
      clientId: getClientId(),
      clientName: getClientName(),
      bpoId: getBpoId(),
      bpoName: bpoName,
      desc: "Creado desde búsqueda"
    });
    alert("Proyecto creado: " + title);
    // update dashboards
    try{ initDashboardCliente(); initDashboardBPO(); }catch(e){}
  }
}

/* Subir documento form handler */
function handleUploadForm(e){
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const desc = document.getElementById("fileDesc").value;
  if(!fileInput) return alert("No hay input file en esta página.");
  if(fileInput.files.length === 0){
    alert("Selecciona un archivo (simulado)");
    return;
  }
  const filename = fileInput.files[0].name;
  uploadDocument({
    name: filename,
    desc: desc,
    uploadedByClientId: getClientId(),
    uploadedByRole: getRole()
  });
  alert("Archivo subido (simulado): " + filename);
  // reset
  fileInput.value = "";
  if(document.getElementById("fileDesc")) document.getElementById("fileDesc").value = "";
  renderDocumentsList(); // update list
}

/* Render documents list with actions depending on role */
function renderDocumentsList(){
  const list = listDocuments();
  const container = document.getElementById("docsList");
  if(!container) return;
  container.innerHTML = "";
  if(list.length===0){
    container.innerHTML = `<div class="card">No hay documentos cargados.</div>`;
    return;
  }
  list.forEach(d=>{
    const el = document.createElement("div");
    el.className = "file-row";
    // left: info
    const left = document.createElement("div");
    left.innerHTML = `<strong>${d.name}</strong><div style="font-size:13px;color:var(--muted)">${d.desc}</div>`;
    // right: meta + actions
    const right = document.createElement("div");
    right.style.textAlign = "right";
    right.innerHTML = `<div style="font-size:12px;color:var(--muted)">${d.uploadedByRole}${d.uploadedByClientId ? " • " + (d.uploadedByClientId.slice(-4)) : ""} • ${d.date}</div>
      <div style="margin-top:8px"><span class="badge">${d.status}</span></div>`;

    // actions depending on role
    const role = getRole();
    const actionsDiv = document.createElement("div");
    actionsDiv.style.marginTop = "8px";
    if(role === "bpo"){
      // BPO can mark statuses
      const btnReview = document.createElement("button");
      btnReview.className = "btn btn-ghost";
      btnReview.innerText = "Marcar Revisado";
      btnReview.onclick = function(){ setDocumentStatus(d.id, "Revisado"); renderDocumentsList(); initDashboardBPO(); };

      const btnApprove = document.createElement("button");
      btnApprove.className = "btn btn-primary";
      btnApprove.style.marginLeft = "8px";
      btnApprove.innerText = "Aprobar";
      btnApprove.onclick = function(){ setDocumentStatus(d.id, "Aprobado"); renderDocumentsList(); initDashboardBPO(); };

      const btnReject = document.createElement("button");
      btnReject.className = "btn";
      btnReject.style.marginLeft = "8px";
      btnReject.innerText = "Rechazar";
      btnReject.onclick = function(){ setDocumentStatus(d.id, "Rechazado"); renderDocumentsList(); initDashboardBPO(); };

      actionsDiv.appendChild(btnReview);
      actionsDiv.appendChild(btnApprove);
      actionsDiv.appendChild(btnReject);
    } else {
      // Cliente: can download/view
      const btnDownload = document.createElement("button");
      btnDownload.className = "btn btn-ghost";
      btnDownload.innerText = "Descargar";
      btnDownload.onclick = function(){ alert("Descarga simulada: " + d.name); };
      actionsDiv.appendChild(btnDownload);
    }
    right.appendChild(actionsDiv);

    el.appendChild(left);
    el.appendChild(right);
    container.appendChild(el);
  });
}

/* Render projects list */
function renderProjectsList(){
  const list = listProjects();
  const container = document.getElementById("projectsList");
  if(!container) return;
  container.innerHTML = "";
  if(list.length===0){
    container.innerHTML = `<div class="card">No hay proyectos.</div>`;
    return;
  }
  list.forEach(p=>{
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h3 style="margin:0">${p.title}</h3>
        <div style="color:var(--muted);font-size:13px">${p.clientName} • ${p.bpoName} • ${p.created}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">${p.status}</div>
        <div style="margin-top:8px">
          <button class="btn btn-primary" onclick="openProject('${p.id}')">Abrir</button>
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

/* Init projects page detail extraction */
function initProjectsPage(){
  renderProjectsList();
  // if project open anchor
  if(window.location.hash === "#open"){
    const cur = JSON.parse(localStorage.getItem("bpo_current_project") || "null");
    if(cur){
      const area = document.getElementById("projectDetailArea");
      if(area){
        area.innerHTML = `<div class="card">
          <h3>${cur.title}</h3>
          <div style="color:var(--muted);font-size:13px">${cur.clientName} • ${cur.bpoName} • ${cur.created}</div>
          <p style="margin-top:12px">${cur.desc}</p>
          <div style="margin-top:12px">
            <button class="btn btn-primary" onclick="openProjectChat('${cur.clientId}')">Abrir chat del proyecto</button>
            <button class="btn" onclick="window.location.hash=''">Cerrar</button>
          </div>
        </div>`;
      }
    }
  }
}

/* ==========================
   CHAT UI: clientes múltiples
   ========================== */

function initChatPage(){
  if(!requireRoleRedirect()) return;
  const role = getRole();
  const chatBox = document.getElementById("chatBox");
  const roomsContainer = document.getElementById("chatRooms");
  const roomHeader = document.getElementById("chatRoomHeader");
  const sendBtn = document.getElementById("chatSendBtn");
  const inputField = document.getElementById("chatInput");

  if(role === "cliente"){
    // Client: open only its room
    const cid = getClientId();
    const roomKey = _roomKeyForClient(cid);
    if(roomHeader) roomHeader.innerText = "Chat con BPO (Sala: " + getClientName() + ")";
    renderChatRoom(roomKey);
    // send handler
    if(sendBtn) sendBtn.onclick = function(){ const txt = inputField.value.trim(); if(!txt)return; sendChatCurrentRoom(roomKey, txt); renderChatRoom(roomKey); inputField.value="";};
  } else if(role === "bpo"){
    // BPO: list rooms and allow opening any
    // render list of rooms
    if(roomsContainer){
      roomsContainer.innerHTML = "";
      const rooms = listAllChatRooms(); // [{roomKey, clientId}]
      if(rooms.length === 0){
        roomsContainer.innerHTML = `<div class="card">No hay chats activos. Espera que clientes inicien conversación o suban documentos.</div>`;
      } else {
        rooms.forEach(r=>{
          // fetch last message/time and client name if available
          const msgs = getChat(r.roomKey);
          const last = msgs[msgs.length-1];
          const clientName = (last && last.authorType==="client" && last.authorName) ? last.authorName : (localStorage.getItem("bpo_client_name") || r.clientId);
          const btn = document.createElement("div");
          btn.className = "result-card";
          btn.innerHTML = `<strong>${clientName}</strong><div style="font-size:13px;color:var(--muted)">${r.clientId}</div>
            <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
              <div style="font-size:12px;color:var(--muted)">${ last ? (last.time + " • " + (last.authorName || "")) : "" }</div>
              <div>
                <button class="btn btn-primary" onclick="openChatRoom('${r.roomKey}')">Abrir</button>
              </div>
            </div>`;
          roomsContainer.appendChild(btn);
        });
      }
    }

    // default: if a room is opened via query param or localStorage, open it
    const openRoom = localStorage.getItem("bpo_open_chat_room");
    if(openRoom){
      openChatRoom(openRoom);
    } else {
      if(roomHeader) roomHeader.innerText = "Seleccione un chat (BPO)";
      if(chatBox) chatBox.innerHTML = `<div style="color:var(--muted)">Seleccione un chat a la izquierda para ver mensajes.</div>`;
      if(sendBtn) sendBtn.onclick = ()=>alert("Selecciona primero una sala para enviar mensajes.");
    }
  }
}

/* Render chat room messages into #chatBox */
function renderChatRoom(roomKey){
  const chatBox = document.getElementById("chatBox");
  if(!chatBox) return;
  const msgs = getChat(roomKey);
  chatBox.innerHTML = "";
  msgs.forEach(m=>{
    const div = document.createElement("div");
    // choose classes: if current user authored the msg -> .me, else .other
    const role = getRole();
    let isMe = false;
    if(role === "cliente" && m.authorType === "client" && m.authorId === getClientId()) isMe = true;
    if(role === "bpo" && m.authorType === "bpo" && m.authorId === getBpoId()) isMe = true;

    div.className = "msg " + (isMe ? "me" : "other");
    div.innerHTML = `<div style="font-size:13px;font-weight:700">${m.authorName || (m.authorType)}</div>
      <div style="margin-top:6px">${m.text}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px">${m.time}</div>`;
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* BPO opens specific chat room */
function openChatRoom(roomKey){
  // store as open
  localStorage.setItem("bpo_open_chat_room", roomKey);
  // show header
  const header = document.getElementById("chatRoomHeader");
  const clientId = roomKey.replace("bpo_chat_room_client_","");
  // try to find last clientName in messages
  const msgs = getChat(roomKey);
  const lastClientMsg = msgs.slice().reverse().find(m=>m.authorType==="client");
  const clientName = lastClientMsg ? lastClientMsg.authorName : ("Cliente " + clientId.slice(-4));
  if(header) header.innerText = "Chat con: " + clientName;
  // render messages
  renderChatRoom(roomKey);
  // attach send handler
  const sendBtn = document.getElementById("chatSendBtn");
  const inputField = document.getElementById("chatInput");
  if(sendBtn){
    sendBtn.onclick = function(){
      const txt = inputField.value.trim();
      if(!txt) return;
      // send as BPO
      sendChatToRoom(roomKey, {
        authorType: "bpo",
        authorId: getBpoId(),
        authorName: getBpoName(),
        text: txt,
        time: new Date().toLocaleTimeString()
      });
      renderChatRoom(roomKey);
      inputField.value = "";
    };
  }
}

/* Client opens project chat (from project detail) */
function openProjectChat(clientId){
  const roomKey = _roomKeyForClient(clientId);
  // if client opens: redirect to chat page and show their room
  localStorage.setItem("bpo_open_chat_room", roomKey);
  window.location.href = "chat.html";
}

/* send chat helper for client pages where a single room exists */
function sendChatFromClientPage(){
  const cid = getClientId();
  const roomKey = _roomKeyForClient(cid);
  const input = document.getElementById("chatInput");
  if(!input) return;
  const txt = input.value.trim();
  if(!txt) return;
  sendChatCurrentRoom(roomKey, txt);
  // re-render
  renderChatRoom(roomKey);
  input.value = "";
}

/* ==========================
   PAGE ONLOAD HOOKS
   ========================== */

document.addEventListener("DOMContentLoaded", function(){
  try{
    const page = document.body.dataset.page;
    if(page === "login") initLoginPage();
    if(page === "dash-client") initDashboardCliente();
    if(page === "dash-bpo") initDashboardBPO();
    if(page === "buscar") initBuscar();
    if(page === "docs") renderDocumentsList();
    if(page === "projects") initProjectsPage();
    if(page === "chat") initChatPage();
    // generic UI: if there is a docsList on any page, render
    try{ if(document.getElementById("docsList")) renderDocumentsList(); }catch(e){}
  }catch(e){
    console.error("Init error:", e);
  }
});

