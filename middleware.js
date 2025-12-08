import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    async function middleware(req) {
        const token = req.nextauth.token;

        // Update lastSeen for authenticated users
        if (token) {
            const lastSeenCookie = req.cookies.get('last-seen-update');

            // Only update if cookie doesn't exist (throttling)
            if (!lastSeenCookie) {
                try {
                    // Fire and forget - don't wait for the update
                    fetch(`${req.nextUrl.origin}/api/user/update-last-seen`, {
                        method: 'POST',
                        headers: {
                            'Cookie': req.headers.get('cookie') || '',
                        },
                    }).then(res => {
                        // We can't set cookies on the main response easily from here without 
                        // intercepting the return. So we'll let the API route handle the DB update
                        // and we will rely on client side or simply time-based limits if possible
                        // But for middleware, we can just check if we SHOULD do it.
                        // To properly set the cookie, we need to modify the response.
                    }).catch(err => console.error('Failed to update lastSeen:', err));
                } catch (error) {
                    console.error('Error updating lastSeen:', error);
                }
            }
        }

        const response = NextResponse.next();

        // If we processed a token and didn't have the cookie, we should set it on the response
        // to prevent next requests from triggering the fetch.
        if (token && !req.cookies.get('last-seen-update')) {
            response.cookies.set('last-seen-update', 'true', {
                maxAge: 5 * 60, // 5 minutes
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            });
        }

        return response;
    },
    {
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: ["/courses/:path*", "/arsiv/:path*", "/profile/:path*", "/messages/:path*", "/settings/:path*", "/admin/:path*"],
};
