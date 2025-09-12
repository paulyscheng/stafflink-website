# 📋 Waitlist Setup Guide

## Current Setup
The waitlist currently saves submissions to a local `waitlist.json` file. You have several options to receive notifications:

## 🚀 Quick Setup Options

### Option 1: Discord Notifications (Easiest - 2 minutes)
1. Open Discord and go to your server
2. Server Settings → Integrations → Webhooks
3. Click "New Webhook" and copy the URL
4. Create `.env.local` file in website folder:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_URL
```
5. Restart the dev server

**Result**: Get instant Discord notifications for each signup!

### Option 2: Check Local File (No Setup)
Submissions are automatically saved to `waitlist.json` in your website folder.
```bash
# View all submissions
cat waitlist.json

# Watch for new submissions in real-time
tail -f waitlist.json
```

### Option 3: Email Notifications (10 minutes)

#### Using Resend (Recommended)
1. Sign up at [resend.com](https://resend.com) (free)
2. Get your API key
3. Install: `npm install resend`
4. Add to `.env.local`:
```
RESEND_API_KEY=re_YOUR_KEY
```
5. Uncomment the Resend code in `/app/api/waitlist/route.ts`

#### Using EmailJS (No Backend)
1. Sign up at [emailjs.com](https://www.emailjs.com/)
2. Create email template
3. Get your service ID, template ID, and user ID
4. Can send directly from frontend (no API needed)

### Option 4: Google Sheets (15 minutes)
1. Create a Google Sheet
2. Use Zapier or Make.com to connect webhook to Google Sheets
3. Or set up Google Sheets API (more complex)

## 📊 View Submissions

### Current Submissions Location
```bash
# Your submissions are saved here:
/Users/paulcheng/Desktop/staffLink/website/waitlist.json

# View in terminal:
cat waitlist.json | jq '.'  # Pretty print if you have jq installed

# Count submissions:
cat waitlist.json | jq '. | length'
```

### Export to CSV
```bash
# Convert JSON to CSV (if you have jq installed)
cat waitlist.json | jq -r '(.[0] | keys_unsorted) as $keys | $keys, map([.[ $keys[] ]])[] | @csv' > waitlist.csv
```

## 🔒 Security Notes
- Never commit `.env.local` to git (already in .gitignore)
- The local JSON file is temporary - use a database for production
- Consider rate limiting to prevent spam

## 💡 Production Recommendations
For production, consider:
1. **Database**: PostgreSQL or MongoDB to store submissions
2. **Email Service**: SendGrid, AWS SES, or Postmark
3. **CRM Integration**: Sync with HubSpot, Salesforce, etc.
4. **Analytics**: Track conversion rates
5. **Double Opt-in**: Send confirmation emails

## 🎯 Next Steps
1. Choose your notification method
2. Set up environment variables
3. Test with a submission
4. Check you're receiving notifications

Need help? The current setup saves everything locally, so you won't lose any submissions while you decide on the best notification method!