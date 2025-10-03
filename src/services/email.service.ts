import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM;

// Log SendGrid environment variable status
console.log('SendGrid environment variables loaded:', {
  apiKeyPresent: !!SENDGRID_API_KEY,
  apiKeyLength: SENDGRID_API_KEY ? SENDGRID_API_KEY.length : 0,
  apiKeyPrefix: SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' : 'undefined',
  fromEmail: SENDGRID_FROM,
  timestamp: new Date().toISOString(),
});

if (!SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is required in environment variables');
}

if (!SENDGRID_FROM) {
  throw new Error('SENDGRID_FROM is required in environment variables');
}

sgMail.setApiKey(SENDGRID_API_KEY);

export interface EmailVerificationData {
  to: string;
  verificationCode: string;
  verificationUrl: string;
}

export interface PasswordUpdateNotificationData {
  to: string;
  updatedBy: string;
  updatedAt: string;
}

export const createVerificationEmail = (data: EmailVerificationData) => {
  const { to, verificationCode, verificationUrl } = data;

  const subject = '🎉 Welcome to WindBooks - Let\'s get you started!';
  const verificationLink = `${verificationUrl}/${verificationCode}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to WindBooks</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #2c3e50; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .email-wrapper {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          min-height: 100vh;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1.5" fill="rgba(255,255,255,0.08)"/><circle cx="50" cy="10" r="1" fill="rgba(255,255,255,0.06)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
        }
        .header h1 { 
          color: #ffffff; 
          margin: 0; 
          font-size: 32px; 
          font-weight: 300; 
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
          z-index: 1;
        }
        .welcome-icon {
          font-size: 48px;
          margin-bottom: 10px;
          display: block;
          position: relative;
          z-index: 1;
        }
        .content { 
          padding: 40px 30px; 
          background: #ffffff;
        }
        .content h2 {
          color: #2c3e50;
          font-size: 24px;
          font-weight: 400;
          margin-bottom: 20px;
          text-align: center;
        }
        .welcome-message {
          background: linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%);
          border-left: 4px solid #4facfe;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 50px;
          margin: 25px 0;
          font-weight: 600;
          text-align: center;
          width: 200px;
          box-shadow: 0 8px 20px rgba(79, 172, 254, 0.3);
          transition: all 0.3s ease;
          font-size: 16px;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(79, 172, 254, 0.4);
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .verification-details {
          background: #f8fbff;
          border: 1px solid #e1f5fe;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .verification-details p {
          margin: 8px 0;
          font-size: 14px;
          color: #546e7a;
        }
        .verification-link {
          word-break: break-all;
          color: #4facfe;
          text-decoration: none;
        }
        .footer { 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 30px; 
          text-align: center; 
          font-size: 14px; 
          color: #78909c;
          border-top: 1px solid #eceff1;
        }
        .security-note { 
          color: #ff7043; 
          font-weight: 500;
          background: #fff3e0;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #ff7043;
          margin: 20px 0;
        }
        .security-note .icon {
          font-size: 18px;
          margin-right: 8px;
        }
        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #4facfe, transparent);
          margin: 30px 0;
          border-radius: 2px;
        }
        .features-preview {
          background: linear-gradient(135deg, #e8f5e8 0%, #f0fff4 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          text-align: center;
        }
        .features-preview h3 {
          color: #2e7d32;
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .features-preview p {
          color: #4caf50;
          margin: 5px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <span class="welcome-icon">🎉</span>
            <h1>Welcome to WindBooks!</h1>
          </div>
          <div class="content">
            <h2>You're almost there! 🚀</h2>
            
            <div class="welcome-message">
              <p><strong>Hi there!</strong> 👋</p>
              <p>We're absolutely thrilled to have you join the WindBooks community! You've just taken the first step toward an amazing journey with us.</p>
            </div>

            <p>To unlock your account and start exploring all the wonderful features we have prepared for you, we just need to verify your email address. It only takes one click!</p>

            <div class="button-container">
              <a href="${verificationLink}" class="button">✨ Verify My Email</a>
            </div>

            <div class="features-preview">
              <h3>🌟 What awaits you:</h3>
              <p>📚 Access to your personal library</p>
              <p>🔐 Secure account management</p>
              <p>🎯 Personalized recommendations</p>
              <p>💬 Community features</p>
            </div>

            <div class="divider"></div>

            <div class="verification-details">
              <p><strong>Alternative verification method:</strong></p>
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="${verificationLink}" class="verification-link">${verificationLink}</a></p>
            </div>

            <div class="security-note">
              <span class="icon">⏰</span>
              <strong>Quick heads-up:</strong> This verification link is valid for 15 minutes to keep your account secure. If it expires, don't worry - you can always request a new one!
            </div>

            <div class="divider"></div>

            <p>If you didn't create this account, no worries at all! You can safely ignore this email, and nothing will happen to your inbox.</p>

            <p style="margin-top: 30px;">
              <strong>Welcome aboard! 🎊</strong><br>
              <span style="color: #4facfe;">The WindBooks Team</span>
            </p>
          </div>
          <div class="footer">
            <p>This email was sent to <strong>${to}</strong></p>
            <p>Questions? We'd love to help! Feel free to reach out to our friendly support team anytime. 💙</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    🎉 Welcome to WindBooks!

    Hi there! 👋

    We're absolutely thrilled to have you join the WindBooks community! You've just taken the first step toward an amazing journey with us.

    To unlock your account and start exploring all the wonderful features we have prepared for you, we just need to verify your email address.

    Please click this link to verify your email: ${verificationLink}

    🌟 What awaits you:
    📚 Access to your personal library
    🔐 Secure account management  
    🎯 Personalized recommendations
    💬 Community features

    ⏰ Quick heads-up: This verification link is valid for 15 minutes to keep your account secure. If it expires, don't worry - you can always request a new one!

    If you didn't create this account, no worries at all! You can safely ignore this email.

    Welcome aboard! 🎊
    The WindBooks Team

    ---
    This email was sent to ${to}
    Questions? We'd love to help! Feel free to reach out to our friendly support team anytime. 💙
  `;

  return {
    to,
    from: SENDGRID_FROM,
    subject,
    html,
    text,
  };
};

