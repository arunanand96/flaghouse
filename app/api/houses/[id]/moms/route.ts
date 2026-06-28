import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const moms = await prisma.mOM.findMany({
      where: {
        log: { brief: { houseId: params.id } },
      },
      include: {
        log: {
          select: {
            id: true,
            title: true,
            postedAt: true,
            brief: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(moms)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch MOMs' }, { status: 500 })
  }
}
