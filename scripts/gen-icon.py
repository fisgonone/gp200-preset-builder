import struct, os

def make_image(w, h):
    """Generate BGRA pixel data for a w x h icon (bottom-up BMP order)."""
    cx, cy, r = w // 2, h // 2, int(w * 0.42)
    inner_r = int(w * 0.22)
    data = bytearray()
    for y in range(h - 1, -1, -1):
        for x in range(w):
            dx, dy = x - cx, y - cy
            dist2 = dx*dx + dy*dy
            if dist2 < inner_r * inner_r:
                data += bytes([0xFF, 0xFF, 0xFF, 0xFF])   # white center
            elif dist2 < r * r:
                data += bytes([0xF6, 0x82, 0x3B, 0xFF])   # blue BGRA (#3B82F6)
            else:
                data += bytes([0x30, 0x25, 0x1E, 0xFF])   # dark bg
    return bytes(data)

def make_ico(path):
    sizes = [256, 64, 32, 16]
    images = []
    for s in sizes:
        bpp = 32
        px = make_image(s, s)
        and_mask = bytes(((s + 31) // 32) * 4 * s)
        # For 256x256, use 0 in the directory entry (ICO spec)
        dir_w = 0 if s == 256 else s
        dir_h = 0 if s == 256 else s
        dib = struct.pack('<IIIHHIIIIII', 40, s, s*2, 1, bpp, 0,
                         len(px), 0, 0, 0, 0)
        image_data = dib + px + and_mask
        images.append((dir_w, dir_h, bpp, image_data))

    count = len(images)
    header = struct.pack('<HHH', 0, 1, count)
    # Directory entries come right after the 6-byte header
    dir_offset = 6 + count * 16
    entries = b''
    offset = dir_offset
    for (dw, dh, bpp, img) in images:
        entries += struct.pack('<BBBBHHII', dw, dh, 0, 0, 1, bpp, len(img), offset)
        offset += len(img)

    with open(path, 'wb') as f:
        f.write(header + entries)
        for (_, _, _, img) in images:
            f.write(img)

    size = os.path.getsize(path)
    print("icon.ico creado (" + str(size) + " bytes, tamaños: " + str([s for s in sizes]) + ")")

make_ico(r"C:\Users\jahca\OneDrive\Documentos\gp200-preset-builder\resources\icon.ico")
