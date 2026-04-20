document.addEventListener("DOMContentLoaded", () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const RAZORPAY_PAYMENT_PAGE_URL = "https://rzp.io/rzp/0sZt0Wa";
  const PENDING_PAYMENT_KEY = "clientHubPendingPayment";

  const tableBody = document.getElementById("invoiceTableBody");
  const refreshButton = document.getElementById("refreshInvoices");
  const paymentModal = document.getElementById("paymentModal");
  const paymentForm = document.getElementById("paymentForm");
  const fillRemainingAmountButton = document.getElementById("fillRemainingAmount");
  const cancelPaymentButton = document.getElementById("cancelPayment");
  const paymentProjectName = document.getElementById("paymentProjectName");
  const paymentTotalText = document.getElementById("paymentTotalText");
  const paymentPaidText = document.getElementById("paymentPaidText");
  const paymentRemainingText = document.getElementById("paymentRemainingText");
  const paymentAmountPreview = document.getElementById("paymentAmountPreview");

  let currentInvoice = null;

  const downloadInvoicePdf = async (invoiceId) => {
    try {
      const response = await fetch(`/invoice/download/${invoiceId}`, {
        headers: {
          Authorization: `Bearer ${ClientHub.getToken()}`,
        },
      });

      if (!response.ok) {
        const type = response.headers.get("content-type") || "";
        const errorData = type.includes("application/json")
          ? await response.json()
          : await response.text();
        throw new Error(errorData.error || errorData.message || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  };

  const updatePaymentPreview = () => {
    const amount = Number(paymentForm.elements.amount.value || 0);
    const currency = currentInvoice?.budget_currency || "INR";
    paymentAmountPreview.value = ClientHub.formatCurrency(amount, currency);
  };

  const openPaymentModal = (invoice) => {
    currentInvoice = invoice;
    paymentForm.reset();
    paymentForm.elements.project_id.value = invoice.project_id;
    paymentForm.elements.invoice_id.value = invoice.invoice_id;
    paymentForm.elements.amount.value = Number(invoice.remaining_amount || 0).toFixed(2);

    paymentProjectName.textContent = invoice.title;
    paymentTotalText.textContent = ClientHub.formatCurrency(
      invoice.total_amount,
      invoice.budget_currency,
    );
    paymentPaidText.textContent = ClientHub.formatCurrency(
      invoice.paid_amount,
      invoice.budget_currency,
    );
    paymentRemainingText.textContent = ClientHub.formatCurrency(
      invoice.remaining_amount,
      invoice.budget_currency,
    );
    updatePaymentPreview();
    paymentModal.classList.add("open");
  };

  const closePaymentModal = () => {
    paymentModal.classList.remove("open");
    paymentForm.reset();
    currentInvoice = null;
    paymentAmountPreview.value = "";
  };

  const loadInvoices = async () => {
    try {
      const invoices = await ClientHub.apiRequest("/invoice/all-invoices");

      if (!invoices.length) {
        tableBody.innerHTML = '<tr><td colspan="8">No invoices found.</td></tr>';
        return;
      }

      tableBody.innerHTML = invoices
        .map(
          (invoice) => `
            <tr>
              <td>${invoice.invoice_id ?? "-"}</td>
              <td>${invoice.name}</td>
              <td>${invoice.title}</td>
              <td>${ClientHub.formatCurrency(invoice.total_amount, invoice.budget_currency)}</td>
              <td>${ClientHub.formatCurrency(invoice.paid_amount, invoice.budget_currency)}</td>
              <td>${ClientHub.formatCurrency(invoice.remaining_amount, invoice.budget_currency)}</td>
              <td>${ClientHub.formatDate(invoice.payment_date)}</td>
              <td>
                <div class="button-row">
                  <button
                    type="button"
                    data-pay="true"
                    data-invoice-id="${invoice.invoice_id}"
                    data-project-id="${invoice.project_id}"
                    data-title="${String(invoice.title || "").replaceAll('"', "&quot;")}"
                    data-total="${invoice.total_amount}"
                    data-paid="${invoice.paid_amount}"
                    data-remaining="${invoice.remaining_amount}"
                    data-currency="${invoice.budget_currency || "INR"}"
                    ${
                    Number(invoice.remaining_amount || 0) <= 0 ? "disabled" : ""
                  }
                  >Pay</button>
                  <button type="button" class="secondary" data-pdf="${invoice.invoice_id}">PDF</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("");
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  };

  refreshButton.addEventListener("click", loadInvoices);

  tableBody.addEventListener("click", (event) => {
    const pdfId = event.target.getAttribute("data-pdf");
    const payButton = event.target.closest("[data-pay]");

    if (pdfId) {
      downloadInvoicePdf(pdfId);
      return;
    }

    if (payButton) {
      openPaymentModal({
        invoice_id: payButton.getAttribute("data-invoice-id"),
        project_id: payButton.getAttribute("data-project-id"),
        title: payButton.getAttribute("data-title"),
        total_amount: payButton.getAttribute("data-total"),
        paid_amount: payButton.getAttribute("data-paid"),
        remaining_amount: payButton.getAttribute("data-remaining"),
        budget_currency: payButton.getAttribute("data-currency"),
      });
    }
  });

  paymentForm.elements.amount.addEventListener("input", updatePaymentPreview);

  fillRemainingAmountButton.addEventListener("click", () => {
    if (!currentInvoice) {
      return;
    }

    paymentForm.elements.amount.value = Number(
      currentInvoice.remaining_amount || 0,
    ).toFixed(2);
    updatePaymentPreview();
  });

  cancelPaymentButton.addEventListener("click", closePaymentModal);
  paymentModal.addEventListener("click", (event) => {
    if (event.target === paymentModal) {
      closePaymentModal();
    }
  });

  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    ClientHub.clearMessage();

    if (!currentInvoice) {
      ClientHub.showMessage("Select an invoice first.", "error");
      return;
    }

    const amount = Number(paymentForm.elements.amount.value || 0);
    const remainingAmount = Number(currentInvoice.remaining_amount || 0);

    if (amount <= 0) {
      ClientHub.showMessage("Enter an amount greater than zero.", "error");
      return;
    }

    if (amount > remainingAmount) {
      window.alert("Payment amount cannot be greater than remaining amount.");
      return;
    }

    const pendingPayment = {
      invoiceId: currentInvoice.invoice_id,
      projectId: currentInvoice.project_id,
      projectTitle: currentInvoice.title,
      amount,
      currency: currentInvoice.budget_currency || "INR",
      remainingAmount,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pendingPayment));
    window.location.href = RAZORPAY_PAYMENT_PAGE_URL;
  });

  loadInvoices();
});
