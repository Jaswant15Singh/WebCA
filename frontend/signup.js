document.addEventListener("DOMContentLoaded", () => {
  ClientHub.redirectLoggedInUser();

  const form = document.getElementById("signupForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    ClientHub.clearMessage();

    const body = Object.fromEntries(new FormData(form).entries());

    try {
      await ClientHub.apiRequest("/admin/register", {
        method: "POST",
        body: JSON.stringify(body),
      });

      ClientHub.setFlash("Signup successful. Please login now.", "success");
      window.location.href = ClientHub.LOGIN_PAGE;
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  });
});
