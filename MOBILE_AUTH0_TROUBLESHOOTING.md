# Auth0 Mobile Login Troubleshooting Guide

## Common Mobile Auth0 Issues

### 1. **Redirect URI Mismatch**

**Problem**: Auth0 redirect URIs don't match between desktop and mobile
**Solution**: Ensure your Auth0 dashboard includes:

- `https://www.theglamstore.ng` (production)
- `https://theglamstore.ng` (production without www)
- `http://localhost:5173` (development)

### 2. **Mobile Browser Storage Issues**

**Problem**: Mobile browsers (especially Safari) have stricter localStorage policies
**Solution**:

- Use `cacheLocation: "localstorage"` (already configured)
- Ensure HTTPS in production
- Test in incognito/private mode

### 3. **Auth0 Audience Configuration**

**Problem**: Missing or incorrect audience parameter
**Solution**:

- Set `VITE_AUTH0_AUDIENCE` environment variable
- Ensure audience is configured in Auth0 dashboard
- Use the same audience in both login and token exchange

### 4. **Mobile-Specific Auth0 Settings**

**Problem**: Auth0 application not configured for mobile
**Solution**: In Auth0 dashboard:

- Set **Application Type**: Single Page Application
- Enable **Refresh Token Rotation**
- Set **Token Endpoint Authentication Method**: None
- Enable **Allow Offline Access**

### 5. **CORS Issues on Mobile**

**Problem**: Mobile browsers handle CORS differently
**Solution**:

- Ensure backend CORS includes your mobile domain
- Test with different mobile browsers
- Check network requests in mobile dev tools

## Debugging Steps

### 1. Check Environment Variables

```bash
# In Vercel dashboard, ensure these are set:
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-audience
VITE_WEB_APP_ORIGIN=https://www.theglamstore.ng
```

### 2. Test on Different Mobile Browsers

- Chrome Mobile
- Safari Mobile
- Firefox Mobile
- Edge Mobile

### 3. Check Mobile Console

- Open mobile browser dev tools
- Look for Auth0 errors
- Check network requests
- Verify localStorage is working

### 4. Test Auth0 Configuration

- Visit: `https://your-domain.auth0.com/.well-known/openid_configuration`
- Verify all endpoints are accessible
- Check if audience is properly configured

## Mobile-Specific Fixes Applied

### 1. **Enhanced Auth0Provider Configuration**

```tsx
<Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: import.meta.env.VITE_WEB_APP_ORIGIN,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  }}
  useRefreshTokens={true}
  cacheLocation="localstorage"
  useRefreshTokensFallback={false}
>
```

### 2. **Improved Error Handling**

- Better error messages for mobile users
- Graceful fallback for silent auth failures
- Proper loading states

### 3. **Mobile-Optimized Auth Flow**

- Check existing tokens first
- Better token refresh handling
- Improved initialization logic

## Testing Checklist

- [ ] Auth0 dashboard configured for mobile
- [ ] Redirect URIs include mobile domain
- [ ] Environment variables set correctly
- [ ] HTTPS enabled in production
- [ ] CORS configured for mobile domain
- [ ] Tested on multiple mobile browsers
- [ ] Checked mobile console for errors
- [ ] Verified localStorage works on mobile

## Common Mobile Auth0 Errors

### "Invalid redirect_uri"

- Check Auth0 dashboard settings
- Ensure exact URL match (including www/non-www)

### "Invalid audience"

- Set VITE_AUTH0_AUDIENCE environment variable
- Configure audience in Auth0 dashboard

### "Silent authentication failed"

- Normal on first visit
- Should work on subsequent visits
- Check if user is already logged in

### "Token exchange failed"

- Check backend CORS settings
- Verify Auth0 token is valid
- Check network connectivity

## Quick Fixes

1. **Clear mobile browser cache and cookies**
2. **Test in incognito/private mode**
3. **Check mobile network connectivity**
4. **Verify HTTPS is working**
5. **Test on different mobile devices**

If issues persist, check the mobile browser console for specific error messages and network request failures.
