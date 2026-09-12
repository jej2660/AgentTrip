import { NextResponse } from 'next/server';
import { RouteRequestSchema } from '@/lib/domain/schema';
import { generateEnginePlan } from '@/lib/engine/plan';
import { InvalidRouteRequestError, NoFeasibleRouteError } from '@/lib/engine/errors';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: '유효한 JSON 요청이 필요합니다.' }, { status: 400 });
    }
    const parseResult = RouteRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const routePlan = await generateEnginePlan(parseResult.data);
    return NextResponse.json(routePlan);
  } catch (error: unknown) {
    if (error instanceof InvalidRouteRequestError) return NextResponse.json({ error: 'INVALID_REQUEST', message: error.message }, { status: 400 });
    if (error instanceof NoFeasibleRouteError) return NextResponse.json({ error: 'NO_FEASIBLE_ROUTE', message: error.message }, { status: 422 });
    console.error('Engine route generation error:', error);
    return NextResponse.json(
      {
        error: 'ENGINE_PLAN_FAILED',
        message: 'Failed to generate engine route plan',
      },
      { status: 500 }
    );
  }
}
