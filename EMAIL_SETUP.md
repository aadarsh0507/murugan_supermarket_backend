# Email Setup Guide

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. Go to Google Account settings
2. Navigate to Security
3. Click on "App passwords"
4. Select "Mail" and "Other (custom name)"
5. Enter "Fresh Flow Store" as the name
6. Copy the generated 16-character password

### Step 3: Update Environment Variables
Update your `.env` file with your email credentials:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Alternative Email Services

### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

### Yahoo Mail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'yahoo',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

### Custom SMTP
```javascript
const transporter = nodemailer.createTransporter({
  host: 'your-smtp-host',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

## Testing Email Functionality

1. Update your `.env` file with valid email credentials
2. Restart the backend server
3. Test the forgot password functionality
4. Check your email for the OTP

## Troubleshooting

### Common Issues:
- **Authentication failed**: Check your email and app password
- **Connection timeout**: Check your internet connection
- **Invalid credentials**: Verify your email and app password

### Development Mode:
- OTP will be logged to console even if email fails
- Check console logs for email sending status
- Use the logged OTP for testing if email doesn't work

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of your main email password
- Regularly rotate your app passwords
- Monitor email sending logs for suspicious activity
