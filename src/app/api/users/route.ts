// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

// Example data source (e.g., a database query result)
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

export async function GET() {
  // Handle the GET request for all users
  const session = await getServerSession(authOptions)
  if (session) {
    // Signed in
    console.log("Session", JSON.stringify(session, null, 2))
    return NextResponse.json(users, { status: 200 });
  } else {
    // Not Signed in
    return NextResponse.json(
      { success: false, message: 'Authentication required.' },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  // Handle the POST request to create a new user
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return new NextResponse("Name is required", { status: 400 });
  }

  const newUser = { id: Date.now(), name };
  users.push(newUser); // In a real app, you would save to a database

  return NextResponse.json(newUser, { status: 201 });
}
