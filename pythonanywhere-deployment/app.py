"""Flask WSGI app for CycleGAN style transfer — PythonAnywhere compatible."""

import io
import shutil
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent

# ---------------------------------------------------------------------------
# Style registry
# ---------------------------------------------------------------------------

DEFAULT_STYLE_CONFIG = {
    "netG": "resnet_9blocks",
    "norm": "instance",
    "preprocess": "scale_width",
    "load_size": 1024,
    "no_dropout": True,
}

STYLE_TO_MODEL = {
    "monet": {**DEFAULT_STYLE_CONFIG, "checkpoint": "style_monet_pretrained", "label": "Monet Glow"},
    "cezanne": {**DEFAULT_STYLE_CONFIG, "checkpoint": "style_cezanne_pretrained", "label": "Cezanne Structure"},
    "ukiyoe": {**DEFAULT_STYLE_CONFIG, "checkpoint": "style_ukiyoe_pretrained", "label": "Ukiyo-e Detail"},
    "vangogh": {**DEFAULT_STYLE_CONFIG, "checkpoint": "style_vangogh_pretrained", "label": "Van Gogh Motion"},
}

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)


@app.route("/health")
def health():
    return jsonify({"ok": True})


@app.route("/styles")
def styles():
    return jsonify({
        "styles": [
            {
                "value": key,
                "label": cfg["label"],
                "checkpoint": cfg["checkpoint"],
                "netG": cfg["netG"],
                "norm": cfg["norm"],
                "preprocess": cfg["preprocess"],
                "load_size": cfg["load_size"],
                "no_dropout": cfg.get("no_dropout", False),
            }
            for key, cfg in STYLE_TO_MODEL.items()
        ]
    })


@app.route("/stylize", methods=["POST"])
def stylize():
    style = request.form.get("style", "").strip()
    if style not in STYLE_TO_MODEL:
        return jsonify({"error": "Invalid style. Choose from: " + ", ".join(STYLE_TO_MODEL)}), 400

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    upload = request.files["file"]
    if not upload.content_type or not upload.content_type.startswith("image/"):
        return jsonify({"error": "Upload an image file"}), 400

    cfg = STYLE_TO_MODEL[style]
    model_name = cfg["checkpoint"]
    checkpoint_file = BASE_DIR / "checkpoints" / model_name / "latest_net_G.pth"
    if not checkpoint_file.exists():
        return jsonify({"error": f"Checkpoint missing for style '{style}'"}), 500

    # Determine file extension
    original_filename = upload.filename or "upload.jpg"
    suffix = Path(original_filename).suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}:
        suffix = ".jpg"

    job_id = str(uuid.uuid4())
    work_dir = Path(tempfile.gettempdir()) / f"cyclegan_{job_id}"
    input_dir = work_dir / "input"
    results_dir = work_dir / "results"

    input_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)

    input_path = input_dir / f"upload{suffix}"
    upload.save(str(input_path))

    with Image.open(input_path) as img:
        original_width, original_height = img.size

    # Build test.py command — use sys.executable so the same Python/venv is used
    cmd = [
        sys.executable,
        str(BASE_DIR / "test.py"),
        "--dataroot", str(input_dir),
        "--name", model_name,
        "--model", "test",
        "--netG", cfg["netG"],
        "--norm", cfg["norm"],
        "--num_test", "1",
        "--results_dir", str(results_dir),
        "--preprocess", cfg["preprocess"],
        "--load_size", str(cfg["load_size"]),
    ]

    if cfg.get("no_dropout"):
        cmd.append("--no_dropout")

    try:
        completed = subprocess.run(
            cmd,
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True,
            check=True,
            timeout=600,  # 10-minute hard limit
        )
        app.logger.info(completed.stdout[-2000:])
    except subprocess.TimeoutExpired:
        shutil.rmtree(work_dir, ignore_errors=True)
        return jsonify({"error": "Inference timed out (10 min limit)"}), 504
    except subprocess.CalledProcessError as exc:
        shutil.rmtree(work_dir, ignore_errors=True)
        return jsonify({
            "error": "Model inference failed",
            "stdout": exc.stdout[-2000:],
            "stderr": exc.stderr[-2000:],
        }), 500

    # Locate generated image
    output_candidates = (
        list(results_dir.rglob("*fake.png"))
        + list(results_dir.rglob("*fake.jpg"))
        + list(results_dir.rglob("*fake.jpeg"))
    )
    if not output_candidates:
        shutil.rmtree(work_dir, ignore_errors=True)
        return jsonify({"error": "No output image was generated"}), 500

    output_path = output_candidates[0]

    # Resize back to original dimensions and stream response
    with Image.open(output_path) as styled:
        resized = styled.convert("RGB").resize((original_width, original_height), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, format="PNG")
        buf.seek(0)

    shutil.rmtree(work_dir, ignore_errors=True)

    return send_file(
        buf,
        mimetype="image/png",
        as_attachment=True,
        download_name=f"{style}.png",
    )


if __name__ == "__main__":
    # Local dev only — PythonAnywhere uses wsgi.py
    app.run(host="0.0.0.0", port=5000, debug=True)
