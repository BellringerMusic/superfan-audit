import { NextRequest, NextResponse } from 'next/server';
import { getJob, getPdf } from '@/lib/storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job || job.status !== 'complete') {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // If PDF URL is an external URL (Vercel Blob), redirect
  if (job.pdfUrl && job.pdfUrl.startsWith('http')) {
    return NextResponse.redirect(job.pdfUrl);
  }

  // Otherwise serve from local storage
  const pdfBuffer = await getPdf(id);
  if (!pdfBuffer) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }

  const filename = `Superfan-Audit-${job.formData.artistName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
