import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    console.log(`[proxy] Calling backend at: ${backendUrl}/get-folder-details`);

    const response = await axios.post(`${backendUrl}/get-folder-details`, body);

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    const detail = error?.response?.data ?? error?.message ?? String(error);
    console.error("[proxy] Error proxying to backend:", JSON.stringify(detail));
    return NextResponse.json(
      { error: "Failed to reach backend server. Make sure the backend is running.", detail },
      { status: 500 }
    );
  }
}
