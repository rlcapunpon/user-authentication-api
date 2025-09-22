import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodObject<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod errors into user-friendly messages
      const errorMessages = error.issues.map((err: z.ZodIssue) => {
        const field = err.path.join('.');
        if (err.code === 'invalid_type' && err.message.includes('expected string, received undefined')) {
          // Extract just the field name from body.field format
          const fieldName = field.split('.').pop() || field;
          return `${fieldName} is required`;
        }
        return `${field}: ${err.message}`;
      });
      
      return res.status(400).json({ 
        message: errorMessages.join(', '),
        errors: error.issues 
      });
    }
    
    return res.status(400).json({ message: 'Validation error' });
  }
};
