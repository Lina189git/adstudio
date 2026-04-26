import requests
import time
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://linahuo189.pythonanywhere.com"
TIMEOUT_SECONDS = 30  # Short timeout to avoid hanging

def log_result(title, success, message, details=None):
    """Pretty print results"""
    status = "✓ PASS" if success else "✗ FAIL"
    print(f"\n{status} | {title}")
    print(f"  → {message}")
    if details:
        print(f"  → Details: {details}")
    return success

def check_health_endpoint():
    """Check /health endpoint"""
    print("\n" + "="*60)
    print("1. CHECKING HEALTH ENDPOINT")
    print("="*60)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/health",
            timeout=TIMEOUT_SECONDS
        )
        success = response.status_code == 200
        log_result(
            "Health Check",
            success,
            f"Status: {response.status_code}",
            f"Response time: {response.elapsed.total_seconds():.2f}s"
        )
        return success
    except requests.Timeout:
        log_result(
            "Health Check",
            False,
            "Request timed out",
            f"Timeout after {TIMEOUT_SECONDS}s - Backend may be overloaded"
        )
        return False
    except Exception as e:
        log_result(
            "Health Check",
            False,
            "Connection failed",
            str(e)
        )
        return False

def check_styles_endpoint():
    """Check /styles endpoint"""
    print("\n" + "="*60)
    print("2. CHECKING STYLES ENDPOINT")
    print("="*60)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/styles",
            timeout=TIMEOUT_SECONDS
        )
        success = response.status_code == 200
        
        if success:
            styles = response.json()
            log_result(
                "Styles Endpoint",
                True,
                f"Available styles: {styles}",
                f"Response time: {response.elapsed.total_seconds():.2f}s"
            )
        else:
            log_result(
                "Styles Endpoint",
                False,
                f"Status: {response.status_code}",
                response.text
            )
        return success
    except Exception as e:
        log_result(
            "Styles Endpoint",
            False,
            "Failed to fetch styles",
            str(e)
        )
        return False

def check_models_available():
    """Check if model files exist on backend"""
    print("\n" + "="*60)
    print("3. CHECKING MODEL AVAILABILITY")
    print("="*60)
    
    # This would need a dedicated endpoint on your backend
    # For now, we'll just document what to check
    print("""
    To verify models are loaded on PythonAnywhere:
    
    1. Open PythonAnywhere Files
    2. Check: /home/linahuo189/photo2monet/checkpoints/
    3. Verify these exist:
       ✓ style_monet_pretrained/latest_net_G.pth
       ✓ style_cezanne_pretrained/latest_net_G.pth
       ✓ style_ukiyoe_pretrained/latest_net_G.pth
       ✓ style_vangogh_pretrained/latest_net_G.pth
    
    If missing, download from: https://github.com/junyanz/CycleGAN/tree/master/checkpoints
    """)
    return True

def check_pythonanywhere_settings():
    """Document what to check in PythonAnywhere"""
    print("\n" + "="*60)
    print("4. PYTHONANYWHERE CONFIGURATION ISSUES")
    print("="*60)
    
    issues = """
    ⚠ CRITICAL SETTINGS TO CHECK:
    
    A. WEB APP TIMEOUT (Main Issue!)
    ───────────────────────────────
    Problem: Your 300s model inference exceeds PythonAnywhere limits
    
    Action:
    1. Go to: PythonAnywhere → Web Tab
    2. Scroll to "Web app reload settings"
    3. Set timeout to: 600+ seconds (for CycleGAN inference)
    4. Check "Force HTTPS" is OFF for health checks
    
    B. UWSGI WORKER SETTINGS
    ──────────────────────
    Problem: uWSGI workers are dying (HARAKIRI signal 9)
    
    Action:
    1. Edit WSGI file
    2. Add these settings at the top:
    
    import uwsgi
    import signal
    
    def timeout_handler(signum, frame):
        raise uwsgi.TimeoutError('Request exceeded timeout')
    
    signal.signal(signal.SIGALRM, timeout_handler)
    
    3. Increase worker timeout in PythonAnywhere:
       → Add to your WSGI file or PythonAnywhere settings
    
    C. MEMORY ISSUES
    ────────────────
    Problem: CycleGAN models consume significant memory
    
    Action:
    1. Monitor memory usage: PythonAnywhere → CPU/Memory tab
    2. If running out of memory:
       - Use beta Python Account with more RAM
       - Or implement lazy loading of models
       - Or use a lighter model checkpoint
    
    D. CORS CONFIGURATION
    ──────────────────────
    Check your fastapi CORS is allowing requests from:
    ✓ http://localhost:3000
    ✓ Your actual frontend domain
    """
    
    print(issues)
    return True

def check_local_backend_test():
    """Guide for testing on local machine"""
    print("\n" + "="*60)
    print("5. TESTING APPROACH")
    print("="*60)
    
    test_guide = """
    STEP 1: Test Health Endpoint
    ──────────────────────────
    $ curl -i https://linahuo189.pythonanywhere.com/health
    
    Expected: 200 OK with {"ok": true}
    Actual: 499 (Client Closed Request)
    
    ⚠ This means the client times out before server responds
    
    STEP 2: Test Styles Endpoint
    ──────────────────────────
    $ curl -i https://linahuo189.pythonanywhere.com/styles
    
    Expected: 200 OK with available styles
    
    STEP 3: Check Backend Logs
    ─────────────────────────
    1. SSH into PythonAnywhere: ssh <username>@ssh.pythonanywhere.com
    2. Run: tail -f ~/log/<username>_<domain>.log
    3. Watch for errors while making requests
    
    STEP 4: Increase Timeout Gradually
    ──────────────────────────────────
    1. Start with 30s timeout
    2. Increase to 120s, 300s, 600s
    3. Monitor which timeout causes the issue
    """
    
    print(test_guide)
    return True

def main():
    """Run all diagnostics"""
    print("\n" + "#"*60)
    print("# PYTHONANYWHERE BACKEND DIAGNOSTICS")
    print("# Backend URL: " + BACKEND_URL)
    print("# Time: " + datetime.now().isoformat())
    print("#"*60)
    
    results = {
        "health": check_health_endpoint(),
        "styles": check_styles_endpoint(),
        "models": check_models_available(),
        "settings": check_pythonanywhere_settings(),
        "testing": check_local_backend_test(),
    }
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Health: {'✓' if results['health'] else '✗'}")
    print(f"Styles: {'✓' if results['styles'] else '✗'}")
    
    print("\n" + "="*60)
    print("NEXT STEPS (Priority Order)")
    print("="*60)
    print("""
    1. ⚠ URGENT: Increase PythonAnywhere web app timeout to 600+ seconds
    2. Check model checkpoint files exist in /checkpoints/
    3. Monitor memory usage during /stylize requests
    4. Add detailed logging to app.py
    5. Test with shorter timeout first (30s) to isolate issue
    6. Consider using asyncio task timeout instead of subprocess timeout
    """)

if __name__ == "__main__":
    main()
