import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const houses = await prisma.house.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { briefs: true } } },
    })
    return NextResponse.json(houses)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch houses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const house = await prisma.house.create({
      data: { name: body.name.trim(), description: body.description?.trim() || null },
    })
    return NextResponse.json(house, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create house' }, { status: 500 })
  }
}
