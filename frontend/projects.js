document.addEventListener("DOMContentLoaded", () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const form = document.getElementById("projectForm");
  const list = document.getElementById("projectList");
  const clearButton = document.getElementById("clearProjectForm");
  const refreshButton = document.getElementById("refreshProjects");
  const clientSelect = document.getElementById("clientSelect");

  const resetForm = () => {
    form.reset();
    form.elements.project_id.value = "";
    form.elements.type.value = "fixed";
    form.elements.status.value = "draft";
    form.elements.budget_currency.value = "EUR";
    form.elements.paid_amount.value = "0";
  };

  const loadClientOptions = async () => {
    try {
      const clients = await ClientHub.apiRequest("/clients/get-clients");
      clientSelect.innerHTML =
        '<option value="">Select client</option>' +
        clients
          .map((client) => `<option value="${client.client_id}">${client.name}</option>`)
          .join("");
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  };

  const renderProjects = (projects) => {
    const uniqueMap = new Map();
    projects.forEach((project) => uniqueMap.set(String(project.project_id), project));
    const rows = [...uniqueMap.values()];

    if (!rows.length) {
      list.innerHTML = '<div class="box">No projects found.</div>';
      return;
    }

    list.innerHTML = rows
      .map(
        (project) => `
          <div class="list-item">
            <div class="list-head">
              <div>
                <h3>${project.title}</h3>
                <p class="simple-text">${project.type || "n/a"} | ${project.status || "n/a"}</p>
              </div>
              <span class="tag">${ClientHub.formatCurrency(project.budget, project.budget_currency)}</span>
            </div>
            <p>${project.description || "No description added."}</p>
            <p class="simple-text">Client ID: ${project.client_id} | Deadline: ${ClientHub.formatDate(project.deadline)}</p>
            <p class="simple-text">Paid: ${ClientHub.formatCurrency(project.paid_amount, project.budget_currency)} | Remaining: ${ClientHub.formatCurrency(project.remaining_amount, project.budget_currency)}</p>
            <div class="button-row">
              <button type="button" class="secondary" data-edit="${project.project_id}">Edit</button>
              <button type="button" class="danger" data-delete="${project.project_id}">Archive</button>
            </div>
          </div>
        `,
      )
      .join("");
  };

  const loadProjects = async () => {
    try {
      const projects = await ClientHub.apiRequest("/projects/get-projects");
      renderProjects(projects);
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
        form.elements.project_id.value = project.project_id;
        form.elements.title.value = project.title || "";
        form.elements.client_id.value = project.client_id || "";
        form.elements.type.value = project.type || "fixed";
        form.elements.status.value = project.status || "draft";
        form.elements.start_date.value = project.start_date
          ? String(project.start_date).slice(0, 10)
          : "";
        form.elements.deadline.value = project.deadline
          ? String(project.deadline).slice(0, 10)
          : "";
        form.elements.budget.value = project.budget || "";
        form.elements.budget_currency.value = project.budget_currency || "EUR";
        form.elements.tags.value = project.tags || "";
        form.elements.description.value = project.description || "";
        form.elements.brief.value = project.brief || "";
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        ClientHub.showMessage(error.message, "error");
      }
      return;
    }

    if (deleteId) {
      try {
        await ClientHub.apiRequest(`/projects/delete-project/${deleteId}`, {
          method: "DELETE",
        });
        ClientHub.showMessage("Project archived successfully.", "success");
        await loadProjects();
      } catch (error) {
        ClientHub.showMessage(error.message, "error");
      }
    }
  });

  clearButton.addEventListener("click", resetForm);
  refreshButton.addEventListener("click", loadProjects);

  loadClientOptions();
  loadProjects();
  resetForm();
});
