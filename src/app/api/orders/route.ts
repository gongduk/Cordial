import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";

// POST /api/orders — 주문 생성
export async function POST(req: NextRequest) {
  try {
    const { storeId, tableNum, items } = await req.json();

    if (!storeId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "storeId와 items는 필수입니다." }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        storeId,
        tableNum: tableNum ?? null,
        items: {
          create: items.map((item: { cocktailId: string; quantity: number }) => ({
            cocktailId: item.cocktailId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { cocktail: true } } },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[orders POST]", error);
    return NextResponse.json({ error: "주문 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
