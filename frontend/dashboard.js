document.addEventListener("DOMContentLoaded", async () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  try {
    const clients = await ClientHub.apiRequest("/clients/get-clients");
    const projects = await ClientHub.apiRequest("/projects/get-projects");
    const invoices = await ClientHub.apiRequest("/invoice/all-invoices");
    const upcoming = await ClientHub.apiRequest(
      `/notifications/all-notifications/${ClientHub.getAdminId()}`,
    );
    const due = await ClientHub.apiRequest(
      `/notifications/due-projects/${ClientHub.getAdminId()}`,
    );

    document.getElementById("clientCount").textContent = clients.length;
    document.getElementById("projectCount").textContent = projects.length;
    document.getElementById("invoiceCount").textContent = invoices.length;
    document.getElementById("notificationCount").textContent =
      upcoming.length + due.length;
  } catch (error) {
    ClientHub.showMessage(error.message, "error");
  }
});
