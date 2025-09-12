import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Option 1: Send to your email using a service like Resend, SendGrid, or EmailJS
    // For now, we'll use a simple webhook to a service like Discord, Slack, or Zapier
    
    // Option 1A: Discord Webhook (easiest to set up)
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
    if (DISCORD_WEBHOOK_URL) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎉 **New Waitlist Signup!**`,
          embeds: [{
            title: data.type === 'company' ? '企业用户' : '工人用户',
            color: data.type === 'company' ? 0x2563EB : 0x7C3AED,
            fields: [
              { name: '姓名', value: data.name || 'N/A', inline: true },
              { name: '手机', value: data.phone || 'N/A', inline: true },
              { name: '邮箱', value: data.email || 'N/A', inline: true },
              { name: data.type === 'company' ? '公司' : '工种', 
                value: data.type === 'company' ? (data.company || 'N/A') : (data.role || 'N/A'), 
                inline: true },
            ],
            timestamp: new Date().toISOString()
          }]
        })
      })
    }
    
    // Option 1B: Save to a Google Sheet using Google Sheets API
    // This requires setting up Google API credentials
    
    // Option 1C: Send email using Resend (free tier available)
    // npm install resend
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'onboarding@resend.dev',
    //   to: 'your-email@example.com',
    //   subject: 'New Waitlist Signup',
    //   html: `<h2>New ${data.type} signup</h2>...`
    // })
    
    // Option 2: Save to database (if you have one set up)
    // await db.waitlist.create({ data })
    
    // Option 3: Save to a JSON file (simple but not recommended for production)
    const fs = require('fs').promises
    const path = require('path')
    const filePath = path.join(process.cwd(), 'waitlist.json')
    
    let waitlist = []
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      waitlist = JSON.parse(fileContent)
    } catch (error) {
      // File doesn't exist yet, that's okay
    }
    
    waitlist.push({
      ...data,
      timestamp: new Date().toISOString()
    })
    
    await fs.writeFile(filePath, JSON.stringify(waitlist, null, 2))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit' },
      { status: 500 }
    )
  }
}