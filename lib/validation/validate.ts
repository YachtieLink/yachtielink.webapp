import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function validateBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: err.issues.map((e) => ({ path: e.path.join('.'), message: e.message })),
          },
          { status: 400 },
        ),
      };
    }
    return {
      error: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
    };
  }
}
