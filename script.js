const form = document.getElementById('registrationForm');
const confirmation = document.getElementById('confirmation');
const downloadButton = document.getElementById('downloadTicket');

const ticketName = document.getElementById('ticketName');
const ticketEmail = document.getElementById('ticketEmail');
const ticketPhone = document.getElementById('ticketPhone');
const ticketTypeText = document.getElementById('ticketTypeText');
const ticketQuantity = document.getElementById('ticketQuantity');
const ticketId = document.getElementById('ticketId');
const ticketQrCode = document.getElementById('ticketQrCode');
const confirmationMessage = document.getElementById('confirmationMessage');

const createTicketId = () => {
  const now = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `MIL-${now}-${random}`;
};

const createTicketFile = ({ fullName, email, phone, ticketType, quantity, id }) => {
  return `Milacle Tech Hackathon Ticket\n\nName: ${fullName}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nTicket type: ${ticketType}\nQuantity: ${quantity}\nTicket ID: ${id}\nDate: June 12, 2026\nTime: 10:00 AM – 5:00 PM\nLocation: Online / Hybrid access\n\nThank you for registering! Please keep this ticket for event access.`;
};

const downloadTextFile = (filename, content) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  element.remove();
};

const createQrCodeUrl = (ticket) => {
  const contents = `Ticket ID: ${ticket.id}\nName: ${ticket.fullName}\nEmail: ${ticket.email}\nEvent: Milacle Tech Hackathon`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(contents)}`;
};

const showConfirmation = (data) => {
  ticketName.textContent = data.fullName;
  ticketEmail.textContent = data.email || 'Not provided';
  ticketPhone.textContent = data.phone || 'Not provided';
  ticketTypeText.textContent = data.ticketType;
  ticketQuantity.textContent = data.quantity;
  ticketId.textContent = data.id;
  ticketQrCode.src = createQrCodeUrl(data);
  ticketQrCode.alt = `QR code for ticket ${data.id}`;
  confirmationMessage.textContent = data.email
    ? `A confirmation email has been prepared for ${data.email}. Please keep this confirmation for event access.`
    : `A confirmation SMS has been prepared for ${data.phone}. Please keep this confirmation for event access.`;
  confirmation.classList.remove('hidden');
};

const getFormData = () => ({
  fullName: form.fullName.value.trim(),
  email: form.email.value.trim(),
  phone: form.phone.value.trim(),
  ticketType: form.ticketType.value,
  quantity: form.quantity.value,
});

const formatConfirmationBody = (ticket) => {
  return `Hello ${ticket.fullName},\n\nThank you for registering for the Milacle Tech Hackathon.\n\nTicket ID: ${ticket.id}\nTicket type: ${ticket.ticketType}\nQuantity: ${ticket.quantity}\nDate: June 12, 2026\nTime: 10:00 AM – 5:00 PM\nLocation: Online / Hybrid access\n\nWe look forward to seeing you at the event!`;
};

const sendContactConfirmation = (ticket) => {
  const body = encodeURIComponent(formatConfirmationBody(ticket));
  if (ticket.email) {
    window.location.href = `mailto:${ticket.email}?subject=${encodeURIComponent('Milacle Hackathon Registration Confirmation')}&body=${body}`;
  } else if (ticket.phone) {
    window.location.href = `sms:${ticket.phone}?body=${body}`;
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = getFormData();

  if (!data.fullName || (!data.email && !data.phone)) {
    alert('Please enter your name and provide either an email address or phone number to register.');
    return;
  }

  const ticket = {
    ...data,
    id: createTicketId(),
  };

  showConfirmation(ticket);
  localStorage.setItem('milacleRegistration', JSON.stringify(ticket));
  sendContactConfirmation(ticket);
});

downloadButton.addEventListener('click', () => {
  const saved = localStorage.getItem('milacleRegistration');
  if (!saved) {
    alert('Please register first to download your ticket.');
    return;
  }
  const ticket = JSON.parse(saved);
  const content = createTicketFile(ticket);
  downloadTextFile(`Milacle-ticket-${ticket.id}.txt`, content);
});

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('milacleRegistration');
  if (saved) {
    const ticket = JSON.parse(saved);
    showConfirmation(ticket);
  }
});
