import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const flags = await prisma.openFlag.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(flags)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const flag = await prisma.openFlag.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        priority: body.priority ?? 'MID',
      },
    })
    return NextResponse.json(flag, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create flag' }, { status: 500 })
  }
}
