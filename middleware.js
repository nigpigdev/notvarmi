import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    async function middleware(req) {
        const token = req.nextauth.token;

        // Update lastSeen for authenticated users
        if (token) {
            try {
                // Fire and forget - don't wait for the update
                fetch(`${req.nextUrl.origin}/api/user/update-last-seen`, {
                    method: 'POST',
                    headers: {
                        'Cookie': req.headers.get('cookie') || '',
                    },
                }).catch(err => console.error('Failed to update lastSeen:', err));
            } catch (error) {
                console.error('Error updating lastSeen:', error);
            }
        }

        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: ["/courses/:path*", "/notes/:path*", "/profile/:path*", "/messages/:path*", "/settings/:path*", "/admin/:path*"],
};
