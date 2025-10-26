import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    const apiKey = process.env.PARALLEL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PARALLEL_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Call Parallel Search API
    const response = await fetch('https://api.parallel.ai/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: query,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Parallel API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Parallel search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Parallel API' },
      { status: 500 }
    );
  }
}

