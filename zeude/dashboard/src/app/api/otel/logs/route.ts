import { getClickHouseClient } from '@/lib/clickhouse'
import * as protobuf from 'protobufjs'
import path from 'path'

// Cache the protobuf root to avoid re-parsing on every request
let protoRoot: protobuf.Root | null = null

async function getProtoRoot(): Promise<protobuf.Root> {
  if (protoRoot) return protoRoot

  // Define the OTLP LogsService schema inline (subset needed for parsing)
  const root = new protobuf.Root()

  // Common types
  const KeyValue = new protobuf.Type('KeyValue')
    .add(new protobuf.Field('key', 1, 'string'))
    .add(new protobuf.Field('value', 2, 'AnyValue'))

  const AnyValue = new protobuf.Type('AnyValue')
    .add(new protobuf.Field('stringValue', 1, 'string'))
    .add(new protobuf.Field('boolValue', 2, 'bool'))
    .add(new protobuf.Field('intValue', 3, 'int64'))
    .add(new protobuf.Field('doubleValue', 4, 'double'))
    .add(new protobuf.Field('bytesValue', 7, 'bytes'))

  const Resource = new protobuf.Type('Resource')
    .add(new protobuf.Field('attributes', 1, 'KeyValue', 'repeated'))

  const InstrumentationScope = new protobuf.Type('InstrumentationScope')
    .add(new protobuf.Field('name', 1, 'string'))
    .add(new protobuf.Field('version', 2, 'string'))

  const LogRecord = new protobuf.Type('LogRecord')
    .add(new protobuf.Field('timeUnixNano', 1, 'fixed64'))
    .add(new protobuf.Field('observedTimeUnixNano', 11, 'fixed64'))
    .add(new protobuf.Field('severityNumber', 2, 'int32'))
    .add(new protobuf.Field('severityText', 3, 'string'))
    .add(new protobuf.Field('body', 5, 'AnyValue'))
    .add(new protobuf.Field('attributes', 6, 'KeyValue', 'repeated'))
    .add(new protobuf.Field('traceId', 9, 'bytes'))
    .add(new protobuf.Field('spanId', 10, 'bytes'))

  const ScopeLogs = new protobuf.Type('ScopeLogs')
    .add(new protobuf.Field('scope', 1, 'InstrumentationScope'))
    .add(new protobuf.Field('logRecords', 2, 'LogRecord', 'repeated'))
    .add(new protobuf.Field('schemaUrl', 3, 'string'))

  const ResourceLogs = new protobuf.Type('ResourceLogs')
    .add(new protobuf.Field('resource', 1, 'Resource'))
    .add(new protobuf.Field('scopeLogs', 2, 'ScopeLogs', 'repeated'))
    .add(new protobuf.Field('schemaUrl', 3, 'string'))

  const ExportLogsServiceRequest = new protobuf.Type('ExportLogsServiceRequest')
    .add(new protobuf.Field('resourceLogs', 1, 'ResourceLogs', 'repeated'))

  root.add(AnyValue)
  root.add(KeyValue)
  root.add(Resource)
  root.add(InstrumentationScope)
  root.add(LogRecord)
  root.add(ScopeLogs)
  root.add(ResourceLogs)
  root.add(ExportLogsServiceRequest)

  protoRoot = root
  return root
}

function kvToMap(attrs: Array<{ key: string; value?: { stringValue?: string; intValue?: string | number; doubleValue?: number; boolValue?: boolean } }>): Record<string, string> {
  const map: Record<string, string> = {}
  if (!attrs) return map
  for (const kv of attrs) {
    if (kv.value?.stringValue !== undefined) {
      map[kv.key] = kv.value.stringValue
    } else if (kv.value?.intValue !== undefined) {
      map[kv.key] = String(kv.value.intValue)
    } else if (kv.value?.doubleValue !== undefined) {
      map[kv.key] = String(kv.value.doubleValue)
    } else if (kv.value?.boolValue !== undefined) {
      map[kv.key] = String(kv.value.boolValue)
    }
  }
  return map
}

function bytesToHex(bytes: Uint8Array | Buffer | null | undefined): string {
  if (!bytes || bytes.length === 0) return ''
  return Buffer.from(bytes).toString('hex')
}

function nanoToISO(nanos: string | number | Long | null | undefined): string {
  if (!nanos) return new Date().toISOString()
  const n = typeof nanos === 'string' ? BigInt(nanos) : typeof nanos === 'number' ? BigInt(nanos) : BigInt(nanos.toString())
  const ms = Number(n / BigInt(1_000_000))
  return new Date(ms).toISOString()
}

