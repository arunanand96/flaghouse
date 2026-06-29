import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const houseId = searchParams.get('houseId')
    const entries = await prisma.kBEntry.findMany({
      where: houseId ? { houseId } : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch KB entries' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    if (!body.houseId)       return NextResponse.json({ error: 'houseId required' }, { status: 400 })
    const entry = await prisma.kBEntry.create({
      data: {
        houseId: body.houseId,
        title:   body.title.trim(),
        body:    body.body ?? '',
      },
    })
    return NextResponse.json(entry, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create KB entry' }, { status: 500 })
  }
}
