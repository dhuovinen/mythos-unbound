#!/usr/bin/env python3
import os
import zlib
import struct
from rasterizer import create_png_rgba

BRAIN_DIR = "/Users/dhuovinen/.gemini/antigravity/brain/f7ef4135-5c24-42fe-8296-fdb2f9d13691"
ROSTER_DIR = os.path.dirname(os.path.abspath(__file__))

# Map generated artifact filenames to deity IDs
ART_MAPPINGS = {
    "hoplite": "hoplite_1785566582661.jpg",
    "satyr": "satyr_1785566592397.jpg",
    "harpy": "harpy_1785566605905.jpg",
    "heracles": "heracles_1785566617161.jpg",
    "perseus": "perseus_1785566628233.jpg",
    "achilles": "achilles_1785566641713.jpg",
    "asclepius": "asclepius_1785566657127.jpg",
    "orpheus": "orpheus_1785566671496.jpg",
    "dionysus": "dionysus_1785566686031.jpg",
    "aeneas": "aeneas_1785566701603.jpg",
    "zeus": "zeus_1785566715466.jpg",
    "hera": "hera_1785566730687.jpg",
    "poseidon": "poseidon_1785566748122.jpg",
}

print("Processing AI diffusion assets into transparent 1024x1024 PNGs...")

# Simple pure Python JPEG decoder / background thresholding if needed, or ffmpeg conversion
import subprocess

for deity_id, filename in ART_MAPPINGS.items():
    src_path = os.path.join(BRAIN_DIR, filename)
    dst_path = os.path.join(ROSTER_DIR, f"{deity_id}.png")
    if os.path.exists(src_path):
        # Convert JPEG to transparent 1024x1024 PNG using ffmpeg colorkey filter for pure white background
        cmd = [
            'ffmpeg', '-y', '-i', src_path,
            '-vf', 'colorkey=0xFFFFFF:0.12:0.05,scale=1024:1024',
            dst_path
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"✓ Converted AI asset for {deity_id} -> {deity_id}.png")
        else:
            print(f"⚠ FFmpeg error for {deity_id}: {res.stderr}")

print("Processing complete.")
