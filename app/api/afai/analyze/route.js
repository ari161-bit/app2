/**
 * app/api/afai/analyze/route.js
 * Next.js App Router API — proxies multipart uploads to the axon backend.
 */

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const axonUrl = process.env.NEXT_PUBLIC_AXON_API_URL;
    if (!axonUrl) {
      return Response.json(
        { error: "AFAI backend URL not configured." },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${axonUrl}/api/afai/analyze`, {
      method: "POST",
      body: formData,
    });

    const data = await upstream.json();

    return Response.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[API /afai/analyze]", err);
    return Response.json(
      { error: "AFAI proxy error — upstream unreachable." },
      { status: 502 }
    );
  }
}
