import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import { getSettingNumber } from '@/src/services/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized.' },
            { status: 401 }
        );
    }

    const minTopupRub = Math.max(0, getSettingNumber('min_topup_rub', 100));
    return NextResponse.json({ minTopupRub }, { status: 200 });
}
