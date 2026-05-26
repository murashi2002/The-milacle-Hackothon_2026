const express = require('express');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '512kb' }));
app.use(express.static(path.join(__dirname)));

const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  console.log('No SMTP credentials found. Using Ethereal test account.');
  console.log(`Preview messages at https://ethereal.email/messages`);

  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const createQrCodeBuffer = async (ticket) => {
  const qrData = `Ticket ID: ${ticket.id}\nName: ${ticket.fullName}\nEmail: ${ticket.email}\nEvent: Milacle Tech Hackathon`;
  return QRCode.toBuffer(qrData, {
    type: 'png',
    errorCorrectionLevel: 'H',
    width: 260,
  });
};

const createTicketPdf = (ticket, qrImage) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).font('Helvetica-Bold').text('Milacle Tech Hackathon Ticket', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica').text(`Name: ${ticket.fullName}`);
    doc.text(`Email: ${ticket.email}`);
    doc.text(`Phone: ${ticket.phone || 'N/A'}`);
    doc.text(`Ticket type: ${ticket.ticketType}`);
    doc.text(`Quantity: ${ticket.quantity}`);
    doc.text(`Ticket ID: ${ticket.id}`);
    doc.moveDown(1);
    doc.text('Date: June 12, 2026');
    doc.text('Time: 10:00 AM – 5:00 PM');
    doc.text('Location: Online / Hybrid access');

    doc.moveDown(2);
    doc.fontSize(12).text('Scan the QR code below at event check-in:', { align: 'left' });
    doc.moveDown(1);
    doc.image(qrImage, { fit: [180, 180], align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).text('Thank you for registering! Please keep this ticket for event access.', { align: 'left' });
    doc.end();
  });
};

const buildEmailBody = (ticket) => {
  return `Hello ${ticket.fullName},\n\nThank you for registering for the Milacle Tech Hackathon. Attached is your PDF ticket confirmation.\n\nTicket ID: ${ticket.id}\nTicket type: ${ticket.ticketType}\nQuantity: ${ticket.quantity}\nDate: June 12, 2026\nTime: 10:00 AM – 5:00 PM\nLocation: Online / Hybrid access\n\nPlease keep this email for event access.`;
};

const buildEmailHtml = (ticket) => {
  return `<p>Hello ${ticket.fullName},</p>
    <p>Thank you for registering for the <strong>Milacle Tech Hackathon</strong>. Your PDF ticket confirmation is attached below.</p>
    <p><strong>Ticket ID:</strong> ${ticket.id}<br>
    <strong>Ticket type:</strong> ${ticket.ticketType}<br>
    <strong>Quantity:</strong> ${ticket.quantity}<br>
    <strong>Date:</strong> June 12, 2026<br>
    <strong>Time:</strong> 10:00 AM – 5:00 PM<br>
    <strong>Location:</strong> Online / Hybrid access</p>
    <p>Please present this QR code at event check-in:</p>
    <p><img src="cid:ticketqr@milacle" alt="Ticket QR Code" width="220" style="display:block;margin:0 auto;"/></p>
    <p>See the attached PDF ticket for full details.</p>`;
};

let transporterPromise = createTransporter();

app.post('/api/send-confirmation', async (req, res) => {
  const { fullName, email, phone, ticketType, quantity, id } = req.body;

  if (!fullName || !email || !ticketType || !quantity || !id) {
    return res.status(400).json({ error: 'Missing registration information.' });
  }

  try {
    const ticket = { fullName, email, phone, ticketType, quantity, id };
    const qrBuffer = await createQrCodeBuffer(ticket);
    const pdfBuffer = await createTicketPdf(ticket, qrBuffer);
    const transporter = await transporterPromise;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@milacle.com',
      to: email,
      subject: 'Milacle Hackathon Ticket Confirmation',
      text: buildEmailBody(ticket),
      html: buildEmailHtml(ticket),
      attachments: [
        {
          filename: 'ticket-qr.png',
          content: qrBuffer,
          cid: 'ticketqr@milacle',
        },
        {
          filename: `MilacleTicket-${id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Email preview URL:', previewUrl);
    }

    return res.json({ ok: true, previewUrl });
  } catch (error) {
    console.error('Send confirmation error:', error);
    return res.status(500).json({ error: 'Unable to send confirmation email.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
