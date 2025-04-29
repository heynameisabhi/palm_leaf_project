import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type UserWithDecks = Prisma.UserAccountGetPayload<{
    include: {
        GranthaDeck: {
            include: {
                granthas: {
                    select: {
                        grantha_id: true;
                        grantha_name: true;
                    };
                };
            };
            orderBy: {
                createdAt: "desc";
            };
        };
    };
}>;

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!params.userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Get user details with their GranthaDeck records
        const user = await db.userAccount.findUnique({
            where: {
                user_id: params.userId,
            },
            include: {
                GranthaDeck: {
                    include: {
                        granthas: {
                            select: {
                                grantha_id: true,
                                grantha_name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Calculate total granthas across all decks
        const totalGranthas = user.GranthaDeck.reduce(
            (sum: number, deck) => sum + deck.granthas.length,
            0
        );

        // Format the response
        const response = {
            user_id: user.user_id,
            user_name: user.user_name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
            total_decks: user.GranthaDeck.length,
            total_granthas: totalGranthas,
            decks: user.GranthaDeck.map((deck) => ({
                grantha_deck_id: deck.grantha_deck_id,
                grantha_deck_name: deck.grantha_deck_name,
                createdAt: deck.createdAt.toISOString(),
                granthas: deck.granthas.map((grantha) => ({
                    grantha_id: grantha.grantha_id,
                    grantha_name: grantha.grantha_name,
                })),
            })),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching user details:", error);
        return NextResponse.json(
            { error: "An error occurred while fetching user details" },
            { status: 500 }
        );
    }
} 