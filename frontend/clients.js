document.addEventListener("DOMContentLoaded", () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const form = document.getElementById("clientForm");
  const list = document.getElementById("clientList");
  const clearButton = document.getElementById("clearClientForm");
  const refreshButton = document.getElementById("refreshClients");

  const resetForm = () => {
    form.reset();
    form.elements.client_id.value = "";
  };

  const renderClients = (clients) => {
    if (!clients.length) {
      list.innerHTML = '<div class="box">No clients found.</div>';
      return;
    }

    list.innerHTML = clients
      .map(
        (client) => `
          <div class="list-item">
            <div class="list-head">
              <div>
                <h3>${client.name}</h3>
                <p class="simple-text">${client.email} | ${client.phone}</p>
              </div>
              <span class="tag">Client ${client.client_id}</span>
            </div>
            <p>${client.address}</p>
            <div class="button-row">
              <button type="button" class="secondary" data-edit="${client.client_id}">Edit</button>
              <button type="button" class="danger" data-delete="${client.client_id}">Archive</button>
            </div>
          </div>
        `,
      )
      .join("");
  };

  const loadClients = async () => {
    try {
      const clients = await ClientHub.apiRequest("/clients/get-clients");
      renderClients(clients);
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    ClientHub.clearMessage();

    const clientId = form.elements.client_id.value;
    const url = clientId
      ? `/clients/update-client/${clientId}`
      : "/clients/add-client";

    try {
      await ClientHub.apiRequest(url, {
        method: clientId ? "PUT" : "POST",
        body: ClientHub.createFormData(form),
      });

      resetForm();
      ClientHub.showMessage("Client saved successfully.", "success");
      await loadClients();
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  });

  list.addEventListener("click", async (event) => {
    const editId = event.target.getAttribute("data-edit");
    const deleteId = event.target.getAttribute("data-delete");

    if (editId) {
      try {
        const client = await ClientHub.apiRequest(`/clients/get-client/${editId}`);
        form.elements.client_id.value = client.client_id;
        form.elements.name.value = client.name || "";
        form.elements.email.value = client.email || "";
        form.elements.phone.value = client.phone || "";
        form.elements.address.value = client.address || "";
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        ClientHub.showMessage(error.message, "error");
      }
      return;
    }

    if (deleteId) {
      try {
        await ClientHub.apiRequest(`/clients/delete-client/${deleteId}`, {
          method: "DELETE",
        });
        ClientHub.showMessage("Client archived successfully.", "success");
        await loadClients();
      } catch (error) {
        ClientHub.showMessage(error.message, "error");
      }
    }
  });

  clearButton.addEventListener("click", resetForm);
  refreshButton.addEventListener("click", loadClients);

  loadClients();
});
