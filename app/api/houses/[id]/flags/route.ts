import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const flags = await prisma.log.findMany({
      where: {
        isFlag: true,
        brief: { houseId: params.id },
      },
      include: {
        brief: { select: { id: true, name: true } },
      },
      orderBy: { postedAt: 'desc' },
    })
    return NextResponse.json(flags)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 })
  }
}
