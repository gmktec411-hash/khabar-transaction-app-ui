# Network Setup Guide - Access from Different Machines

## Problem
The app only works on the host machine (localhost) and shows errors when accessed from other computers on the network.

## Solution

### Step 1: Find Your Server's IP Address

**On Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

**On Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for the `inet` address (e.g., `192.168.1.100`)

### Step 2: Update Environment Variables

1. Open the `.env` file in the project root directory
2. Update the URLs with your server's IP address:

```env
# Replace localhost with your server's IP address
REACT_APP_API_BASE_URL=http://192.168.1.100:8848/api
REACT_APP_OUTLOOK_API_BASE_URL=http://192.168.1.100:8080
```

**Example:**
- If your server IP is `192.168.1.100`
- Change `http://localhost:8848/api` to `http://192.168.1.100:8848/api`
- Change `http://localhost:8080` to `http://192.168.1.100:8080`

### Step 3: Update Backend Servers

Make sure your backend servers are configured to accept connections from other machines:

**For Java/Spring Boot backends:**
```properties
# In application.properties or application.yml
server.address=0.0.0.0
# This allows connections from any IP address
```

**For Node.js/Express backends:**
```javascript
// Make sure server binds to 0.0.0.0 instead of localhost
app.listen(8080, '0.0.0.0', () => {
  console.log('Server listening on all interfaces');
});
```

### Step 4: Configure Firewall

**Windows:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Click "Next"
5. Select "TCP" → Enter ports: `8848, 8080, 3000`
6. Allow the connection
7. Name it "Transaction App Ports"

**Mac:**
1. Open System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add your app and allow incoming connections

**Linux (using ufw):**
```bash
sudo ufw allow 8848
sudo ufw allow 8080
sudo ufw allow 3000
sudo ufw reload
```

### Step 5: Restart the App

After updating the `.env` file:

```bash
# Stop the running app (Ctrl+C)
# Then restart it
npm start
```

### Step 6: Access from Other Machines

From other computers on the same network, open your browser and go to:
```
http://192.168.1.100:3000
```
(Replace `192.168.1.100` with your server's actual IP address)

## Verification Checklist

- [ ] Backend servers are running (port 8848 and 8080)
- [ ] Backend servers are configured to accept external connections (0.0.0.0)
- [ ] Firewall allows traffic on ports 8848, 8080, and 3000
- [ ] `.env` file has been updated with server IP address
- [ ] React app has been restarted after `.env` changes
- [ ] Testing from another machine using server IP (not localhost)

## Common Issues

### Issue: "Network Error" or "Failed to load data"
**Solution:**
- Check if backend servers are actually running
- Verify backend ports (8848, 8080) are open
- Test backend directly: `http://YOUR_IP:8848/api/health`

### Issue: "Connection refused"
**Solution:**
- Firewall is blocking the ports
- Backend is only listening on localhost, not 0.0.0.0

### Issue: "CORS Error"
**Solution:**
- Backend needs CORS configuration to allow requests from your frontend
- Add CORS headers in backend:
  ```java
  // For Spring Boot
  @CrossOrigin(origins = "*")
  ```

### Issue: Works on localhost but not with IP
**Solution:**
- Make sure you're using the server IP in the `.env` file
- Restart the React app after changing `.env`
- Clear browser cache

## Production Deployment

For production, consider using:
- **Domain names** instead of IP addresses
- **HTTPS** with SSL certificates
- **Reverse proxy** (Nginx/Apache)
- **Environment-specific** .env files

## Support

If you continue to have issues:
1. Check browser console for error messages (F12)
2. Check backend server logs
3. Verify network connectivity: `ping YOUR_SERVER_IP`
4. Test backend directly with tools like Postman or curl