export const sendVerificationEmail = async (data: EmailVerificationData): Promise<boolean> => {
  try {
    console.log('Attempting to send verification email:', {
      to: data.to,
      from: SENDGRID_FROM,
      timestamp: new Date().toISOString(),
    });

    // Skip actual email sending in test environment for faster tests
    if (process.env.NODE_ENV === 'test') {
      console.log('Test environment detected - skipping actual email send:', {
        to: data.to,
        verificationCode: data.verificationCode.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
      
      // Simulate a small delay to make tests more realistic
      await new Promise(resolve => setTimeout(resolve, 10));
      
      console.log('Verification email sent successfully (mocked):', {
        to: data.to,
        messageId: 'mock-message-id-' + Math.random().toString(36).substring(7),
        statusCode: 202,
        timestamp: new Date().toISOString(),
      });
      
      return true;
    }

    const msg = createVerificationEmail(data);
    const [response] = await sgMail.send(msg);
    
    console.log('Verification email sent successfully:', {
      to: data.to,
      messageId: response.headers['x-message-id'],
      statusCode: response.statusCode,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Failed to send verification email:', {
      to: data.to,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : error,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
};

export const sendVerificationEmailWithRetry = async (
  data: EmailVerificationData,
  maxRetries: number = parseInt(process.env.EMAIL_RETRY_MAX || '2')
): Promise<boolean> => {
  let attempts = 0;

  console.log('Starting verification email send with retry:', {
    to: data.to,
    maxRetries,
    timestamp: new Date().toISOString(),
  });

  while (attempts <= maxRetries) {
    try {
      console.log(`Email send attempt ${attempts + 1}/${maxRetries + 1}:`, {
        to: data.to,
        attempt: attempts + 1,
        timestamp: new Date().toISOString(),
      });

      const success = await sendVerificationEmail(data);
      if (success) {
        console.log('Verification email sent successfully on attempt:', {
          to: data.to,
          attempt: attempts + 1,
          timestamp: new Date().toISOString(),
        });
        return true;
      }
    } catch (error) {
      console.error(`Email send attempt ${attempts + 1} failed:`, {
        to: data.to,
        attempt: attempts + 1,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
      });
    }

    attempts++;
    if (attempts <= maxRetries) {
      const waitTime = 1000 * attempts; // Exponential backoff: 1s, 2s, 3s...
      console.log(`Waiting ${waitTime}ms before retry attempt ${attempts + 1}:`, {
        to: data.to,
        waitTime,
        timestamp: new Date().toISOString(),
      });
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  console.error('All email send attempts failed:', {
    to: data.to,
    totalAttempts: attempts,
    maxRetries,
    timestamp: new Date().toISOString(),
  });

  return false;
};

export const createPasswordUpdateNotificationEmail = (data: PasswordUpdateNotificationData) => {
  const { to, updatedBy, updatedAt } = data;

  const subject = '🔐 Your WindBooks Password Has Been Updated';
  const formattedDate = new Date(updatedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Updated - WindBooks</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .email-wrapper {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="security" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1.5" fill="rgba(255,255,255,0.08)"/><circle cx="50" cy="10" r="1" fill="rgba(255,255,255,0.06)"/></pattern></defs><rect width="100" height="100" fill="url(%23security)"/></svg>') repeat;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 28px;
          font-weight: 300;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
          z-index: 1;
        }
        .security-icon {
          font-size: 48px;
          margin-bottom: 10px;
          display: block;
          position: relative;
          z-index: 1;
        }
        .content {
          padding: 40px 30px;
          background: #ffffff;
        }
        .content h2 {
          color: #2c3e50;
          font-size: 24px;
          font-weight: 400;
          margin-bottom: 20px;
          text-align: center;
        }
        .notification-box {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border: 2px solid #f39c12;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        .notification-box .icon {
          font-size: 36px;
          color: #f39c12;
          margin-bottom: 15px;
        }
        .notification-box h3 {
          color: #d68910;
          margin: 0 0 10px 0;
          font-size: 20px;
        }
        .notification-box p {
          color: #8b4513;
          margin: 5px 0;
          font-weight: 500;
        }
        .details-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          border-left: 4px solid #ff6b6b;
        }
        .details-section h4 {
          color: #495057;
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-item:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #6c757d;
        }
        .detail-value {
          color: #495057;
          font-family: 'Courier New', monospace;
        }
        .security-tips {
          background: linear-gradient(135deg, #e8f5e8 0%, #f0fff4 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          border-left: 4px solid #28a745;
        }
        .security-tips h4 {
          color: #155724;
          margin: 0 0 10px 0;
          font-size: 16px;
        }
        .security-tips ul {
          color: #155724;
          margin: 0;
          padding-left: 20px;
        }
        .security-tips li {
          margin: 5px 0;
        }
        .action-section {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 50px;
          margin: 10px 0;
          font-weight: 600;
          text-align: center;
          width: 200px;
          box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
          transition: all 0.3s ease;
          font-size: 16px;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(255, 107, 107, 0.4);
        }
        .footer {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 30px;
          text-align: center;
          font-size: 14px;
          color: #78909c;
          border-top: 1px solid #eceff1;
        }
        .warning-note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          border-left: 4px solid #f39c12;
        }
        .warning-note .icon {
          color: #f39c12;
          font-size: 18px;
          margin-right: 8px;
        }
        .warning-note strong {
          color: #8b4513;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          <div class="header">
            <span class="security-icon">🔐</span>
            <h1>Password Updated</h1>
          </div>
          <div class="content">
            <h2>Security Alert: Password Change</h2>

            <div class="notification-box">
              <div class="icon">⚠️</div>
              <h3>Password Successfully Updated</h3>
              <p>Your WindBooks account password has been changed.</p>
              <p>If you made this change, no further action is needed.</p>
            </div>

            <div class="details-section">
              <h4>📋 Change Details:</h4>
              <div class="detail-item">
                <span class="detail-label">Updated By:</span>
                <span class="detail-value">${updatedBy}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Updated At:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
            </div>

            <div class="warning-note">
              <span class="icon">🚨</span>
              <strong>Important:</strong> If you did not request this password change, please contact our support team immediately and consider changing your password again.
            </div>

            <div class="security-tips">
              <h4>🛡️ Security Best Practices:</h4>
              <ul>
                <li>Use a strong, unique password for your account</li>
                <li>Enable two-factor authentication when available</li>
                <li>Never share your password with others</li>
                <li>Regularly update your passwords</li>
                <li>Be cautious of phishing attempts</li>
              </ul>
            </div>

            <div class="action-section">
              <p>If you have any concerns about this password change, please contact our support team.</p>
              <a href="mailto:support@windbooks.com" class="button">📞 Contact Support</a>
            </div>

            <p style="margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px;">
              <strong>Stay Secure! 🔒</strong><br>
              <span style="color: #ff6b6b;">WindBooks Security Team</span>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated security notification for <strong>${to}</strong></p>
            <p>If you have questions about your account security, our team is here to help! 💙</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    🔐 PASSWORD UPDATED - WindBooks Security Alert

    Your WindBooks account password has been successfully changed.

    📋 Change Details:
    - Updated By: ${updatedBy}
    - Updated At: ${formattedDate}

    ⚠️  IMPORTANT: If you did not request this password change, please contact our support team immediately!

    🛡️ Security Best Practices:
    - Use a strong, unique password for your account
    - Enable two-factor authentication when available
    - Never share your password with others
    - Regularly update your passwords
    - Be cautious of phishing attempts

    If you have any concerns about this password change, please contact our support team at support@windbooks.com.

    Stay Secure!
    WindBooks Security Team

    ---
    This is an automated security notification for ${to}
    If you have questions about your account security, our team is here to help!
  `;

  return {
    to,
    from: SENDGRID_FROM,
    subject,
    html,
    text,
  };
};

export const sendPasswordUpdateNotification = async (data: PasswordUpdateNotificationData): Promise<boolean> => {
  try {
    console.log('Attempting to send password update notification:', {
      to: data.to,
      updatedBy: data.updatedBy,
      timestamp: new Date().toISOString(),
    });

    // Skip actual email sending in test environment for faster tests
    if (process.env.NODE_ENV === 'test') {
      console.log('Test environment detected - skipping actual email send:', {
        to: data.to,
        updatedBy: data.updatedBy,
        timestamp: new Date().toISOString(),
      });

      // Simulate a small delay to make tests more realistic
      await new Promise(resolve => setTimeout(resolve, 10));

      console.log('Password update notification sent successfully (mocked):', {
        to: data.to,
        messageId: 'mock-password-update-message-id-' + Math.random().toString(36).substring(7),
        statusCode: 202,
        timestamp: new Date().toISOString(),
      });

      return true;
    }

    const msg = createPasswordUpdateNotificationEmail(data);
    const [response] = await sgMail.send(msg);

    console.log('Password update notification sent successfully:', {
      to: data.to,
      messageId: response.headers['x-message-id'],
      statusCode: response.statusCode,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Failed to send password update notification:', {
      to: data.to,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : error,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
};