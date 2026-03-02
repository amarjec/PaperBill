import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export const billService = {
  generateAndShare: async (bill, shopDetails) => {
    try {

      const numberToWords = (num) => {
        const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
        const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
        const inWords = (n) => {
          if (n < 20) return a[n];
          if (n < 100) return b[Math.floor(n/10)] + " " + a[n%10];
          if (n < 1000) return a[Math.floor(n/100)] + " Hundred " + inWords(n%100);
          if (n < 100000) return inWords(Math.floor(n/1000)) + " Thousand " + inWords(n%1000);
          if (n < 10000000) return inWords(Math.floor(n/100000)) + " Lakh " + inWords(n%100000);
          return inWords(Math.floor(n/10000000)) + " Crore " + inWords(n%10000000);
        };
        return inWords(Math.floor(num)) + " Only";
      };

      /* =========================
         COMMON STYLES
      ========================== */

      const baseStyle = `
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial; margin:0; padding:0; color:#222; }
          table { width:100%; border-collapse: collapse; margin-top:20px; }
          th, td { padding:10px; font-size:14px; border-bottom:1px solid #eee; }
          th { background:#f4f4f4; text-align:left; }
          .right { text-align:right; }
          .center { text-align:center; }
          .no-break { page-break-inside: avoid; }
        </style>
      `;

      /* =========================
         ESTIMATE TEMPLATE (Simple Clean)
      ========================== */

      const estimateTemplate = `
      <html>
      <head>
        ${baseStyle}
      </head>
      <body>
        <div>

          <h2 style="margin-bottom:5px;">${shopDetails.business_name}</h2>
          <div style="font-size:13px; color:#555;">
            ${shopDetails.address || ""}<br>
            Phone: ${shopDetails.phone_number}
          </div>

          <hr style="margin:20px 0;" />

          <div style="display:flex; justify-content:space-between;">
            <div>
              <strong>Estimate For:</strong><br>
              ${bill.customer_name || "Customer"}<br>
              ${bill.customer_phone || ""}
            </div>
            <div style="text-align:right;">
              <strong>Estimate No:</strong> #${bill._id.slice(-6).toUpperCase()}<br>
              <strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString("en-IN")}
            </div>
          </div>

          <h3 style="margin-top:30px;">ESTIMATE</h3>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th class="center">Qty</th>
                <th class="right">Rate</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => {
                const price = item.sale_price || item.retail_price || 0;
                const qty = item.quantity || 0;
                const total = price * qty;
                return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.item_name}</td>
                  <td class="center">${qty}</td>
                  <td class="right">₹${price.toFixed(2)}</td>
                  <td class="right">₹${total.toFixed(2)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>

          <div style="margin-top:20px; text-align:right; font-size:18px; font-weight:bold;">
            Estimated Total: ₹${bill.total_amount.toFixed(2)}
          </div>

          <div style="margin-top:40px; font-size:12px; color:#555;">
            • This is only an estimate, not a final bill.<br>
            • Prices are subject to change without prior notice.
          </div>

        </div>
      </body>
      </html>
      `;

      /* =========================
         INDUSTRY STANDARD INVOICE
      ========================== */

      const invoiceTemplate = `
      <html>
      <head>
        ${baseStyle}
      </head>
      <body>
        <div>

          <div style="display:flex; justify-content:space-between; border-bottom:2px solid #111; padding-bottom:10px;">
            <div>
              <h2 style="margin:0;">${shopDetails.business_name}</h2>
              <div style="font-size:13px; color:#555;">
                ${shopDetails.address || ""}<br>
                Phone: ${shopDetails.phone_number}
              </div>
            </div>
            <div style="font-size:24px; font-weight:bold;">INVOICE</div>
          </div>

          <div style="margin-top:20px; display:flex; justify-content:space-between;">
            <div>
              <strong>Bill To:</strong><br>
              ${bill.customer_name || "Walk-in Customer"}<br>
              ${bill.customer_phone || ""}
            </div>
            <div style="text-align:right;">
              <strong>Invoice No:</strong> #${bill._id.slice(-6).toUpperCase()}<br>
              <strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString("en-IN")}<br>
              <strong>Payment:</strong> ${bill.payment_mode || "Cash"}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th class="center">Qty</th>
                <th class="right">Rate</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => {
                const price = item.sale_price || item.retail_price || 0;
                const qty = item.quantity || 0;
                const total = price * qty;
                return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.item_name}</td>
                  <td class="center">${qty}</td>
                  <td class="right">₹${price.toFixed(2)}</td>
                  <td class="right">₹${total.toFixed(2)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>

          <div style="margin-top:20px; border:1px solid #ddd; padding:15px;" class="no-break">
            <div style="display:flex; justify-content:space-between; font-size:15px;">
              <span>Total Payable</span>
              <strong>₹${bill.total_amount.toFixed(2)}</strong>
            </div>
            <div style="margin-top:10px; font-size:13px; font-style:italic;">
              Amount in Words: Rupees ${numberToWords(bill.total_amount)}
            </div>
          </div>

          <div style="margin-top:60px; display:flex; justify-content:space-between;" class="no-break">
            
            <div style="width:60%; font-size:12px; color:#555;">
              <strong>Terms & Conditions</strong><br><br>
              • Goods once sold will not be taken back.<br>
              • Payment once made will not be refunded.<br>
              • Subject to local jurisdiction only.<br><br>
              Thank you for your business.
            </div>

            <div style="width:35%; text-align:right;">
              For ${shopDetails.business_name}<br><br><br>
              ___________________________<br>
              Authorized Signature
            </div>

          </div>

        </div>
      </body>
      </html>
      `;

      const finalHtml = bill.is_estimate ? estimateTemplate : invoiceTemplate;

      const { uri } = await Print.printToFileAsync({ html: finalHtml });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: bill.is_estimate
            ? `Estimate for ${bill.customer_name || "Customer"}`
            : `Invoice for ${bill.customer_name || "Customer"}`,
          UTI: "com.adobe.pdf",
        });
      }

    } catch (error) {
      console.error("PDF Generation Error:", error);
      throw error;
    }
  },
};