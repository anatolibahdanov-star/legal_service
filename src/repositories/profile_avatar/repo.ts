import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'

import db from '@/src/libs/db'

export type ProfileAvatarOwner = 'user' | 'administrator'

interface ProfileAvatarRow extends RowDataPacket {
  content_type: string
  image_data: Buffer
}

export async function getProfileAvatar(
  ownerType: ProfileAvatarOwner,
  ownerId: string,
): Promise<ProfileAvatarRow | null> {
  const query = `
    SELECT content_type, image_data
    FROM profile_avatar
    WHERE owner_type = ? AND owner_id = ?
    LIMIT 1
  `
  const [rows] = await db.query<ProfileAvatarRow[]>(query, [ownerType, ownerId])
  return rows[0] ?? null
}

export async function saveProfileAvatar(
  _ownerType: ProfileAvatarOwner,
  _ownerId: string,
  _contentType: string,
  _imageData: Buffer,
): Promise<boolean> {
  // Temporarily disabled: do not write avatars to DB.
  // const query = `
  //   INSERT INTO profile_avatar(owner_type, owner_id, content_type, image_data)
  //   VALUES(?, ?, ?, ?)
  //   ON DUPLICATE KEY UPDATE
  //     content_type = VALUES(content_type),
  //     image_data = VALUES(image_data),
  //     updated_at = CURRENT_TIMESTAMP
  // `
  // const [result] = await db.query<ResultSetHeader>(
  //   query,
  //   [ownerType, ownerId, contentType, imageData],
  // )
  // return result.affectedRows > 0
  return false
}

export async function deleteProfileAvatar(
  ownerType: ProfileAvatarOwner,
  ownerId: string,
): Promise<boolean> {
  const query = 'DELETE FROM profile_avatar WHERE owner_type = ? AND owner_id = ?'
  const [result] = await db.query<ResultSetHeader>(query, [ownerType, ownerId])
  return result.affectedRows > 0
}
