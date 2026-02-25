import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "books.google.com",
  "books.googleusercontent.com",
  "lh3.googleusercontent.com",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Parâmetro 'url' é obrigatório." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Host não permitido." }, { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(parsedUrl.toString(), {
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: "Falha ao baixar a thumbnail." },
        { status: upstreamResponse.status },
      );
    }

    const contentType = upstreamResponse.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await upstreamResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao processar thumbnail." }, { status: 502 });
  }
}
