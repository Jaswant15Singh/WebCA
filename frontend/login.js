document.addEventListener("DOMContentLoaded", () => {
  ClientHub.redirectLoggedInUser();

  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    ClientHub.clearMessage();

    const body = Object.fromEntries(new FormData(form).entries());
    console.log("fixed")
    try {
      const data = await ClientHub.apiRequest("/admin/login", {
        method: "POST",
        body: JSON.stringify(body),
      });

      ClientHub.saveSession({
        token: data.token || "",
        adminId: String(data.admin?.admin_id || ""),
        username: data.admin?.username || body.username,
      });

      window.location.href = `./dashboard.html`;
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  });
});
