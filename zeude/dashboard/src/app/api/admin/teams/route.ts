import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/session'

// GET: List all teams
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createServerClient()

    const { data: teams, error } = await supabase
      .from('zeude_teams')
      .select('id, name, description, created_by, created_at, updated_at')
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch teams:', error)
      return Response.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    return Response.json({ teams: teams || [] })
  } catch (err) {
    console.error('Team list error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new team
export async function POST(req: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name, description } = await req.json()

    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Team name is required' }, { status: 400 })
    }

    if (!/^[A-Za-z0-9_-]+$/.test(name)) {
      return Response.json({ error: 'Team name must contain only letters, numbers, hyphens, and underscores' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Validate created_by exists in zeude_users (mock dev-user may not exist)
    const createdBy = session.user.id === 'dev-user' ? null : session.user.id

    const { data: team, error } = await supabase
      .from('zeude_teams')
      .insert({
        name,
        description: description || null,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: 'Team name already exists' }, { status: 409 })
      }
      console.error('Failed to create team:', error)
      return Response.json({ error: 'Failed to create team' }, { status: 500 })
    }

    return Response.json({ team }, { status: 201 })
  } catch (err) {
    console.error('Team creation error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
