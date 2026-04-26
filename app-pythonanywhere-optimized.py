"""
Optimized FastAPI CycleGAN Style Transfer App for PythonAnywhere
Includes: Better error handling, logging, and timeout management
"""
import asyncio
import logging
import shutil
import subprocess
import tempfile
import uuid
import time
from pathlib import Path
from typing import Dict, TypedDict

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from PIL import Image

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================
PROJECT_DIR = Path(__file__).resolve().parent
BASE_DIR = PROJECT_DIR / "photo2monet"
if not BASE_DIR.exists():
    BASE_DIR = PROJECT_DIR
PYTHONANYWHERE = True  # Set to True when deployed

class StyleConfig(TypedDict, total=False):
    checkpoint: str
    label: str
    netG: str
    norm: str
    preprocess: str
    load_size: int
    no_dropout: bool
    crop_size: int
    model_suffix: str


DEFAULT_STYLE_CONFIG: StyleConfig = {
    "netG": "resnet_9blocks",
    "norm": "instance",
    "preprocess": "scale_width",
    "load_size": 1024,
    "no_dropout": True,
}


STYLE_TO_MODEL: dict[str, StyleConfig] = {
    "monet": {
        "checkpoint": "style_monet_pretrained",
        "label": "Monet Glow",
        **DEFAULT_STYLE_CONFIG,
    },
    "cezanne": {
        "checkpoint": "style_cezanne_pretrained",
        "label": "Cezanne Structure",
        **DEFAULT_STYLE_CONFIG,
    },
    "ukiyoe": {
        "checkpoint": "style_ukiyoe_pretrained",
        "label": "Ukiyo-e Detail",
        **DEFAULT_STYLE_CONFIG,
    },
    "vangogh": {
        "checkpoint": "style_vangogh_pretrained",
        "label": "Van Gogh Motion",
        **DEFAULT_STYLE_CONFIG,
    },
    # Add your own commercial model here with the exact training flags.
    # Example:
    # "premium_oil": {
    #     "checkpoint": "premium_oil_v1",
    #     "label": "Premium Oil Master",
    #     "netG": "resnet_9blocks",
    #     "norm": "instance",
    #     "preprocess": "none",
    #     "load_size": 1536,
    #     "no_dropout": True,
    # },
}

# Timeout configuration (adjust based on PythonAnywhere limits)
HEALTH_CHECK_TIMEOUT = 10
STYLES_TIMEOUT = 10
STYLIZE_TIMEOUT = 250 if PYTHONANYWHERE else 300  # Leave headroom for PythonAnywhere

# ============================================================================
# APP SETUP
# ============================================================================
app = FastAPI(
    title="CycleGAN Style API",
    description="Style transfer API powered by CycleGAN"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ============================================================================
# HEALTH CHECK & INFO ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    logger.info("GET / - Root endpoint called")
    return {
        "service": "CycleGAN Style API",
        "version": "1.0",
        "ok": True,
        "timestamp": time.time()
    }

@app.get("/health")
async def health():
    """Health check endpoint - should respond quickly"""
    logger.info("GET /health - Health check")
    try:
        # Quick sanity check
        checkpoint_dir = BASE_DIR / "checkpoints"
        has_models = checkpoint_dir.exists() and list(checkpoint_dir.glob("*/"))
        
        return {
            "ok": True,
            "has_models": bool(has_models),
            "timestamp": time.time(),
            "model_count": len(list(checkpoint_dir.glob("*/"))) if checkpoint_dir.exists() else 0
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"ok": False, "error": str(e)}
        )

@app.get("/styles")
async def styles():
    """Available styles endpoint"""
    logger.info("GET /styles - Listing available styles")
    try:
        return {
            "ok": True,
            "styles": [
                {
                    "value": key,
                    "label": config.get("label", key),
                    "checkpoint": config["checkpoint"],
                    "netG": config.get("netG"),
                    "norm": config.get("norm"),
                    "preprocess": config.get("preprocess"),
                    "load_size": config.get("load_size"),
                    "no_dropout": config.get("no_dropout", False),
                }
                for key, config in STYLE_TO_MODEL.items()
            ],
            "count": len(STYLE_TO_MODEL)
        }
    except Exception as e:
        logger.error(f"Styles endpoint failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": str(e)}
        )

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def cleanup_dir(path: Path):
    """Safely cleanup temporary directory"""
    try:
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
            logger.info(f"Cleaned up: {path}")
    except Exception as e:
        logger.error(f"Failed to cleanup {path}: {e}")


