document.addEventListener("DOMContentLoaded", () => {
  if (!ClientHub.requireAuthPage()) {
    return;
  }

  ClientHub.updateAuthText();

  const tableBody = document.getElementById("invoiceTableBody");
  const refreshButton = document.getElementById("refreshInvoices");

  const loadInvoices = async () => {
    try {
      const invoices = await ClientHub.apiRequest("/invoice/all-invoices");

      if (!invoices.length) {
        tableBody.innerHTML = '<tr><td colspan="6">No invoices found.</td></tr>';
        return;
      }

      tableBody.innerHTML = invoices
        .map(
          (invoice) => `
            <tr>
              <td>${invoice.invoice_id}</td>
              <td>${invoice.name}</td>
              <td>${invoice.title}</td>
              <td>${ClientHub.formatCurrency(invoice.total_amount)}</td>
              <td>${ClientHub.formatCurrency(invoice.paid_amount)}</td>
              <td>${ClientHub.formatDate(invoice.payment_date)}</td>
            </tr>
          `,
        )
        .join("");
    } catch (error) {
      ClientHub.showMessage(error.message, "error");
    }
  };

  refreshButton.addEventListener("click", loadInvoices);
  loadInvoices();
});
