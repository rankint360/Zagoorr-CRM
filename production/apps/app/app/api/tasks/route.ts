import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { asString, badRequest, serverError, unauthorized } from '../../../lib/api'

/** POST { projectId, title } — add a task to a project. */
export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const projectId = asString(body.projectId)
    const title = asString(body.title)
    if (!projectId || !title) return badRequest('Project and title are required.')

    const project = await prisma.project.findFirst({
      where: { id: projectId, ...tenantWhere(user.agencyId) },
    })
    if (!project) return badRequest('Project not found for this agency.')

    const task = await prisma.task.create({
      data: { projectId, title, status: 'TODO' },
    })
    return NextResponse.json({ task }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
