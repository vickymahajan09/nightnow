
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: true,
      message: "Push notification endpoint is ready.",
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "Push notification endpoint is ready.",
    },
    { status: 200 }
  );
}