// Apply Codex normalization (same as OTel Collector transform/codex processor)
function applyCodexTransform(serviceName: string, logAttrs: Record<string, string>, resAttrs: Record<string, string>): void {
  const isCodex = serviceName === 'codex' || serviceName === 'codex_cli_rs' || serviceName === 'codex_exec'
  if (!isCodex) return

  // Token count normalization
  if (logAttrs['input_token_count']) logAttrs['input_tokens'] = logAttrs['input_token_count']
  if (logAttrs['output_token_count']) logAttrs['output_tokens'] = logAttrs['output_token_count']
  if (logAttrs['cached_token_count']) logAttrs['cache_read_tokens'] = logAttrs['cached_token_count']
  if (!logAttrs['cache_creation_tokens']) logAttrs['cache_creation_tokens'] = '0'
  if (!logAttrs['cost_usd']) logAttrs['cost_usd'] = '0'

  // Session identity
  if (logAttrs['conversation.id'] && !logAttrs['session.id']) {
    logAttrs['session.id'] = logAttrs['conversation.id']
  }

  // User identity
  if (logAttrs['user.account_id'] && !logAttrs['user.id']) {
    logAttrs['user.id'] = logAttrs['user.account_id']
  }
  if (resAttrs['zeude.user.id']) {
    logAttrs['user.id'] = resAttrs['zeude.user.id']
  }
  if (resAttrs['zeude.user.email']) {
    logAttrs['user.email'] = resAttrs['zeude.user.email']
  }

  // Team
  if (resAttrs['zeude.team']) {
    logAttrs['team'] = resAttrs['zeude.team']
  }

  // Working directory / project path
  if (resAttrs['zeude.working_directory']) {
    logAttrs['working_directory'] = resAttrs['zeude.working_directory']
  }
  if (resAttrs['zeude.project_path']) {
    logAttrs['project_path'] = resAttrs['zeude.project_path']
  }

  // Organization ID default
  if (!logAttrs['organization.id']) logAttrs['organization.id'] = ''
}

interface Long {
  toString(): string
}

export async function POST(req: Request) {
  try {
    const clickhouse = getClickHouseClient()
    if (!clickhouse) {
      return new Response('ClickHouse not configured', { status: 503 })
    }

    const body = await req.arrayBuffer()
    const root = await getProtoRoot()
    const ExportLogsServiceRequest = root.lookupType('ExportLogsServiceRequest')

    const decoded = ExportLogsServiceRequest.decode(new Uint8Array(body)) as any

    const rows: any[] = []

    for (const resourceLog of decoded.resourceLogs || []) {
      const resAttrs = kvToMap(resourceLog.resource?.attributes || [])
      const resourceSchemaUrl = resourceLog.schemaUrl || ''

      for (const scopeLog of resourceLog.scopeLogs || []) {
        const scopeName = scopeLog.scope?.name || ''
        const scopeVersion = scopeLog.scope?.version || ''
        const scopeSchemaUrl = scopeLog.schemaUrl || ''

        for (const logRecord of scopeLog.logRecords || []) {
          const logAttrs = kvToMap(logRecord.attributes || [])
          const serviceName = resAttrs['service.name'] || ''

          // Apply Codex transforms
          applyCodexTransform(serviceName, logAttrs, resAttrs)

          const timestamp = nanoToISO(logRecord.timeUnixNano)

          rows.push({
            Timestamp: timestamp,
            TraceId: bytesToHex(logRecord.traceId),
            SpanId: bytesToHex(logRecord.spanId),
            TraceFlags: 0,
            SeverityText: logRecord.severityText || '',
            SeverityNumber: logRecord.severityNumber || 0,
            ServiceName: serviceName,
            Body: logRecord.body?.stringValue || '',
            ResourceSchemaUrl: resourceSchemaUrl,
            ResourceAttributes: resAttrs,
            ScopeSchemaUrl: scopeSchemaUrl,
            ScopeName: scopeName,
            ScopeVersion: scopeVersion,
            ScopeAttributes: {},
            LogAttributes: logAttrs,
          })
        }
      }
    }

    if (rows.length > 0) {
      await clickhouse.insert({
        table: 'claude_code_logs',
        values: rows,
        format: 'JSONEachRow',
      })
    }

    // Return OTLP ExportLogsServiceResponse (empty = success)
    return new Response(null, { status: 200 })
  } catch (err) {
    console.error('OTel logs ingestion error:', err)
    return new Response('Internal error', { status: 500 })
  }
}
