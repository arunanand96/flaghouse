import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const house = await prisma.house.findUnique({
      where: { id: params.id },
      include: { _count: { select: { briefs: true } } },
    })
    if (!house) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(house)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch house' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const house = await prisma.house.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
      },
    })
    return NextResponse.json(house)
  } catch {
    return NextResponse.json({ error: 'Failed to update house' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.house.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete house' }, { status: 500 })
  }
}
