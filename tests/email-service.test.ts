// Mock environment variables for email service
process.env.SENDGRID_API_KEY = 'test-api-key';
process.env.SENDGRID_FROM = 'test@example.com';

import { createVerificationEmail } from '../src/services/email.service';

describe('Email Service', () => {
  describe('createVerificationEmail', () => {
    it('should include the updated "What awaits you" content in HTML', () => {
      const testData = {
        to: 'test@example.com',
        verificationCode: '123456',
        verificationUrl: 'https://example.com/verify',
      };

      const email = createVerificationEmail(testData);

      // Check that the new content is present in HTML
      expect(email.html).toContain('What Awaits You:');
      expect(email.html).toContain('1. Hassle-Free Compliance');
      expect(email.html).toContain('Automatic reminders and guided filing for VAT, Percentage Tax, Withholding, and Income Tax obligations — no more missed deadlines.');
      expect(email.html).toContain('2. Smart Bookkeeping');
      expect(email.html).toContain('Real-time recording of sales, expenses, and withholdings, seamlessly organized for BIR compliance and business insights.');
      expect(email.html).toContain('3. Peace of Mind with BIR-Ready Reports');
      expect(email.html).toContain('Generate BIR-compliant forms, summaries, and financial statements that are always ready for audit or submission.');
      expect(email.html).toContain('4. More Time for Growth');
      expect(email.html).toContain('Spend less time on manual paperwork and tax calculations, and more time growing your business with confidence.');
    });

    it('should include the updated "What awaits you" content in text', () => {
      const testData = {
        to: 'test@example.com',
        verificationCode: '123456',
        verificationUrl: 'https://example.com/verify',
      };

      const email = createVerificationEmail(testData);

      // Check that the new content is present in text
      expect(email.text).toContain('What Awaits You:');
      expect(email.text).toContain('1. Hassle-Free Compliance');
      expect(email.text).toContain('Automatic reminders and guided filing for VAT, Percentage Tax, Withholding, and Income Tax obligations — no more missed deadlines.');
      expect(email.text).toContain('2. Smart Bookkeeping');
      expect(email.text).toContain('Real-time recording of sales, expenses, and withholdings, seamlessly organized for BIR compliance and business insights.');
      expect(email.text).toContain('3. Peace of Mind with BIR-Ready Reports');
      expect(email.text).toContain('Generate BIR-compliant forms, summaries, and financial statements that are always ready for audit or submission.');
      expect(email.text).toContain('4. More Time for Growth');
      expect(email.text).toContain('Spend less time on manual paperwork and tax calculations, and more time growing your business with confidence.');
    });

    it('should create a properly structured email', () => {
      const testData = {
        to: 'test@example.com',
        verificationCode: '123456',
        verificationUrl: 'https://example.com/verify',
      };

      const email = createVerificationEmail(testData);

      expect(email).toHaveProperty('to', 'test@example.com');
      expect(email).toHaveProperty('from');
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('html');
      expect(email).toHaveProperty('text');
      expect(email.subject).toContain('Welcome to WindBooks');
      expect(email.html).toContain('✨ Verify My Email');
      expect(email.text).toContain('Please click this link to verify your email');
    });
  });
});