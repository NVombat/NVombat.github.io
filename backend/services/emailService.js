import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export async function sendConfirmationEmail(email, playerName, predictions, confirmationCode) {
    const predictionsHtml = predictions.map(p => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.stage}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.team}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.points} pts</td>
        </tr>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #00ff00, #0ff); color: #000; padding: 20px; border-radius: 8px; }
                .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
                .predictions-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .predictions-table th { background: #00ff00; color: #000; padding: 10px; text-align: left; }
                .code { background: #000; color: #00ff00; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 4px; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏆 World Cup Prediction Game - Entry Confirmation</h1>
                    <p>Official Entry into the 2026 World Cup Prediction Competition</p>
                </div>

                <div class="content">
                    <h2>Dear ${playerName},</h2>

                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px;">
                        <strong>⚠️ OFFICIAL ENTRY CONFIRMATION</strong>
                        <p style="margin: 10px 0 0 0;">This email confirms your official entry into the <strong>2026 World Cup Prediction Competition</strong>.</p>
                    </div>

                    <h3>Entry Fee & Payment Terms:</h3>
                    <p><strong>Entry Fee: ₹500 (Five Hundred Indian Rupees)</strong></p>
                    <p>By submitting this prediction form, you acknowledge and agree to pay the entry fee of <strong>₹500</strong> to participate in this competition. This email serves as proof of your competition entry and contractual agreement.</p>

                    <div style="background: #ffe6e6; border-left: 4px solid #ff6b6b; padding: 15px; margin: 15px 0; border-radius: 4px;">
                        <strong>💰 Payment Terms:</strong>
                        <p style="margin: 10px 0 0 0;">You are contractually obligated to pay the entry fee of ₹500. Failure to settle payment will result in your pursuit for payment collection. <strong>We will hunt you down for this!</strong> (Playfully but firmly - your commitment is taken seriously.)</p>
                    </div>

                    <h3>Your Locked Predictions:</h3>
                    <table class="predictions-table">
                        <thead>
                            <tr>
                                <th>Stage</th>
                                <th>Team</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${predictionsHtml}
                        </tbody>
                    </table>
                    
                    <h3>Confirmation Code:</h3>
                    <div class="code">${confirmationCode}</div>
                    
                    <div class="warning">
                        <strong>⚠️ Important - Keep This Email Safe:</strong>
                        <p style="margin: 10px 0 0 0;">This email is your official proof of entry into the competition. Your confirmation code and locked predictions prove you have entered and agreed to pay ₹500. Do not share this email as it contains your locked predictions and serves as a binding contract.</p>
                    </div>

                    <p><strong>Submission & Entry Details:</strong></p>
                    <ul>
                        <li>📧 Entry Email: ${email}</li>
                        <li>⏰ Submission Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
                        <li>🔒 Entry Status: LOCKED (Cannot be changed or modified)</li>
                        <li>💳 Amount Due: ₹500 (Five Hundred Indian Rupees)</li>
                        <li>📋 Confirmation Code: <strong>${confirmationCode}</strong></li>
                    </ul>

                    <h3>What Happens Next:</h3>
                    <p>Your predictions will be visible on the leaderboard starting <strong>June 12, 2026 at 12:30 AM IST</strong> when the World Cup begins. Your score will be calculated automatically as teams progress through the tournament.</p>

                    <h3>Payment Instructions:</h3>
                    <p>Please arrange payment of ₹500 as soon as possible. Your entry is locked and confirmed, and payment is now due. This email serves as your entry confirmation and invoice. Failure to pay will be followed up.</p>

                    <div style="background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 4px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #666;">This is a binding competition entry agreement. By submitting predictions, you have agreed to pay ₹500 for participation.</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>World Cup Prediction Game 2026 | <a href="https://nvombat.github.io">By Nikhill Vombatkere</a></p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `🏆 World Cup Prediction Confirmed - ${playerName}`,
            html: htmlContent
        });
        console.log(`✅ Confirmation email sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error);
        return false;
    }
}

export async function sendAdminNotification(adminEmail, playerName, playerEmail) {
    const htmlContent = `
        <h2>New Prediction Submission</h2>
        <p><strong>Player:</strong> ${playerName}</p>
        <p><strong>Email:</strong> ${playerEmail}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: adminEmail,
            subject: `New WC Prediction: ${playerName}`,
            html: htmlContent
        });
    } catch (error) {
        console.error('Failed to send admin notification:', error);
    }
}

export default transporter;
