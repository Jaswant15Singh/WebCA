document.addEventListener("DOMContentLoaded", () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const refreshButton = document.getElementById("refreshNotifications");
  const upcomingList = document.getElementById("upcomingList");
  const dueList = document.getElementById("dueList");

  const renderItems = (element, items, emptyText, makeHtml) => {
    if (!items.length) {
      element.innerHTML = `<div class="box">${emptyText}</div>`;
      return;
    }

    element.innerHTML = items.map(makeHtml).join("");
  };

  const loadNotifications = async () => {
    try {
      const adminId = ClientHub.getAdminId();
      const upcoming = await ClientHub.apiRequest(
        `/notifications/all-notifications/${adminId}`,
      );
      const due = await ClientHub.apiRequest(`/notifications/due-projects/${adminId}`);

      renderItems(
        upcomingList,
        upcoming,
        "No upcoming deadlines.",
        (item) => `
          <div class="list-item">
            <h3>${item.project_name}</h3>
            <p class="simple-text">Client: ${item.client_name}</p>
            <p class="simple-text">Reminder date: ${ClientHub.formatDate(item.deadline_period)}</p>
            <p class="simple-text">Deadline: ${ClientHub.formatDate(item.project_deadline)}</p>
          </div>
        `,
      );

      renderItems(
        dueList,
        due,
        "No overdue projects.",
        (item) => `
          <div class="list-item">
            <h3>${item.project_name}</h3>
            <p class="simple-text">Client: ${item.client_name}</p>
            <p class="simple-text">Deadline: ${ClientHub.formatDate(item.project_deadline)}</p>
          </div>
        `,
      );
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  };

  refreshButton.addEventListener("click", loadNotifications);
  loadNotifications();
});
