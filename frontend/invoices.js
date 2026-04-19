document.addEventListener("DOMContentLoaded", () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const tableBody = document.getElementById("invoiceTableBody");
  const refreshButton = document.getElementById("refreshInvoices");

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

  const loadInvoices = async () => {
    try {
      const invoices = await ClientHub.apiRequest("/invoice/all-invoices");

      if (!invoices.length) {
        tableBody.innerHTML = '<tr><td colspan="7">No invoices found.</td></tr>';
        return;
      }

      tableBody.innerHTML = invoices
        .map(
          (invoice) => `
            <tr>
              <td>${invoice.invoice_id}</td>
              <td>${invoice.name}</td>
              <td>${invoice.title}</td>
              <td>${ClientHub.formatCurrency(invoice.total_amount, invoice.budget_currency)}</td>
              <td>${ClientHub.formatCurrency(invoice.paid_amount, invoice.budget_currency)}</td>
              <td>${ClientHub.formatDate(invoice.payment_date)}</td>
              <td><button type="button" class="secondary" data-pdf="${invoice.invoice_id}">Download PDF</button></td>
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
    const invoiceId = event.target.getAttribute("data-pdf");
    if (invoiceId) {
      downloadInvoicePdf(invoiceId);
    }
  });
  loadInvoices();
});
