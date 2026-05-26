# Milacle Tech Hackathon

A static event registration landing page with email PDF ticket confirmation.

## Setup

1. Install dependencies:
```powershell
cd "C:\Users\Fiston\Desktop\Rolly\The-milacle-Hackothon_2026"
npm install
```

2. Create a `.env` file with SMTP settings:
```text
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
EMAIL_FROM="Milacle Event <noreply@example.com>"
```

3. Start the app:
```powershell
npm start
```

4. Open the site:
- http://127.0.0.1:3000

## Email confirmation

When a user registers with an email address, the server sends a ticket confirmation PDF to that email.

If SMTP settings are not configured, the app falls back to an Ethereal test account and logs a preview URL in the server terminal.
