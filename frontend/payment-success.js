document.addEventListener("DOMContentLoaded", async () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const PENDING_PAYMENT_KEY = "clientHubPendingPayment";
  const projectName = document.getElementById("successProjectName");
  const paidNow = document.getElementById("successPaidNow");
  const totalPaid = document.getElementById("successTotalPaid");
  const remaining = document.getElementById("successRemaining");

  const rawPendingPayment = localStorage.getItem(PENDING_PAYMENT_KEY);

  if (!rawPendingPayment) {
    ClientHub.showMessage("No pending payment was found. Go back to invoices and try again.", "error");
    return;
  }

  let pendingPayment;

  try {
    pendingPayment = JSON.parse(rawPendingPayment);
  } catch (_error) {
    localStorage.removeItem(PENDING_PAYMENT_KEY);
    ClientHub.showMessage("Payment details are not valid. Start the payment again.", "error");
    return;
  }

  projectName.textContent = pendingPayment.projectTitle || "-";
  paidNow.textContent = ClientHub.formatCurrency(
    pendingPayment.amount,
    pendingPayment.currency || "INR",
  );

  try {
    const response = await ClientHub.apiRequest("/invoice/confirm-payment", {
      method: "POST",
      body: JSON.stringify({
        project_id: pendingPayment.projectId,
        amount: pendingPayment.amount,
      }),
    });

    localStorage.removeItem(PENDING_PAYMENT_KEY);

    const payment = response.payment;
    totalPaid.textContent = ClientHub.formatCurrency(
      payment.total_paid,
      payment.budget_currency,
    );
    remaining.textContent = ClientHub.formatCurrency(
      payment.remaining_amount,
      payment.budget_currency,
    );

    ClientHub.showMessage(response.message, "success");
    window.alert("Amount paid successfully.");
    setTimeout(() => {
      window.location.href = "./invoices.html";
    }, 1200);
  } catch (error) {
    ClientHub.showMessage(error.message, "error");
  }
});
