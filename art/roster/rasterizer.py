#!/usr/bin/env python3
import os
import zlib
import struct
import math

def create_png_rgba(width, height, rgba_data):
    """Encodes raw RGBA byte buffer into a 32-bit transparent PNG file."""
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(struct.pack('>I', ihdr_crc & 0xffffffff))

    raw_bytes = bytearray()
    for y in range(height):
        raw_bytes.append(0)
        raw_bytes.extend(rgba_data[y * width * 4 : (y + 1) * width * 4])

    compressed = zlib.compress(raw_bytes, level=6)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(struct.pack('>I', idat_crc & 0xffffffff))

    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', iend_crc & 0xffffffff))

    return bytes(png)

class Canvas2D:
    """2D software rasterizer supporting high-contrast Woodcut Style C-B shapes."""
    def __init__(self, width, height):
        self.w = width
        self.h = height
        self.pixels = bytearray(width * height * 4) # transparent background

    def set_pixel(self, x, y, color):
        if 0 <= x < self.w and 0 <= y < self.h:
            idx = (y * self.w + x) * 4
            r, g, b, a = color
            self.pixels[idx] = r
            self.pixels[idx+1] = g
            self.pixels[idx+2] = b
            self.pixels[idx+3] = a

    def fill_rect(self, x0, y0, x1, y1, color):
        x0, x1 = max(0, int(x0)), min(self.w, int(x1))
        y0, y1 = max(0, int(y0)), min(self.h, int(y1))
        for y in range(y0, y1):
            for x in range(x0, x1):
                self.set_pixel(x, y, color)

    def fill_circle(self, cx, cy, r, color):
        cx, cy, r = int(cx), int(cy), int(r)
        r2 = r * r
        for y in range(max(0, cy - r), min(self.h, cy + r + 1)):
            dy2 = (y - cy) ** 2
            for x in range(max(0, cx - r), min(self.w, cx + r + 1)):
                if (x - cx) ** 2 + dy2 <= r2:
                    self.set_pixel(x, y, color)

    def fill_polygon(self, points, color):
        if not points:
            return
        min_y = max(0, int(min(p[1] for p in points)))
        max_y = min(self.h - 1, int(max(p[1] for p in points)))
        
        n = len(points)
        for y in range(min_y, max_y + 1):
            nodes = []
            j = n - 1
            for i in range(n):
                pi = points[i]
                pj = points[j]
                if (pi[1] < y <= pj[1]) or (pj[1] < y <= pi[1]):
                    x = pi[0] + (y - pi[1]) / (pj[1] - pi[1]) * (pj[0] - pi[0])
                    nodes.append(x)
                j = i
            nodes.sort()
            for i in range(0, len(nodes), 2):
                if i + 1 < len(nodes):
                    x_start = max(0, int(nodes[i]))
                    x_end = min(self.w - 1, int(nodes[i+1]))
                    for x in range(x_start, x_end + 1):
                        self.set_pixel(x, y, color)

    def draw_chisel_line(self, x0, y0, x1, y1, thickness, color):
        """Draws a bold chisel stroke polygon for woodcut style lines."""
        dx = x1 - x0
        dy = y1 - y0
        dist = math.hypot(dx, dy)
        if dist == 0:
            return
        nx = -dy / dist * (thickness / 2)
        ny = dx / dist * (thickness / 2)
        pts = [
            (x0 + nx, y0 + ny),
            (x1 + nx, y1 + ny),
            (x1 - nx, y1 - ny),
            (x0 - nx, y0 - ny)
        ]
        self.fill_polygon(pts, color)

    def export_png(self, filepath):
        data = create_png_rgba(self.w, self.h, self.pixels)
        with open(filepath, 'wb') as f:
            f.write(data)

# Palette definitions (Style C-B STRICT)
INK = (26, 26, 30, 255)       # #1A1A1E Heavy ink mass
BONE = (237, 230, 214, 255)   # #EDE6D6 Bone white skin/highlights
BLOOD = (140, 47, 32, 255)    # #8C2F20 Blood red accents

# NO GOLD ON CHARACTERS PER BRIEF CONSTRAINT

print("Canvas 2D rasterizer ready.")
