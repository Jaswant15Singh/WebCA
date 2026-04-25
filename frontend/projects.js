document.addEventListener("DOMContentLoaded", () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const ITEMS_PER_PAGE = 2;

  const form = document.getElementById("projectForm");
  const list = document.getElementById("projectList");
  const pagination = document.getElementById("projectPagination");
  const clearButton = document.getElementById("clearProjectForm");
  const refreshButton = document.getElementById("refreshProjects");
  const clientSelect = document.getElementById("clientSelect");
  const editModal = document.getElementById("editProjectModal");
  const editForm = document.getElementById("editProjectForm");
  const editClientSelect = document.getElementById("editClientSelect");
  const cancelEditButton = document.getElementById("cancelProjectEdit");
  const editTotalAmountText = document.getElementById("editTotalAmountText");
  const editAlreadyPaidText = document.getElementById("editAlreadyPaidText");
  const editRemainingAmountText = document.getElementById("editRemainingAmountText");
  const editAlreadyPaidInput = document.getElementById("editAlreadyPaidInput");
  const editRemainingAmountInput = document.getElementById("editRemainingAmountInput");

  let cachedClients = [];
  let allProjects = [];
  let currentAlreadyPaid = 0;
  let currentPage = 1;

  const resetForm = () => {
    form.reset();
    form.elements.project_id.value = "";
    form.elements.type.value = "fixed";
    form.elements.status.value = "draft";
    form.elements.budget_currency.value = "EUR";
    form.elements.paid_amount.value = "0";
  };

  const populateClientSelect = (selectElement) => {
    selectElement.innerHTML =
      '<option value="">Select client</option>' +
      cachedClients
        .map((client) => `<option value="${client.client_id}">${client.name}</option>`)
        .join("");
  };

  const loadClientOptions = async () => {
    try {
      cachedClients = await ClientHub.apiRequest("/clients/get-clients");
      populateClientSelect(clientSelect);
      populateClientSelect(editClientSelect);
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  };

  const openEditModal = () => {
    editModal.classList.add("open");
  };

  const closeEditModal = () => {
    editModal.classList.remove("open");
    editForm.reset();
    editForm.elements.project_id.value = "";
    currentAlreadyPaid = 0;
    editAlreadyPaidInput.value = "0";
    editRemainingAmountInput.value = "0";
    editTotalAmountText.textContent = "0";
    editAlreadyPaidText.textContent = "0";
    editRemainingAmountText.textContent = "0";
  };

  const updateAmountPreview = () => {
    const totalAmount = Number(editForm.elements.budget.value || 0);
    const newPaidAmount = Number(editForm.elements.paid_amount.value || 0);
    const currency = editForm.elements.budget_currency.value || "EUR";
    const remainingAmount = Math.max(totalAmount - currentAlreadyPaid - newPaidAmount, 0);

    editAlreadyPaidInput.value = currentAlreadyPaid.toFixed(2);
    editRemainingAmountInput.value = remainingAmount.toFixed(2);
    editTotalAmountText.textContent = ClientHub.formatCurrency(totalAmount, currency);
    editAlreadyPaidText.textContent = ClientHub.formatCurrency(currentAlreadyPaid, currency);
    editRemainingAmountText.textContent = ClientHub.formatCurrency(remainingAmount, currency);
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

  const renderProjects = () => {
    const uniqueMap = new Map();
    allProjects.forEach((project) => uniqueMap.set(String(project.project_id), project));
    const rows = [...uniqueMap.values()];

    if (!rows.length) {
      list.innerHTML = '<div class="box">No projects found.</div>';
      pagination.innerHTML = "";
      return;
    }

    const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const visibleRows = rows.slice(start, start + ITEMS_PER_PAGE);

    list.innerHTML = visibleRows
      .map((project) => {
        const imageUrl = ClientHub.getAssetUrl(project.cover_image_url);
        const media = imageUrl
          ? `<div class="item-media"><img src="${imageUrl}" alt="${project.title}" /></div>`
          : '<div class="item-media placeholder">No image</div>';

        return `
          <div class="list-item with-media">
            ${media}
            <div class="item-body">
              <div class="list-head">
                <div>
                  <h3>${project.title}</h3>
                  <p class="simple-text">${project.type || "n/a"} | ${project.status || "n/a"}</p>
                </div>
                <span class="tag">${ClientHub.formatCurrency(project.budget, project.budget_currency)}</span>
              </div>
              <p>${project.description || "No description added."}</p>
              <p class="simple-text">Client: ${project.client_name || project.client_id} | Deadline: ${ClientHub.formatDate(project.deadline)}</p>
              <p class="simple-text">Paid: ${ClientHub.formatCurrency(project.paid_amount, project.budget_currency)} | Remaining: ${ClientHub.formatCurrency(project.remaining_amount, project.budget_currency)}</p>
              <div class="button-row">
                <button type="button" class="secondary" data-edit="${project.project_id}">Edit</button>
                <button type="button" class="danger" data-delete="${project.project_id}">Delete</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    buildPagination(rows.length);
  };

  const loadProjects = async () => {
    try {
      allProjects = await ClientHub.apiRequest("/projects/get-projects");
      renderProjects();
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    ClientHub.clearMessage();

    const projectId = form.elements.project_id.value;
    const formData = ClientHub.createFormData(form);
    formData.set("owner_id", ClientHub.getAdminId());

    try {
      await ClientHub.apiRequest(
        projectId ? `/projects/update-project/${projectId}` : "/projects/add-project",
        {
          method: projectId ? "PUT" : "POST",
          body: formData,
        },
      );

      resetForm();
      currentPage = 1;
      ClientHub.showMessage("Project saved successfully.", "success");
      await loadProjects();
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  });

  list.addEventListener("click", async (event) => {
    const editId = event.target.getAttribute("data-edit");
    const deleteId = event.target.getAttribute("data-delete");

    if (editId) {
      try {
        const project = await ClientHub.apiRequest(`/projects/get-project/${editId}`);
        editForm.elements.project_id.value = project.project_id;
        editForm.elements.title.value = project.title || "";
        editForm.elements.client_id.value = project.client_id || "";
        editForm.elements.type.value = project.type || "fixed";
        editForm.elements.status.value = project.status || "draft";
        editForm.elements.start_date.value = project.start_date
          ? String(project.start_date).slice(0, 10)
          : "";
        editForm.elements.deadline.value = project.deadline
          ? String(project.deadline).slice(0, 10)
          : "";
        editForm.elements.budget.value = project.budget || "";
        editForm.elements.paid_amount.value = "0";
        editForm.elements.budget_currency.value = project.budget_currency || "EUR";
        editForm.elements.tags.value = project.tags || "";
        editForm.elements.description.value = project.description || "";
        editForm.elements.brief.value = project.brief || "";
        currentAlreadyPaid = Number(project.paid_amount || 0);
        updateAmountPreview();
        openEditModal();
      } catch (error) {
        ClientHub.showMessage(error.message, "error");
      }
      return;
    }

    if (deleteId) {
      const confirmed = window.confirm(
        "Are you sure you want to delete this project?",
      );
      if (!confirmed) {
        return;
      }

      try {
        await ClientHub.apiRequest(`/projects/delete-project/${deleteId}`, {
          method: "DELETE",
        });
        ClientHub.showMessage("Project deleted successfully.", "success");
        await loadProjects();
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
    renderProjects();
  });

  clearButton.addEventListener("click", resetForm);
  refreshButton.addEventListener("click", loadProjects);
  cancelEditButton.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal();
    }
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    ClientHub.clearMessage();

    const projectId = editForm.elements.project_id.value;
    const totalAmount = Number(editForm.elements.budget.value || 0);
    const newPaidAmount = Number(editForm.elements.paid_amount.value || 0);
    const availableRemaining = Math.max(totalAmount - currentAlreadyPaid, 0);

    if (newPaidAmount > availableRemaining) {
      window.alert("New paid amount cannot be greater than remaining amount.");
      return;
    }

    const formData = ClientHub.createFormData(editForm);
    formData.set("owner_id", ClientHub.getAdminId());

    try {
      await ClientHub.apiRequest(`/projects/update-project/${projectId}`, {
        method: "PUT",
        body: formData,
      });

      closeEditModal();
      ClientHub.showMessage("Project updated successfully.", "success");
      await loadProjects();
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  });

  editForm.elements.budget.addEventListener("input", updateAmountPreview);
  editForm.elements.paid_amount.addEventListener("input", updateAmountPreview);
  editForm.elements.budget_currency.addEventListener("input", updateAmountPreview);

  loadClientOptions();
  loadProjects();
  resetForm();
});
