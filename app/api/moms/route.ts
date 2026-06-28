import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.logId) {
      return NextResponse.json({ error: 'logId is required' }, { status: 400 })
    }
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Upsert: if a MOM already exists for this log, update it
    const mom = await prisma.mOM.upsert({
      where: { logId: body.logId },
      create: {
        logId: body.logId,
        title: body.title.trim(),
        date: new Date(body.date),
        stakeholders: body.stakeholders?.trim() ?? '',
        notes: body.notes ?? '',
        decisions: body.decisions ?? '',
      },
      update: {
        title: body.title.trim(),
        date: new Date(body.date),
        stakeholders: body.stakeholders?.trim() ?? '',
        notes: body.notes ?? '',
        decisions: body.decisions ?? '',
      },
    })

    return NextResponse.json(mom, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save MOM' }, { status: 500 })
  }
}
