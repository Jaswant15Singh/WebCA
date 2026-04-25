document.addEventListener("DOMContentLoaded", () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const ITEMS_PER_PAGE = 2;

  const form = document.getElementById("clientForm");
  const list = document.getElementById("clientList");
  const pagination = document.getElementById("clientPagination");
  const clearButton = document.getElementById("clearClientForm");
  const refreshButton = document.getElementById("refreshClients");
  const editModal = document.getElementById("editClientModal");
  const editForm = document.getElementById("editClientForm");
  const cancelEditButton = document.getElementById("cancelClientEdit");

  let allClients = [];
  let currentPage = 1;

  const resetForm = () => {
    form.reset();
    form.elements.client_id.value = "";
  };

  const openEditModal = () => {
    editModal.classList.add("open");
  };

  const closeEditModal = () => {
    editModal.classList.remove("open");
    editForm.reset();
    editForm.elements.client_id.value = "";
  };

  const buildPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    const pageButtons = Array.from({ length: totalPages }, (_, index) => {
      const pageNumber = index + 1;
      return `
        <button
          type="button"
          data-page="${pageNumber}"
          class="${pageNumber === currentPage ? "active" : ""}"
        >
          ${pageNumber}
        </button>
      `;
    }).join("");

    pagination.innerHTML = `
      <button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
      ${pageButtons}
      <button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    `;
  };

  const renderClients = () => {
    if (!allClients.length) {
      list.innerHTML = '<div class="box">No clients found.</div>';
      pagination.innerHTML = "";
      return;
    }

    const totalPages = Math.ceil(allClients.length / ITEMS_PER_PAGE);
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const rows = allClients.slice(start, start + ITEMS_PER_PAGE);

    list.innerHTML = rows
      .map((client) => {
        const imageUrl = ClientHub.getAssetUrl(client.avatar_url);
        const media = imageUrl
          ? `<div class="item-media"><img src="${imageUrl}" alt="${client.name}" /></div>`
          : '<div class="item-media placeholder">No image</div>';

        return `
          <div class="list-item with-media">
            ${media}
            <div class="item-body">
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
                <button type="button" class="danger" data-delete="${client.client_id}">Delete</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    buildPagination(allClients.length);
  };

  const loadClients = async () => {
    try {
      allClients = await ClientHub.apiRequest("/clients/get-clients");
      renderClients();
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
      currentPage = 1;
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
        editForm.elements.client_id.value = client.client_id;
        editForm.elements.name.value = client.name || "";
        editForm.elements.email.value = client.email || "";
        editForm.elements.phone.value = client.phone || "";
        editForm.elements.address.value = client.address || "";
        openEditModal();
      } catch (error) {
        ClientHub.showMessage(error.message, "error");
      }
      return;
    }

    if (deleteId) {
      const confirmed = window.confirm(
        "Are you sure you want to delete this client?",
      );
      if (!confirmed) {
        return;
      }

      try {
        await ClientHub.apiRequest(`/clients/delete-client/${deleteId}`, {
          method: "DELETE",
        });
        ClientHub.showMessage("Client deleted successfully.", "success");
        await loadClients();
      } catch (error) {
        ClientHub.showMessage(error.message, "error");
      }
    }
  });

  pagination.addEventListener("click", (event) => {
    const page = Number(event.target.getAttribute("data-page"));

    if (!page) {
      return;
    }

    currentPage = page;
    renderClients();
  });

  clearButton.addEventListener("click", resetForm);
  refreshButton.addEventListener("click", loadClients);
  cancelEditButton.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal();
    }
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    ClientHub.clearMessage();

    const clientId = editForm.elements.client_id.value;

    try {
      await ClientHub.apiRequest(`/clients/update-client/${clientId}`, {
        method: "PUT",
        body: ClientHub.createFormData(editForm),
      });

      closeEditModal();
      ClientHub.showMessage("Client updated successfully.", "success");
      await loadClients();
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  });

  loadClients();
});
