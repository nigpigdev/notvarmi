import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// PUT - Update course
export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id } = await params;
        const { name, code, instructor, credits, section } = await req.json();

        // Check if course belongs to user
        const existingCourse = await prisma.course.findFirst({
            where: {
                id,
                userId: user.id
            }
        });

        if (!existingCourse) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
        }

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
        }

        const updatedCourse = await prisma.course.update({
            where: { id },
            data: {
                name,
                code,
                instructor: instructor || null,
                credits: credits ? parseInt(credits) : null,
                section: section || null,

            },
            include: {
                _count: {
                    select: { notes: true }
                }
            }
        });

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error('Error updating course:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete course
export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { id } = await params;

        // Check if course belongs to user
        const existingCourse = await prisma.course.findFirst({
            where: {
                id,
                userId: user.id
            }
        });

        if (!existingCourse) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
        }

        await prisma.course.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
