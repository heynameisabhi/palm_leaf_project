import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type UserActivity = {
    user_id: string;
    user_name: string;
    email: string;
    role: string;
    status: string;
    total_decks: number;
    last_activity: Date;
    recent_decks: {
        grantha_deck_id: string;
        grantha_deck_name: string;
        createdAt: Date;
        total_granthas: number;
    }[];
};

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json("Unauthorized", { status: 401 });
        }

        // Get all users with their GranthaDeck counts and recent activity
        const users = await db.userAccount.findMany({
            where: {
                role: {
                    not: "admin"
                }
            },
            select: {
                user_id: true,
                user_name: true,
                email: true,
                role: true,
                status: true,
                GranthaDeck: {
                    select: {
                        grantha_deck_id: true,
                        grantha_deck_name: true,
                        createdAt: true,
                        granthas: {
                            select: {
                                grantha_id: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 5
                }
            }
        });

        // Format the data
        const formattedUsers: UserActivity[] = users.map(user => {
            const recent_decks = user.GranthaDeck.map(deck => ({
                grantha_deck_id: deck.grantha_deck_id,
                grantha_deck_name: deck.grantha_deck_name || "Untitled Deck",
                createdAt: deck.createdAt,
                total_granthas: deck.granthas.length
            }));

            return {
                user_id: user.user_id,
                user_name: user.user_name,
                email: user.email,
                role: user.role,
                status: user.status,
                total_decks: user.GranthaDeck.length,
                last_activity: user.GranthaDeck[0]?.createdAt || new Date(),
                recent_decks
            };
        });

        // Get user activity chart data (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const userActivityChart = await Promise.all(
            last7Days.map(async (date) => {
                const startOfDay = new Date(date);
                const endOfDay = new Date(date);
                endOfDay.setDate(endOfDay.getDate() + 1);

                const active = await db.userAccount.count({
                    where: {
                        status: "ACTIVE",
                        role: {
                            not: "ADMIN"
                        }
                    }
                });

                const blocked = await db.userAccount.count({
                    where: {
                        status: "BLOCKED",
                        role: {
                            not: "ADMIN"
                        }
                    }
                });

                return {
                    name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    active,
                    blocked
                };
            })
        );

        return NextResponse.json({
            users: formattedUsers,
            userActivityChart
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(error.message, { status: 500 });
    }
} 