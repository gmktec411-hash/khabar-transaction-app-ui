# Quick Start - Fix Network Access Issues

## The Problem
Your app shows "error loading data" when accessed from a different machine because the API URLs are hardcoded to `localhost`, which only works on the host computer.

## The Quick Fix

### Option 1: Automated Setup (Windows)
1. Double-click `setup-network.bat`
2. Choose option 2 (Network access)
3. Enter your server IP or let it auto-detect
4. Restart the app: `npm start`

### Option 2: Manual Setup
1. Find your server's IP address:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. Edit the `.env` file in the project root:
   ```env
   REACT_APP_API_BASE_URL=http://192.168.1.100:8848/api
   REACT_APP_OUTLOOK_API_BASE_URL=http://192.168.1.100:8080
   ```
   (Replace `192.168.1.100` with YOUR actual IP)

3. Restart the React app:
   ```bash
   npm start
   ```

4. Access from other machines:
   ```
   http://192.168.1.100:3000
   ```

## Important Checklist

- [ ] Backend servers are running on ports 8848 and 8080
- [ ] Firewall allows traffic on ports 3000, 8848, 8080
- [ ] Backend is configured to accept connections from `0.0.0.0` (not just localhost)
- [ ] `.env` file updated with server IP
- [ ] React app restarted after `.env` changes

## Files Created

1. **`.env`** - Your environment configuration (DO NOT commit to git)
2. **`.env.example`** - Template for others to use
3. **`NETWORK_SETUP.md`** - Detailed setup instructions
4. **`setup-network.bat`** - Automated setup script (Windows)

## What Changed

### Before (Broken):
```javascript
API_BASE_URL: "http://localhost:8848/api"  // Only works on host machine
```

### After (Fixed):
```javascript
API_BASE_URL: process.env.REACT_APP_API_BASE_URL  // Uses .env configuration
```

## Troubleshooting

### Still getting errors?

1. **Check backend is running:**
   ```
   http://YOUR_IP:8848/api/health
   ```

2. **Check firewall:**
   ```cmd
   netstat -an | findstr "8848 8080"
   ```

3. **Check backend logs** for connection errors

4. **Test with curl or Postman:**
   ```bash
   curl http://YOUR_IP:8848/api/health
   ```

## Need More Help?

See the detailed guide: [NETWORK_SETUP.md](NETWORK_SETUP.md)

## Production Deployment

For production, consider:
- Using a domain name instead of IP
- Setting up HTTPS with SSL certificates
- Using a reverse proxy (Nginx)
- Environment-specific configurations
