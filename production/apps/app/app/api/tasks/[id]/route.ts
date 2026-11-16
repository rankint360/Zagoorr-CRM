import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma, TaskStatus } from '@zagoorr/db'
import { getSessionAgency } from '../../../../lib/tenant'
import { asString, badRequest, notFound, serverError, unauthorized } from '../../../../lib/api'

const STATUS_VALUES = Object.values(TaskStatus) as string[]

/** PATCH /api/tasks/:id { status } — move a task TODO / DOING / DONE. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const statusRaw = asString(body.status)
    if (!statusRaw || !STATUS_VALUES.includes(statusRaw)) {
      return badRequest('A valid task status is required.')
    }
    const task = await prisma.task.findFirst({
      where: { id: params.id, project: { agencyId: user.agencyId } },
    })
    if (!task) return notFound('Task not found.')

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: { status: statusRaw as TaskStatus },
    })
    return NextResponse.json({ task: updated })
  } catch (err) {
    return serverError(err)
  }
}
