import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const brief = await prisma.brief.findUnique({
      where: { id: params.id },
      include: {
        house: { select: { id: true, name: true } },
        _count: { select: { logs: true } },
      },
    })
    if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(brief)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch brief' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const brief = await prisma.brief.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
      },
    })
    return NextResponse.json(brief)
  } catch {
    return NextResponse.json({ error: 'Failed to update brief' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.brief.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete brief' }, { status: 500 })
  }
}
