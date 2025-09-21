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

export const createVerificationEmail = (data: EmailVerificationData) => {
  const { to, verificationCode, verificationUrl } = data;

  const subject = 'Verify Your Email Address - WindBooks';
  const verificationLink = `${verificationUrl}/${verificationCode}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .warning { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to WindBooks</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with WindBooks! To complete your registration and activate your account, please verify your email address.</p>

          <p>Click the button below to verify your email:</p>

          <a href="${verificationLink}" class="button">Verify Email Address</a>

          <p><strong>Verification Link:</strong><br>
          <a href="${verificationLink}">${verificationLink}</a></p>

          <p class="warning">This link will expire in 15 minutes for security reasons.</p>

          <p>If you didn't create an account with WindBooks, please ignore this email.</p>

          <p>Best regards,<br>The WindBooks Team</p>
        </div>
        <div class="footer">
          <p>This email was sent to ${to}. If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to WindBooks!

    Thank you for registering! To complete your registration and activate your account, please verify your email address.

    Click this link to verify your email: ${verificationLink}

    This link will expire in 15 minutes for security reasons.

    If you didn't create an account with WindBooks, please ignore this email.

    Best regards,
    The WindBooks Team
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