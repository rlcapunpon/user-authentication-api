# CORS Troubleshooting Guide

## Current Status
✅ **CORS is properly configured and working** - The API server has been tested and is correctly handling CORS requests.

## CORS Configuration Details

The API now includes a comprehensive CORS configuration in `src/app.ts`:

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
};
```

## Environment Configuration

Add to your `.env` file:
```bash
# CORS Configuration - comma-separated list of allowed origins
# Leave empty to allow all origins (not recommended for production)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

## Testing CORS

### 1. Test Preflight Request (OPTIONS)
```bash
# PowerShell
$headers = @{'Origin' = 'http://localhost:3001'; 'Access-Control-Request-Method' = 'POST'; 'Access-Control-Request-Headers' = 'Content-Type'}
Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method OPTIONS -Headers $headers
```

### 2. Test Actual Login Request
```bash
# PowerShell
$body = @{email='superadmin@example.com'; password='superadminpassword'} | ConvertTo-Json
$headers = @{'Content-Type'='application/json'; 'Origin'='http://localhost:3001'}
Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method POST -Body $body -Headers $headers
```

## Common CORS Issues and Solutions

### 1. **Browser Shows CORS Error Despite Server Configuration**

**Problem**: Browser console shows CORS errors even when server is configured correctly.

**Solutions**:
- **Clear browser cache and cookies**
- **Disable browser extensions** that might interfere with requests
- **Use incognito/private browsing mode** to test
- **Check if you're making the request to the correct URL** (http vs https, correct port)

### 2. **Credentials Not Being Sent**

**Problem**: Authentication headers or cookies not being sent with requests.

**Client-side Solution**:
```javascript
// For fetch API
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  credentials: 'include', // Important for cookies/auth headers
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password })
});

// For Axios
axios.defaults.withCredentials = true;
// or per request
axios.post('http://localhost:3000/api/auth/login', data, { withCredentials: true });
```

### 3. **Preflight Request Issues**

**Problem**: Browser is sending OPTIONS request that fails.

**Server-side** (already implemented):
- Ensure OPTIONS method is allowed
- Return proper CORS headers in preflight response
- Use `optionsSuccessStatus: 200` for legacy browser compatibility

### 4. **Custom Headers Not Allowed**

**Problem**: Custom headers (like `Authorization`) are being blocked.

**Solution**: Ensure headers are listed in `allowedHeaders` (already configured):
```typescript
allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
```

### 5. **Production CORS Issues**

**Problem**: Works in development but fails in production.

**Solutions**:
1. **Set specific allowed origins** instead of allowing all:
   ```bash
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

2. **Ensure HTTPS** is used in production if your frontend uses HTTPS

3. **Check reverse proxy configuration** (nginx, Apache) - they might strip CORS headers

## Client-Side Recommendations

### React/JavaScript Frontend
```javascript
// Create an API client with proper CORS configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Login function
const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};
```

### Handling Authentication Headers
```javascript
// After login, store token and use in subsequent requests
const token = loginResponse.accessToken;

// Add to all future requests
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Or per request
api.get('/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Debugging Steps

1. **Check browser developer tools**:
   - Network tab to see actual requests/responses
   - Console for CORS error messages
   - Look for preflight OPTIONS requests

2. **Verify server is running**:
   ```bash
   # Test health endpoint
   Invoke-WebRequest -Uri 'http://localhost:3000/health' -Method GET
   ```

3. **Test with curl/Postman**:
   - These tools often bypass CORS restrictions
   - Helps identify if it's a browser-specific issue

4. **Check server logs**:
   - Look for error messages
   - Verify requests are reaching the server

## Production Checklist

- [ ] Set specific `ALLOWED_ORIGINS` instead of allowing all
- [ ] Use HTTPS in production
- [ ] Verify reverse proxy configuration doesn't interfere
- [ ] Test from actual production frontend domain
- [ ] Monitor CORS-related errors in production logs

## Need More Help?

If you're still experiencing CORS issues:

1. **Provide specific error messages** from browser console
2. **Share the exact frontend code** making the request
3. **Specify your frontend framework** (React, Vue, Angular, etc.)
4. **Include network tab screenshots** showing failed requests
5. **Mention your deployment environment** (local, Docker, cloud provider)