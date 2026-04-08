// Stub endpoint for OTLP traces - accept and discard
// Claude Code sends traces but we only need logs for analytics
export async function POST() {
  return new Response(null, { status: 200 })
}
