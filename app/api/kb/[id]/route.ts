import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const entry = await prisma.kBEntry.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.body  !== undefined && { body:  body.body }),
      },
    })
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Failed to update KB entry' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.kBEntry.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete KB entry' }, { status: 500 })
  }
}
