import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const log = await prisma.log.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.isFlag !== undefined && { isFlag: body.isFlag }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.deadline !== undefined && {
          deadline: body.deadline ? new Date(body.deadline) : null,
        }),
        ...(body.completed !== undefined && { completed: body.completed }),
      },
    })
    return NextResponse.json(log)
  } catch {
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.log.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 })
  }
}
