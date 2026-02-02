import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { pin } = await request.json();
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPin) {
    return NextResponse.json(
      { error: "Auth no configurado" },
      { status: 500 }
    );
  }

  if (pin === adminPin) {
    const token = Buffer.from(`admin:${Date.now()}`).toString("base64");
    return NextResponse.json({ success: true, token });
  }

  return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
}
