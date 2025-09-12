# 📧 EmailJS Setup for stafflink33@gmail.com

## Quick Setup (5 minutes)

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (200 emails/month free)

### Step 2: Add Email Service
1. In EmailJS Dashboard, click "Email Services"
2. Click "Add New Service"
3. Choose "Gmail"
4. Click "Connect Account"
5. Authorize with your Gmail account
6. Name it: `service_stafflink`
7. Click "Create Service"

### Step 3: Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Set up the template:

**Template Settings:**
- **Template Name:** `Waitlist Notification`
- **Template ID:** `template_waitlist`
- **To Email:** `stafflink33@gmail.com` (hardcode this)
- **From Name:** `StaffLink Waitlist`
- **From Email:** `{{user_email}}`
- **Reply To:** `{{user_email}}`
- **Subject:** `New Waitlist Signup - {{user_type}}`

**Email Content:**
```html
<h2>New Waitlist Signup!</h2>

<p><strong>Type:</strong> {{user_type}}</p>
<p><strong>Name:</strong> {{user_name}}</p>
<p><strong>Phone:</strong> {{user_phone}}</p>
<p><strong>Email:</strong> {{user_email}}</p>

{{#if company_name}}
<p><strong>Company:</strong> {{company_name}}</p>
{{/if}}

{{#if worker_role}}
<p><strong>Worker Role:</strong> {{worker_role}}</p>
{{/if}}

<p><strong>Submitted:</strong> {{submission_date}}</p>

<hr>
<p style="color: #666; font-size: 12px;">
This is an automated message from StaffLink Waitlist system.
</p>
```

4. Click "Save"

### Step 4: Get Your Public Key
1. Go to "Account" → "API Keys"
2. Copy your "Public Key"
3. Update `.env.local` file:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_stafflink
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_waitlist
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE  # <-- Paste your key here
```

### Step 5: Restart Dev Server
```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

## ✅ Test It!
1. Go to http://localhost:3001
2. Click "加入等待名单"
3. Fill the form and submit
4. Check stafflink33@gmail.com inbox!

## 📊 What You'll Receive

Each email will contain:
- **User Type**: Company or Worker (企业用户/工人用户)
- **Name**: User's full name
- **Phone**: Contact number
- **Email**: User's email (if provided)
- **Company**: Company name (for businesses)
- **Role**: Job type (for workers)
- **Timestamp**: When they signed up

## 🔒 Security Notes
- The public key is safe to expose (it's meant to be public)
- EmailJS handles all email sending securely
- No passwords or sensitive data needed in your code
- Free tier: 200 emails/month (enough for testing)

## 🚀 Production Tips
1. **Upgrade Plan**: For more than 200 signups/month
2. **Custom Domain**: Use your own domain email
3. **Auto-Reply**: Set up confirmation emails to users
4. **Backup**: Still saves to `waitlist.json` as backup

## 🛠 Troubleshooting

**Not receiving emails?**
- Check spam folder
- Verify EmailJS service is connected
- Check browser console for errors
- Make sure public key is correct

**Getting errors?**
- Open browser console (F12)
- Look for EmailJS error messages
- Check network tab for failed requests

## 📈 Monitor Stats
- Go to EmailJS Dashboard
- View "Email History" for all sent emails
- Check success/failure rates
- See email content for debugging

---

**Current Status**: 
- ✅ EmailJS integrated in code
- ✅ Sends to stafflink33@gmail.com
- ⏳ Waiting for you to set up EmailJS account and add public key

Once you add your public key, emails will automatically start sending!