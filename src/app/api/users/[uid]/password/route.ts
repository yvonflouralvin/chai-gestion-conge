import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const body = await request.json();
    const { password } = body;

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          error: 'Password must contain at least 6 characters.'
        },
        { status: 400 }
      );
    }

    await adminAuth.updateUser(uid, {
      password,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error: any) {
    console.error('Password update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message ?? 'Internal server error',
      },
      { status: 500 }
    );
  }
}