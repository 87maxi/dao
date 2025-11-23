import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.signature || !body.request) {
      return NextResponse.json(
        { error: 'Missing signature or request' },
        { status: 400 }
      );
    }

    // Here we would normally validate the signature and forward to MinimalForwarder
    // For development purposes, we'll just echo back the data
    
    return NextResponse.json({
      success: true,
      transactionHash: `0xdev${Math.random().toString(16).substr(2, 64)}`
    });
  } catch (error) {
    console.error('Relayer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}