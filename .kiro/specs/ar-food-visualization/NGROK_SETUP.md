# ngrok Setup Complete ✅

## Installation Status

✅ **ngrok v3.34.0** has been successfully installed via Homebrew

## Next Steps to Use ngrok

### 1. Authenticate ngrok (One-time setup)

ngrok requires a free account for usage. Follow these steps:

1. **Sign up for a free ngrok account:**
   - Visit: https://dashboard.ngrok.com/signup
   - Sign up with email or GitHub

2. **Get your authtoken:**
   - After signing in, go to: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

3. **Configure ngrok with your authtoken:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

### 2. Start Your Development Server

```bash
npm run dev
```

Keep this running in one terminal.

### 3. Start ngrok Tunnel

In a **new terminal window**, run:

```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       your-email@example.com
Version                       3.34.0
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 4. Access from Mobile Device

Open your mobile browser (Safari on iOS or Chrome on Android) and navigate to the HTTPS URL:

```
https://abc123.ngrok.io
```

**Important:** Use the HTTPS URL (not HTTP) for WebXR to work!

## Quick Commands Reference

```bash
# Check ngrok version
ngrok version

# Start tunnel to localhost:3000
ngrok http 3000

# Start tunnel with custom subdomain (paid feature)
ngrok http 3000 --subdomain=my-food-lens

# View ngrok web interface (shows requests/responses)
# Open browser to: http://127.0.0.1:4040
```

## Tips for AR Development

1. **Keep ngrok running:** Once started, keep the ngrok terminal open throughout your development session
2. **Save the URL:** The HTTPS URL changes each time you restart ngrok (unless you have a paid plan)
3. **Test immediately:** After each code change, the ngrok URL will reflect your changes instantly
4. **Monitor traffic:** Visit http://127.0.0.1:4040 to see all HTTP requests in real-time

## Free Tier Limitations

- Session timeout: 2 hours (then you need to restart)
- Random URL each time (e.g., `https://abc123.ngrok.io`)
- 40 connections/minute limit

For extended development, consider:
- Restarting ngrok when session expires
- Upgrading to paid plan for static URLs
- Using local network + self-signed cert (see MOBILE_TESTING_GUIDE.md)

## Alternative: Local Network Testing

If you don't want to use ngrok, you can test on your local network:

```bash
# Find your local IP
ipconfig getifaddr en0

# Start dev server on all interfaces
npm run dev -- -H 0.0.0.0

# Access from mobile
http://YOUR_LOCAL_IP:3000
```

**Note:** This won't work for AR features (WebXR requires HTTPS), but it's useful for testing UI/layout.

## Troubleshooting

### "command not found: ngrok"
- Restart your terminal
- Or run: `source ~/.zshrc`

### "Error reading configuration file"
- You need to authenticate first (see step 1 above)
- Run: `ngrok config add-authtoken YOUR_TOKEN`

### "Failed to start tunnel"
- Check if port 3000 is already in use
- Ensure your dev server is running
- Try a different port: `ngrok http 3001`

## Ready to Test AR!

Once ngrok is running:
1. Open the HTTPS URL on your mobile device
2. Navigate to a menu page
3. Click "View in AR" on any menu item
4. Grant camera permissions
5. Start testing AR features!

See **MOBILE_TESTING_GUIDE.md** for detailed testing instructions.
