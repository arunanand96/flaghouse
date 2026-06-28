import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const houseId = searchParams.get('houseId')

    const briefs = await prisma.brief.findMany({
      where: houseId ? { houseId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { logs: true } },
        house: { select: { name: true } },
      },
    })
    return NextResponse.json(briefs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch briefs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!body.houseId) {
      return NextResponse.json({ error: 'houseId is required' }, { status: 400 })
    }
    const brief = await prisma.brief.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        houseId: body.houseId,
      },
    })
    return NextResponse.json(brief, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create brief' }, { status: 500 })
  }
}
