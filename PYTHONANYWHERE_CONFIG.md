# PythonAnywhere Backend Configuration & Troubleshooting Guide

## 🔴 Current Issues

1. **499 Client Closed Request** - Request times out before server responds
2. **Worker HARAKIRI (Signal 9)** - uWSGI worker killed by OS (memory/timeout)
3. **300-second timeout on /stylize** - CycleGAN inference exceeds PythonAnywhere limits
4. **Missing /health responses** - Server can't respond within client timeout

---

## ✅ PRIORITY FIX: PythonAnywhere Web App Settings

### Step 1: Increase Web App Timeout

**Location:** PythonAnywhere Web console → Web tab

```
1. Go to: https://www.pythonanywhere.com/user/linahuo189/webapps/
2. Click: "linahuo189.pythonanywhere.com"
3. Scroll to: "Web app reload settings"
4. Change timeout from: 300 → 600+ seconds
5. Save
6. Reload web app
```

**Why:** CycleGAN model inference takes 200-300s. You need 600s to be safe.

### Step 2: Verify WSGI Configuration

**File:** `/var/www/linahuo189_pythonanywhere_com_wsgi.py`

```python
# Add at the TOP of your WSGI file:
import os
import sys

# Increase timeout for CycleGAN processing
os.environ['UWSGI_IDLE_TIMEOUT'] = '600'
os.environ['UWSGI_HARAKIRI_TIMEOUT'] = '600'

# Your existing WSGI code below...
```

### Step 3: Check System Limits

**SSH into PythonAnywhere:**
```bash
ssh linahuo189@ssh.pythonanywhere.com

# Check current settings
ulimit -a

# Check memory usage during inference
free -h
watch -n 1 free -h

# Monitor processes
ps aux | grep python
```

---

## 📋 Backend Diagnostics Checklist

### A. Model Files Check

```bash
# SSH into PythonAnywhere
ssh linahuo189@ssh.pythonanywhere.com

# Navigate to project
cd photo2monet

# List checkpoint files
ls -lah checkpoints/

# Should show:
# ✓ checkpoints/style_monet_pretrained/latest_net_G.pth
# ✓ checkpoints/style_cezanne_pretrained/latest_net_G.pth
# ✓ checkpoints/style_ukiyoe_pretrained/latest_net_G.pth
# ✓ checkpoints/style_vangogh_pretrained/latest_net_G.pth

# If missing, download them:
git clone https://github.com/junyanz/CycleGAN
cp CycleGAN/checkpoints/* ./checkpoints/
```

### B. Check App Logs

**File:** `/var/log/linahuo189_pythonanywhere_com.log`

```bash
# SSH into PythonAnywhere
tail -f /var/log/linahuo189_pythonanywhere_com.log

# Watch for:
# ✓ "health" endpoint responding quickly
# ✓ "stylize" endpoint starting (not timeout messages)
# ✓ Model loading messages
# ✗ HARAKIRI signals
# ✗ Timeout errors
```

### C. Test Endpoints Directly

```bash
# From your local machine or PythonAnywhere terminal

# Test 1: Health endpoint (should be instant)
curl -v https://linahuo189.pythonanywhere.com/health

# Expected response:
# HTTP/1.1 200 OK
# {"ok": true, "has_models": true, ...}

# Test 2: Styles endpoint (should be instant)
curl -v https://linahuo189.pythonanywhere.com/styles

# Expected response:
# HTTP/1.1 200 OK
# {"ok": true, "styles": ["monet", "cezanne", "ukiyoe", "vangogh"], ...}

# Test 3: Stylize endpoint (will take 200-300s)
# This should NOT return 499 (client closed)
curl -v \
  -F "file=@test_image.jpg" \
  -F "style=monet" \
  https://linahuo189.pythonanywhere.com/stylize
```

---

## 🔧 Recommended app.py Updates

Replace your current `app.py` with the optimized version that includes:

✓ Better error handling and logging  
✓ Timeout management for PythonAnywhere  
✓ Detailed health checks  
✓ Proper subprocess timeout handling  
✓ Memory-efficient image processing  
✓ Checkpoint verification  

**File to use:** `app-pythonanywhere-optimized.py`

---

## 📊 Performance Tuning

### Memory Management

```python
# Add to your test.py or inference script:
import gc
import torch

# Force garbage collection before model inference
gc.collect()
if torch.cuda.is_available():
    torch.cuda.empty_cache()

# After inference:
gc.collect()
if torch.cuda.is_available():
    torch.cuda.empty_cache()
```

### Timeout Configuration

**Current:** 300 seconds (from client perspective)
**Recommended:** 600+ seconds

```python
# In your FastAPI app:
STYLIZE_TIMEOUT = 250  # Leave headroom for PythonAnywhere (web app timeout - 50s)
HEALTH_CHECK_TIMEOUT = 10
STYLES_TIMEOUT = 10
```

---

## 🚨 If Still Getting 499 Errors

1. **Check PythonAnywhere Logs:**
   ```bash
   ssh linahuo189@ssh.pythonanywhere.com
   tail -50 /var/log/linahuo189_pythonanywhere_com.log
   ```

2. **Check Message Queue:**
   - Go to: PythonAnywhere → Web → Error log
   - Look for: "499", "502", "504" errors

3. **Test with Shorter Timeout:**
   ```bash
   # Test health endpoint with explicit timeout
   timeout 10 curl -v https://linahuo189.pythonanywhere.com/health
   
   # If this fails with timeout, increase PythonAnywhere timeout
   ```

4. **Monitor During Request:**
   ```bash
   # SSH into PythonAnywhere
   watch -n 1 'ps aux | grep python'
   
   # While making request from another terminal
   ```

---

## 📝 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 499 Client Closed | Request timeout | Increase PythonAnywhere timeout to 600s |
| 504 Gateway Timeout | Model too slow | Check if CycleGAN is installed, verify checkpoints |
| 502 Bad Gateway | App crash | Check logs for errors, restart web app |
| Empty response | health check fails | Verify /health endpoint responds quickly |
| Worker dies (HARAKIRI) | Out of memory | Upgrade to paid PythonAnywhere plan |
| Model not found | Missing checkpoints | Download from GitHub/Hugging Face |

---

## ✨ Frontend Integration Check

**File:** `src/lib/paintingOrderBackend.ts`

Current timeouts:
- Health: 25 seconds (good)
- Styles: 20 seconds (good)
- Stylize: 300 seconds (may need to increase)

```typescript
export function getPaintingTransferTimeoutMs() {
  return Number(process.env.PAINTING_STYLE_API_TIMEOUT_MS || 300000);
}
// Increase to: 600000 (600 seconds)
```

---

## 🔄 Next Steps

1. **Immediate (5 min):**
   - Increase PythonAnywhere web app timeout to 600s
   - Restart web app

2. **Short term (15 min):**
   - Replace app.py with optimized version
   - Check model checkpoint files exist
   - Test /health endpoint

3. **Medium term (30 min):**
   - Monitor logs during /stylize requests
   - Adjust timeouts based on actual inference time
   - Add memory optimization if needed

4. **Long term:**
   - Consider Hugging Face model quantization
   - Cache results to reduce repeated inference
   - Implement job queue for concurrent requests

---

## 📞 Support

If issues persist:

1. Export these diagnostics:
   ```bash
   python backend-diagnostics.py > diagnostics.txt
   ```

2. Check PythonAnywhere logs for specific error messages

3. Verify with simple test request before complex ones

---

**Last Updated:** April 7, 2026
**Backend URL:** https://linahuo189.pythonanywhere.com
**Frontend:** http://localhost:3000
