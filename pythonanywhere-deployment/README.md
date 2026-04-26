# CycleGAN Style API — PythonAnywhere Deployment Guide

This folder is a self-contained deployment package for the CycleGAN style-transfer server.
It runs as a standard Flask WSGI app, which is fully compatible with PythonAnywhere's free and paid tiers.

---

## Folder structure

```
pythonanywhere-deployment/
├── app.py                  ← Flask application (main entry point)
├── wsgi.py                 ← WSGI entry point (used by PythonAnywhere)
├── test.py                 ← CycleGAN inference script (called as subprocess)
├── requirements.txt        ← Python dependencies
├── data/                   ← Dataset loader modules
│   ├── __init__.py
│   ├── base_dataset.py
│   ├── image_folder.py
│   └── single_dataset.py
├── models/                 ← CycleGAN model modules (already present)
├── options/                ← CLI argument modules (already present)
├── util/                   ← Utility modules (already present)
└── checkpoints/            ← Pre-trained .pth weights (already present)
    ├── style_monet_pretrained/latest_net_G.pth
    ├── style_cezanne_pretrained/latest_net_G.pth
    ├── style_ukiyoe_pretrained/latest_net_G.pth
    └── style_vangogh_pretrained/latest_net_G.pth
```

---

## Step-by-step deployment

### 1. Upload the folder

Upload the entire `pythonanywhere-deployment/` directory to your PythonAnywhere home directory.
Rename it to something short, e.g. `cyclegan`:

```
/home/<your-username>/cyclegan/
```

You can use the PythonAnywhere **Files** tab to upload a zip, or use `git clone` / `scp` from a Bash console.

### 2. Open a Bash console and install dependencies

```bash
cd ~/cyclegan
pip install --user -r requirements.txt
```

> **Note:** PythonAnywhere's free tier does not have GPU access. PyTorch will run on CPU, which is
> slower but fully functional. Expect ~30–120 seconds per image depending on size.

### 3. Create a new Web App

1. Go to the **Web** tab → **Add a new web app**.
2. Choose **Manual configuration** (not the framework quick-start options).
3. Select the Python version that matches your installed packages (e.g. **Python 3.10**).

### 4. Configure the WSGI file

PythonAnywhere generates a WSGI config file at a path like:

```
/var/www/<your-username>_pythonanywhere_com_wsgi.py
```

Replace its entire content with:

```python
import sys
import os

project_home = '/home/<your-username>/cyclegan'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

from app import app as application
```

Or simply point the WSGI file at `wsgi.py` inside your project:

```python
import sys
sys.path.insert(0, '/home/<your-username>/cyclegan')
exec(open('/home/<your-username>/cyclegan/wsgi.py').read())
```

### 5. Set the working directory

In the **Web** tab, under **Code**, set:

| Field | Value |
|---|---|
| Source code | `/home/<your-username>/cyclegan` |
| Working directory | `/home/<your-username>/cyclegan` |

### 6. Reload the web app

Click **Reload** in the Web tab. Your API is now live at:

```
https://<your-username>.pythonanywhere.com/
```

---

## API endpoints

### `GET /health`
Returns `{"ok": true}` — use to verify the server is running.

### `GET /styles`
Returns the list of available styles with metadata.

### `POST /stylize`
Run style transfer on an uploaded image.

**Form fields:**
- `file` — the image file (JPEG, PNG, WebP, BMP)
- `style` — one of: `monet`, `cezanne`, `ukiyoe`, `vangogh`

**Response:** PNG image file (same dimensions as input).

**Example with curl:**
```bash
curl -X POST https://<your-username>.pythonanywhere.com/stylize \
  -F "file=@photo.jpg" \
  -F "style=monet" \
  --output result.png
```

---

## Updating the Next.js app

In your Next.js `.env.local` (or Vercel environment variables), update the server URL:

```
NEXT_PUBLIC_STYLE_API_URL=https://<your-username>.pythonanywhere.com
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: flask` | Run `pip install --user flask flask-cors` in a Bash console |
| `ModuleNotFoundError: data` | Make sure the working directory is set to `/home/<username>/cyclegan` |
| 504 Gateway Timeout | PythonAnywhere has a 5-minute request timeout on the free tier; reduce `--load_size` in `app.py` |
| Missing checkpoint error | Ensure all four `.pth` files exist under `checkpoints/` |
| Very slow inference | Expected on CPU — free tier has no GPU. Paid tiers can use more RAM/CPU |

---

## Local testing (before upload)

```bash
cd pythonanywhere-deployment
pip install -r requirements.txt
python app.py           # starts Flask dev server on http://localhost:5000
```
