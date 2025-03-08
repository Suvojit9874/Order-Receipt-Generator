const express = require("express");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Serve the form
app.get("/", (req, res) => {
  res.render("index");
});

// Handle form submission and generate PDF
app.post("/generate-receipt", (req, res) => {
  const {
    orderId,
    orderPrice,
    name,
    email,
    number,
    address,
    city,
    state,
    postcode,
    products,
    advance,
  } = req.body;
  const items = JSON.parse(products); // Convert stringified JSON back to array
  let remaining = orderPrice - advance;
  let orderDate = new Date().toLocaleDateString();
  console.log({
    orderId,
    orderPrice,
    name,
    email,
    number,
    address,
    city,
    state,
    postcode,
    products,
  });
  const doc = new PDFDocument({ margin: 50 });

  // Pipe the PDF to a file
  const fileName = `receipt_${orderId}_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, "public", fileName);
  doc.pipe(fs.createWriteStream(filePath));

  doc.image("logo.png", 50, 30, { width: 100 });

  // Title
  doc.fontSize(16).text(`Receipt`, { align: `center` });
  doc.moveDown(0.5);

  // Header section
  doc.fontSize(10).text(`Sold By: NomadNation`, 50, 100);
  doc.text(
    `Ship-from Address: 42/38, Daga Colony, Bahiragath Colony, Jawpur, Dum Dum, Kolkata, South Dumdum, West Bengal 700074`,
    { width: 500 }
  );

  // Order, Billing, and Shipping Information
  doc.moveDown(1);
  doc.fontSize(10).text(`Order ID: ${orderId}`, 50, 160);
  doc.text(`Order Date: ${orderDate}`, 50, 175);
  doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 50, 190);

  doc.text(`Bill To:`, 300, 160);
  doc.text(`${name}`, 300, 175);
  doc.text(`${address}`, 300, 190);
  doc.text(`PinCode: ${postcode} | State: ${state} | City: ${city}`, 300, 205);
  doc.text(`Phone: ${number}`, 300, 220);

  doc.text(`Ship To:`, 300, 240);
  doc.text(`${name}`, 300, 255);
  doc.text(`${address}`, 300, 270);
  doc.text(`PinCode: ${postcode} | State: ${state} | City: ${city}`, 300, 290);
  doc.text(`Phone: ${number}`, 300, 300);

  // Table header
  doc.moveDown(1);
  doc.fontSize(10).text(`Total items: ${items.length}`, 50, 320);
  doc.moveDown(0.5);
  doc.text(`Product`, 50, 340);
  doc.text(`Qty`, 320, 340);
  doc.text(`Amount`, 430, 340);
  doc.text(`Total ₹`, 510, 340);
  doc.moveTo(50, 355).lineTo(750, 355).stroke();

  // Table rows for items
  let currentY = 370; // Starting Y position for the items
  items.forEach((item) => {
    doc.fontSize(10).text(`${item?.title}`, 50, currentY);
    doc.text(`${item?.quantity}`, 320, currentY);
    doc.text(`${item?.price}`, 430, currentY);
    doc.text(`${item.quantity * item?.price}`, 510, currentY);

    currentY += 20; // Increment Y position for the next row
  });

  // Total row
  currentY += 20; // Leave some space after the last item
  doc.moveTo(50, currentY).lineTo(750, currentY).stroke();
  currentY += 10; // Move below the line
  doc.fontSize(12).text(`Total`, 50, currentY);
  doc.text(`${orderPrice}`, 510, currentY);

  currentY += 20; // Leave some space after the last item
  //   doc.moveTo(50, currentY).lineTo(750, currentY).stroke();
  currentY += 10; // Move below the line
  doc.fontSize(12).text(`Amount Paid`, 50, currentY);
  doc.text(`${advance}`, 510, currentY);

  if (remaining > 0) {
    currentY += 20; // Leave some space after the last item
    doc.moveTo(50, currentY).lineTo(750, currentY).stroke();
    currentY += 10; // Move below the line
    doc.fontSize(12).text(`Remaining Amount`, 50, currentY);
    doc.text(`${remaining}`, 510, currentY);
  }

  // Footer
  doc.moveDown(3);
  doc.text(
    `To request a refund, simply email us at nazaakat99@gmail.com OR call us at 9674707842 and provide your order details, including the reason why you’re requesting a refund. We take customer feedback very seriously and use it to constantly improve our quality of service.`,
    50,
    currentY + 150
  );
  doc.moveDown(5);
  doc.text(
    `Contact NoMadNation: +91 9674707842 |  https://www.nomadnation.site/contact`,
    50,
    currentY + 200
  );

  // Finalize the PDF and end the stream
  doc.end();

  setTimeout(() => {
    res.download(filePath, fileName, (err) => {
      if (err) console.log(err);
      fs.unlinkSync(filePath); // Delete after download
    });
  }, 1000);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
