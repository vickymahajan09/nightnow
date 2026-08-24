import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StockRequestItem = {
  productId: string;
  variantId?: string;
  requestedQuantity: number;
};

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const items =
      body?.items;

    if (
      !Array.isArray(items)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "items must be an array.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      items.length === 0
    ) {
      return NextResponse.json({
        success: true,
        valid: true,
        results: [],
      });
    }

    /*
     * Basic input validation.
     *
     * The actual Firestore stock read is kept in
     * the shared stock service.
     *
     * This route intentionally does NOT modify
     * product stock.
     */
    for (const item of items) {
      if (
        !item?.productId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Every stock item needs a productId.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * IMPORTANT:
     * We cannot safely use the browser Firebase client
     * as a privileged stock-writing backend.
     *
     * So this route only validates request structure
     * for now. The actual live Firestore validation
     * will be called from the checkout flow before
     * order creation.
     */

    return NextResponse.json({
      success: true,
      valid: true,
      results: items.map(
        (
          item: StockRequestItem
        ) => ({
          productId:
            String(
              item.productId
            ),

          variantId:
            item.variantId
              ? String(
                  item.variantId
                )
              : undefined,

          requestedQuantity:
            Math.max(
              1,
              Math.floor(
                Number(
                  item.requestedQuantity ||
                    1
                )
              )
            ),
        })
      ),
    });
  } catch (error: any) {
    console.error(
      "Stock validation API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Stock validation failed.",
      },
      {
        status: 500,
      }
    );
  }
}