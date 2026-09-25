import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { randomBytes } from 'crypto';
import path from 'path';
import { requireAdmin } from '@/lib/adminAuth';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// The file's real type is decided from its magic bytes, never from the
// client-supplied name or MIME type. SVG/HTML are deliberately not allowed:
// they can carry scripts and would be served from our own origin.
function detectImageExtension(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return '.jpg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return '.png';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return '.gif';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp';
  return null;
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    // Reject oversized bodies before buffering them.
    const declaredLength = Number(request.headers.get('content-length'));
    if (declaredLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File is too large (max 5 MB)' }, { status: 413 });
    }

    const data = await request.formData();
    const file = data.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ success: false, error: 'File is too large (max 5 MB)' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExtension(buffer);
    if (!ext) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Upload a JPG, PNG, WEBP or GIF image.' },
        { status: 415 },
      );
    }

    const filename = randomBytes(5).toString('hex') + ext;
    const dirPath = path.join(process.cwd(), 'public/images');
    await mkdir(dirPath, { recursive: true });
    await writeFile(path.join(dirPath, filename), buffer);

    return NextResponse.json({ success: true, url: `/images/${filename}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: 'File upload failed' }, { status: 500 });
  }
}