def get_style_config(style: str) -> StyleConfig:
    config = STYLE_TO_MODEL.get(style)
    if not config:
        raise KeyError(style)
    return {**DEFAULT_STYLE_CONFIG, **config}

def run_model(cmd, base_dir, timeout=STYLIZE_TIMEOUT) -> Dict:
    """
    Run CycleGAN model with timeout and error handling
    
    Returns dict with: success, stdout, stderr, error_message
    """
    logger.info(f"Starting model inference with timeout={timeout}s")
    
    try:
        start_time = time.time()
        
        process = subprocess.Popen(
            cmd,
            cwd=str(base_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        try:
            stdout, stderr = process.communicate(timeout=timeout)
            elapsed = time.time() - start_time
            
            logger.info(f"Model completed in {elapsed:.2f}s")
            logger.debug(f"Output: {stdout[-500:]}")
            
            return {
                "success": process.returncode == 0,
                "returncode": process.returncode,
                "stdout": stdout,
                "stderr": stderr,
                "elapsed": elapsed,
                "error_message": None
            }
        except subprocess.TimeoutExpired:
            process.kill()
            elapsed = time.time() - start_time
            
            logger.error(f"Model timeout after {elapsed:.2f}s (limit: {timeout}s)")
            
            return {
                "success": False,
                "returncode": None,
                "stdout": "",
                "stderr": "",
                "elapsed": elapsed,
                "error_message": f"Model inference timed out after {timeout} seconds"
            }
            
    except Exception as e:
        logger.error(f"Model execution error: {e}")
        return {
            "success": False,
            "returncode": None,
            "stdout": "",
            "stderr": str(e),
            "elapsed": 0,
            "error_message": f"Model execution failed: {str(e)}"
        }

async def verify_checkpoint(style: str) -> tuple[bool, str]:
    """Verify checkpoint file exists"""
    style_config = get_style_config(style)
    model_name = style_config["checkpoint"]
    checkpoint_file = BASE_DIR / "checkpoints" / model_name / "latest_net_G.pth"
    
    if not checkpoint_file.exists():
        error_msg = (
            f"Missing checkpoint for {style} at {checkpoint_file}\n"
            f"Expected location: {BASE_DIR}/checkpoints/{model_name}/"
        )
        logger.error(error_msg)
        return False, error_msg
    
    logger.info(f"Checkpoint verified: {checkpoint_file}")
    return True, ""

# ============================================================================
# MAIN STYLIZE ENDPOINT
# ============================================================================

@app.post("/stylize")
async def stylize(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    style: str = Form(...),
):
    """
    Apply style transfer to image
    
    Parameters:
    - file: Image file to process
    - style: Style to apply (monet, cezanne, ukiyoe, vangogh)
    
    Returns:
    - Styled image file
    """
    logger.info(f"POST /stylize - style={style}, file={file.filename}")
    
    # ========== VALIDATION ==========
    if style not in STYLE_TO_MODEL:
        logger.warning(f"Invalid style requested: {style}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid style. Available: {list(STYLE_TO_MODEL.keys())}"
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        logger.warning(f"Invalid file type: {file.content_type}")
        raise HTTPException(
            status_code=400,
            detail="Please upload an image file (JPG, PNG, WebP, BMP)"
        )

    # ========== CHECKPOINT VERIFICATION ==========
    try:
        checkpoint_ok, checkpoint_error = await verify_checkpoint(style)
        if not checkpoint_ok:
            raise HTTPException(status_code=500, detail=checkpoint_error)
    except Exception as e:
        logger.error(f"Checkpoint verification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Checkpoint error: {str(e)}")

    # ========== FILE SETUP ==========
    try:
        suffix = Path(file.filename or "upload.jpg").suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}:
            suffix = ".jpg"

        job_id = str(uuid.uuid4())
        work_dir = Path(tempfile.gettempdir()) / f"cyclegan_{job_id}"
        input_dir = work_dir / "input"
        results_dir = work_dir / "results"
        
        input_dir.mkdir(parents=True, exist_ok=True)
        results_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Created work directory: {work_dir}")

        input_path = input_dir / f"upload{suffix}"
        with input_path.open("wb") as f:
            shutil.copyfileobj(file.file, f)
        
        logger.info(f"Image saved to: {input_path}")

        # Get original dimensions
        with Image.open(input_path) as original_img:
            original_width, original_height = original_img.size
            logger.info(f"Original dimensions: {original_width}x{original_height}")

    except Exception as e:
        logger.error(f"File setup failed: {e}")
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

    # ========== MODEL INFERENCE ==========
    style_config = get_style_config(style)
    model_name = style_config["checkpoint"]
    cmd = [
        "python",
        "test.py",
        "--dataroot", str(input_dir),
        "--name", model_name,
        "--model", "test",
        "--netG", style_config["netG"],
        "--norm", style_config["norm"],
        "--num_test", "1",
        "--results_dir", str(results_dir),
        "--preprocess", style_config["preprocess"],
        "--load_size", str(style_config["load_size"]),
    ]

    if style_config.get("no_dropout"):
        cmd.append("--no_dropout")

    if style_config.get("crop_size"):
        cmd.extend(["--crop_size", str(style_config["crop_size"])])

    if style_config.get("model_suffix"):
        cmd.extend(["--model_suffix", style_config["model_suffix"]])

    logger.info(f"Running inference command: {' '.join(cmd)}")
    
    result = await asyncio.to_thread(run_model, cmd, BASE_DIR, STYLIZE_TIMEOUT)
    
    if not result["success"]:
        logger.error(f"Model failed: {result['error_message']}")
        background_tasks.add_task(cleanup_dir, work_dir)
        raise HTTPException(
            status_code=504 if result["error_message"] else 500,
            detail={
                "message": result["error_message"] or "Model inference failed",
                "elapsed": result["elapsed"],
                "stdout": result["stdout"][-1000:] if result["stdout"] else "",
                "stderr": result["stderr"][-1000:] if result["stderr"] else "",
            }
        )

    # ========== OUTPUT PROCESSING ==========
    try:
        output_candidates = (
            list(results_dir.rglob("*fake.png"))
            + list(results_dir.rglob("*fake.jpg"))
            + list(results_dir.rglob("*fake.jpeg"))
        )

        if not output_candidates:
            logger.error(f"No output found in {results_dir}")
            background_tasks.add_task(cleanup_dir, work_dir)
            raise HTTPException(status_code=500, detail="Model did not produce output")

        output_path = output_candidates[0]
        logger.info(f"Found output: {output_path}")

        final_output_path = work_dir / f"final_{style}.png"

        with Image.open(output_path) as styled_img:
            styled_rgb = styled_img.convert("RGB")
            resized = styled_rgb.resize(
                (original_width, original_height),
                Image.LANCZOS
            )
            resized.save(final_output_path, format="PNG")
        
        logger.info(f"Resized output saved: {final_output_path}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Output processing failed: {e}")
        background_tasks.add_task(cleanup_dir, work_dir)
        raise HTTPException(status_code=500, detail=f"Output processing error: {str(e)}")

    # ========== CLEANUP & RESPONSE ==========
    background_tasks.add_task(cleanup_dir, work_dir)

    logger.info(f"Stylization complete. Sending response.")
    
    return FileResponse(
        final_output_path,
        media_type="image/png",
        filename=f"styled_{style}.png",
    )

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Catch-all error handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "ok": False,
            "error": "Internal server error",
            "timestamp": time.time()
        }
    )

if __name__ == "__main__":
    logger.info("Starting CycleGAN Style API")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, workers=1)
