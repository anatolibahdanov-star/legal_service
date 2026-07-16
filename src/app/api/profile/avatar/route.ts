import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

import { authOptions } from '@/src/app/api/auth/[...nextauth]/route'
import {
  deleteProfileAvatar,
  getProfileAvatar,
  // saveProfileAvatar,
  type ProfileAvatarOwner,
} from '@/src/repositories/profile_avatar/repo'

export const dynamic = 'force-dynamic'

// const MAX_AVATAR_SIZE = 5 * 1024 * 1024
// const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function ownerTypeForRole(role: string | undefined): ProfileAvatarOwner | null {
  if (role === 'user') return 'user'
  if (role === 'admin' || role === 'lowyer') return 'administrator'
  return null
}

// function hasValidSignature(contentType: string, bytes: Uint8Array): boolean {
//   if (contentType === 'image/jpeg') {
//     return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
//   }
//   if (contentType === 'image/png') {
//     const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
//     return bytes.length >= png.length && png.every((value, index) => bytes[index] === value)
//   }
//   if (contentType === 'image/webp') {
//     return bytes.length >= 12
//       && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
//       && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
//   }
//   return false
// }

async function getOwner() {
  const session = await getServerSession(authOptions)
  const ownerType = ownerTypeForRole(session?.user?.role)
  if (!session?.user?.id || !ownerType) return null
  return { ownerId: session.user.id.toString(), ownerType }
}

export async function GET() {
  const owner = await getOwner()
  if (!owner) {
    return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 })
  }

  const avatar = await getProfileAvatar(owner.ownerType, owner.ownerId)
  if (!avatar) {
    return NextResponse.json({ success: false, message: 'Фото не найдено.' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(avatar.image_data), {
    status: 200,
    headers: {
      'Content-Type': avatar.content_type,
      'Content-Length': String(avatar.image_data.byteLength),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function PUT(_request: NextRequest) {
  // Temporarily disabled: avatar upload to DB is turned off.
  return NextResponse.json({ success: false }, { status: 503 })

  // const owner = await getOwner()
  // if (!owner) {
  //   return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 })
  // }
  //
  // const formData = await request.formData()
  // const file = formData.get('avatar')
  // if (!(file instanceof File)) {
  //   return NextResponse.json({ success: false, message: 'Выберите изображение.' }, { status: 400 })
  // }
  // if (!ALLOWED_TYPES.has(file.type)) {
  //   return NextResponse.json(
  //     { success: false, message: 'Поддерживаются только JPEG, PNG и WebP.' },
  //     { status: 415 },
  //   )
  // }
  // if (file.size <= 0 || file.size > MAX_AVATAR_SIZE) {
  //   return NextResponse.json(
  //     { success: false, message: 'Размер изображения должен быть не больше 5 МБ.' },
  //     { status: 413 },
  //   )
  // }
  //
  // const bytes = new Uint8Array(await file.arrayBuffer())
  // if (!hasValidSignature(file.type, bytes)) {
  //   return NextResponse.json({ success: false, message: 'Некорректный файл изображения.' }, { status: 400 })
  // }
  //
  // const saved = await saveProfileAvatar(
  //   owner.ownerType,
  //   owner.ownerId,
  //   file.type,
  //   Buffer.from(bytes),
  // )
  // if (!saved) {
  //   return NextResponse.json({ success: false, message: 'Не удалось сохранить фото.' }, { status: 500 })
  // }
  //
  // return NextResponse.json({ success: true, avatarUrl: `/api/profile/avatar?v=${Date.now()}` })
}

export async function DELETE() {
  const owner = await getOwner()
  if (!owner) {
    return NextResponse.json({ success: false, message: 'Требуется авторизация.' }, { status: 401 })
  }

  const deleted = await deleteProfileAvatar(owner.ownerType, owner.ownerId)
  return NextResponse.json({ success: deleted })
}
