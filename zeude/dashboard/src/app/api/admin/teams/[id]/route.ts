import { createServerClient } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createServerClient()

    // Prevent deleting a team that still has members
    const { count } = await supabase
      .from('zeude_users')
      .select('id', { count: 'exact', head: true })
      .eq('team', (
        await supabase.from('zeude_teams').select('name').eq('id', id).single()
      ).data?.name ?? '')
      .neq('status', 'deleted')

    if (count && count > 0) {
      return Response.json(
        { error: `Cannot delete team with ${count} active member(s). Reassign them first.` },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('zeude_teams')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete team:', error)
      return Response.json({ error: 'Failed to delete team' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Team delete error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
