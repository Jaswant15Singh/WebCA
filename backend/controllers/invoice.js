import PDFDocument from "pdfkit";

const invoiceSummaryQuery = `
  SELECT
    MAX(i.invoice_id) AS invoice_id,
    p.project_id,
    p.owner_id,
    p.client_id,
    c.name,
    c.email AS client_email,
    p.title,
    p.budget_currency,
    COALESCE(p.budget, 0) AS total_amount,
    COALESCE(SUM(i.paid_amount), 0) AS paid_amount,
    GREATEST(COALESCE(p.budget, 0) - COALESCE(SUM(i.paid_amount), 0), 0) AS remaining_amount,
    MAX(i.payment_date) AS payment_date
  FROM projects p
  INNER JOIN clients c ON c.client_id = p.client_id
  LEFT JOIN invoice i ON i.project_id = p.project_id AND i.owner_id = p.owner_id
`;

const invoiceController = {
  getAllInvoices: async (req, res) => {
    try {
      const ownerId = req.admin.id;
      const invoices = await db.executeQuery(
        `${invoiceSummaryQuery}
         WHERE p.owner_id = $1
         GROUP BY p.project_id, p.owner_id, p.client_id, c.name, c.email, p.title, p.budget_currency, p.budget
         ORDER BY MAX(i.payment_date) DESC NULLS LAST, p.project_id DESC`,
        [ownerId],
      );
      res.status(200).json(invoices);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.publicMessage || "Error fetching invoices" });
    }
  },

  getInvoiceByProjects: async (req, res) => {
    const ownerId = req.admin.id;
    const { id } = req.params;
    try {
      const invoice = await db.executeQuery(
        "SELECT i.invoice_id, i.owner_id, i.total_amount, i.paid_amount, c.name, p.title, i.payment_date, p.budget_currency FROM invoice i INNER JOIN clients c ON i.client_id = c.client_id INNER JOIN projects p ON i.project_id = p.project_id WHERE i.project_id = $1 AND i.owner_id = $2 ORDER BY i.invoice_id DESC",
        [id, ownerId],
      );
      if (invoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(200).json(invoice);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.publicMessage || "Error fetching invoice" });
    }
  },
  getInvoiceById: async (req, res) => {
    const ownerId = req.admin.id;
    const { id } = req.params;
    try {
      const invoice = await db.executeQuery(
        `${invoiceSummaryQuery}
         WHERE p.project_id = (
           SELECT project_id FROM invoice WHERE invoice_id = $1 AND owner_id = $2
         ) AND p.owner_id = $2
         GROUP BY p.project_id, p.owner_id, p.client_id, c.name, c.email, p.title, p.budget_currency, p.budget`,
        [id, ownerId],
      );
      if (invoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(200).json(invoice[0]);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.publicMessage || "Error fetching invoice" });
    }
  },
  downloadInvoicePdf: async (req, res) => {
    const ownerId = req.admin.id;
    const { project_id } = req.params;

    try {
      const invoice = await db.executeQuery(
        `${invoiceSummaryQuery}
       WHERE p.project_id = $1 AND p.owner_id = $2
       GROUP BY p.project_id, p.owner_id, p.client_id, c.name, c.email, p.title, p.budget_currency, p.budget`,
        [project_id, ownerId],
      );

      if (invoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const item = invoice[0];
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-project-${item.project_id}.pdf`,
      );

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      // ── Header bar ──────────────────────────────────────────────
      doc.rect(0, 0, pageWidth, 80).fill("#1a1a2e");
      doc
        .fillColor("#ffffff")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("Client Hub", margin, 22);
      doc
        .fillColor("#a0aec0")
        .fontSize(10)
        .font("Helvetica")
        .text("Invoice", margin, 50);

      // Invoice label top-right
      doc
        .fillColor("#ffffff")
        .fontSize(10)
        .text("INVOICE", 0, 28, { align: "right", width: pageWidth - margin });
      doc
        .fillColor("#a0aec0")
        .fontSize(9)
        .text(`#${item.invoice_id}`, 0, 44, {
          align: "right",
          width: pageWidth - margin,
        });

      // ── Invoice meta row ─────────────────────────────────────────
      let y = 110;
      doc
        .fillColor("#2d3748")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("PAYMENT DATE", margin, y)
        .text("PROJECT", margin + 160, y)
        .text("CURRENCY", margin + 360, y);

      y += 14;
      doc
        .fillColor("#4a5568")
        .font("Helvetica")
        .text(
          new Date(item.payment_date).toLocaleDateString("en-IE"),
          margin,
          y,
        )
        .text(item.title, margin + 160, y, { width: 180, ellipsis: true })
        .text(item.budget_currency || "EUR", margin + 360, y);

      // Divider
      y += 28;
      doc
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .stroke();

      // ── Bill To ──────────────────────────────────────────────────
      y += 24;
      doc
        .fillColor("#2d3748")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("BILL TO", margin, y);

      y += 14;
      doc
        .fillColor("#1a202c")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(item.name, margin, y);

      y += 16;
      doc
        .fillColor("#718096")
        .fontSize(10)
        .font("Helvetica")
        .text(item.client_email || "Email not provided", margin, y);

      // ── Summary box ──────────────────────────────────────────────
      y += 50;
      const boxX = margin;
      const boxW = contentWidth;
      const boxH = 110;

      doc.roundedRect(boxX, y, boxW, boxH, 6).fill("#f7fafc");

      // Row headers
      const col1 = boxX + 24;
      const col2 = boxX + boxW / 3 + 10;
      const col3 = boxX + (boxW / 3) * 2 + 10;

      doc
        .fillColor("#718096")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("TOTAL AMOUNT", col1, y + 20)
        .text("PAID AMOUNT", col2, y + 20)
        .text("REMAINING", col3, y + 20);

      const remaining = Math.max(
        Number(item.total_amount || 0) - Number(item.paid_amount || 0),
        0,
      );
      const currency = item.budget_currency || "EUR";

      doc
        .fillColor("#1a202c")
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(
          `${Number(item.total_amount).toFixed(2)} ${currency}`,
          col1,
          y + 38,
        )
        .fillColor("#38a169")
        .text(
          `${Number(item.paid_amount).toFixed(2)} ${currency}`,
          col2,
          y + 38,
        )
        .fillColor(remaining > 0 ? "#e53e3e" : "#38a169")
        .text(`${remaining.toFixed(2)} ${currency}`, col3, y + 38);

      // Status badge
      const statusText = remaining > 0 ? "PARTIALLY PAID" : "PAID IN FULL";
      const badgeColor = remaining > 0 ? "#fef3c7" : "#dcfce7";
      const badgeTextColor = remaining > 0 ? "#92400e" : "#166534";

      doc.roundedRect(col1, y + 70, 100, 20, 4).fill(badgeColor);
      doc
        .fillColor(badgeTextColor)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(statusText, col1, y + 76, { width: 100, align: "center" });

      // ── Footer ───────────────────────────────────────────────────
      const pageHeight = doc.page.height;
      doc
        .moveTo(margin, pageHeight - 60)
        .lineTo(pageWidth - margin, pageHeight - 60)
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .stroke();

      doc
        .fillColor("#a0aec0")
        .fontSize(8)
        .font("Helvetica")
        .text("Generated by Client Hub", margin, pageHeight - 45, {
          align: "center",
          width: contentWidth,
        });

      doc.end();
    } catch (error) {
      res
        .status(500)
        .json({ message: error.publicMessage || "Error downloading invoice" });
    }
  },
  confirmInvoicePayment: async (req, res) => {
    const ownerId = req.admin.id;
    const { project_id, amount } = req.body;

    try {
      const invoice = await db.executeQuery(
        `${invoiceSummaryQuery}
         WHERE p.project_id = $1 AND p.owner_id = $2
         GROUP BY p.project_id, p.owner_id, p.client_id, c.name, c.email, p.title, p.budget_currency, p.budget`,
        [project_id, ownerId],
      );

      if (invoice.length === 0) {
        return res.status(404).json({ message: "Project invoice not found" });
      }

      const current = invoice[0];
      const paymentAmount = Number(amount || 0);
      const remainingAmount = Number(current.remaining_amount || 0);

      if (paymentAmount <= 0) {
        return res
          .status(400)
          .json({ message: "Payment amount must be greater than zero" });
      }

      if (paymentAmount > remainingAmount) {
        return res
          .status(400)
          .json({
            message: "Payment amount cannot be greater than remaining amount",
          });
      }

      const nextRemainingAmount = Math.max(remainingAmount - paymentAmount, 0);

      await db.executeQuery(
        "INSERT INTO invoice (owner_id, project_id, client_id, total_amount, paid_amount, payment_date) VALUES ($1, $2, $3, $4, $5, NOW())",
        [
          ownerId,
          current.project_id,
          current.client_id,
          current.total_amount,
          paymentAmount,
        ],
      );
      await db.executeQuery(
        "INSERT INTO project_logs (project_id, total_amount, paid_amount) VALUES ($1, $2, $3)",
        [current.project_id, current.total_amount, paymentAmount],
      );
      await db.executeQuery(
        "UPDATE projects SET remaining_amount = $1, updated_at = NOW() WHERE project_id = $2 AND owner_id = $3",
        [nextRemainingAmount, current.project_id, ownerId],
      );

      res.status(200).json({
        message: "Amount paid successfully",
        payment: {
          project_id: current.project_id,
          title: current.title,
          amount_paid: paymentAmount,
          total_paid: Number(current.paid_amount || 0) + paymentAmount,
          remaining_amount: nextRemainingAmount,
          budget_currency: current.budget_currency,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: error.publicMessage || "Error confirming payment" });
    }
  },
};

export default invoiceController;
