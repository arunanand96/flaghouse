import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const briefId = searchParams.get('briefId')

    const logs = await prisma.log.findMany({
      where: briefId ? { briefId } : undefined,
      orderBy: { postedAt: 'desc' },
      include: { mom: true },
    })
    return NextResponse.json(logs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!body.briefId) {
      return NextResponse.json({ error: 'briefId is required' }, { status: 400 })
    }
    const log = await prisma.log.create({
      data: {
        title: body.title.trim(),
        briefId: body.briefId,
        isFlag: body.isFlag ?? false,
        description: body.description?.trim() || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        postedAt: new Date(),
      },
    })
    return NextResponse.json(log, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
  }
}
