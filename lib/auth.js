import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.email },
                            { username: credentials.email }
                        ]
                    }
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    role: user.role,
                    adminMode: user.adminMode,
                    banned: user.banned
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.avatar = user.avatar;
                token.role = user.role;
                token.adminMode = user.adminMode;
                token.banned = user.banned;
            }

            // Securely handle session updates
            if (trigger === "update" && session) {
                // Only allow updating specific fields
                if (session.user) {
                    if (session.user.firstName) token.firstName = session.user.firstName;
                    if (session.user.lastName) token.lastName = session.user.lastName;
                    if (session.user.avatar) token.avatar = session.user.avatar;
                    // Allow updating adminMode explicitly
                    if (typeof session.user.adminMode === 'boolean') token.adminMode = session.user.adminMode;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.avatar = token.avatar;
                session.user.banned = token.banned;

                // Store the original role from DB
                session.user.originalRole = token.role;
                session.user.adminMode = token.adminMode;

                // Determine effective role
                if ((token.role === 'ADMIN' || token.role === 'POWERUSER') && token.adminMode === false) {
                    session.user.role = 'USER';
                } else {
                    session.user.role = token.role;
                }
            }
            return session;
        }
    },
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
