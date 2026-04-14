import { get } from "http";

const invoiceController = {
  getAllInvoices: async (req, res) => {
    try {
      const invoices = await db.executeQuery(
        "Select i.invoice_id ,i.total_amount,i.paid_amount,c.name,p.title,i.payment_date from invoice i inner join clients c on i.client_id = c.client_id inner join projects p on i.project_id = p.project_id",
      );
      res.status(200).json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Error fetching invoices" });
    }
  },

  getInvoiceByProjects: async (req, res) => {
    const { id } = req.params;
    try {
      const invoice = await db.executeQuery(
        "Select i.invoice_id ,i.total_amount,i.paid_amount,c.name,p.title,i.payment_date from invoice i inner join clients c on i.client_id = c.client_id inner join projects p on i.project_id = p.project_id where i.project_id=$1",
        [id],
      );
      if (invoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(200).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Error fetching invoice" });
    }
  },
  getInvoiceById: async (req, res) => {
    const { id } = req.params;
    try {
      const invoice = await db.executeQuery(
        "Select i.invoice_id ,i.total_amount,i.paid_amount,c.name,p.title,i.payment_date from invoice i inner join clients c on i.client_id = c.client_id inner join projects p on i.project_id = p.project_id where i.invoice_id=$1",
        [id],
      );
      if (invoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(200).json(invoice[0]);
    } catch (error) {
      res.status(500).json({ message: "Error fetching invoice" });
    }
  },
};

export default invoiceController;
