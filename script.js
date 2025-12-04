// Guardar rol en login
function selectRole(role) {
    localStorage.setItem("rol", role);
}

// Redirigir después de login
function loginUser() {
    const role = localStorage.getItem("rol");

    if (role === "cliente") {
        window.location.href = "dashboard-cliente.html";
    } else if (role === "bpo") {
        window.location.href = "dashboard-bpo.html";
    } else {
        alert("Selecciona un rol antes de continuar.");
    }
}

// Simular envío de mensajes
function sendMessage() {
    const input = document.getElementById("messageInput");
    const chatBox = document.getElementById("chatBox");

    if (input.value.trim() !== "") {
        chatBox.innerHTML += `
            <div class="card">
                <strong>Tú:</strong> ${input.value}
            </div>
        `;
    }

    input.value = "";
}
