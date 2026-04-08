// Stub endpoint for OTLP metrics - accept and discard
// Claude Code sends metrics but we only need logs for analytics
export async function POST() {
  return new Response(null, { status: 200 })
}
