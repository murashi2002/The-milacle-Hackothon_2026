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
  confirmationMessage.textContent = `A confirmation email with your ticket PDF has been sent to ${data.email}. Please keep this confirmation for event access.`;
  confirmation.classList.remove('hidden');
};

const getFormData = () => ({
  fullName: form.fullName.value.trim(),
  email: form.email.value.trim(),
  phone: form.phone.value.trim(),
  ticketType: form.ticketType.value,
  quantity: form.quantity.value,
});

const sendConfirmationEmail = async (ticket) => {
  const response = await fetch('/api/send-confirmation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ticket),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send confirmation email.');
  }

  return response.json();
};

const openMailClient = (ticket) => {
  const body = encodeURIComponent(`Hello ${ticket.fullName},\n\nThank you for registering for the Milacle Tech Hackathon.\n\nTicket ID: ${ticket.id}\nTicket type: ${ticket.ticketType}\nQuantity: ${ticket.quantity}\nDate: June 12, 2026\nTime: 10:00 AM – 5:00 PM\nLocation: Online / Hybrid access\n\nPlease keep this email for event access.`);
  window.location.href = `mailto:${ticket.email}?subject=${encodeURIComponent('Milacle Hackathon Ticket Confirmation')}&body=${body}`;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = getFormData();

  if (!data.fullName || !data.email) {
    alert('Please enter your name and an email address to register.');
    return;
  }

  const ticket = {
    ...data,
    id: createTicketId(),
  };

  try {
    await sendConfirmationEmail(ticket);
  } catch (error) {
    console.warn('Backend email API unavailable, opening the email client instead.', error);
    openMailClient(ticket);
  }

  showConfirmation(ticket);
  localStorage.setItem('milacleRegistration', JSON.stringify(ticket));
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
