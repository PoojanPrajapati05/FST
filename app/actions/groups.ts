"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

interface CreateGroupParams {
  name: string;
  description?: string;
  memberEmails?: string[];
}

export async function createGroupAction({
  name,
  description,
  memberEmails = [],
}: CreateGroupParams) {
  const user = await requireUser();

  const trimmedName = name?.trim();
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error("Group name must be at least 2 characters.");
  }

  // Filter valid emails
  const cleanEmails = Array.from(
    new Set(
      memberEmails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 3 && e.includes("@") && e !== user.email.toLowerCase())
    )
  );

  const existingUsers = await prisma.user.findMany({
    where: {
      email: { in: cleanEmails },
    },
  });

  const group = await prisma.$transaction(async (tx) => {
    const newGroup = await tx.group.create({
      data: {
        name: trimmedName,
        description: description?.trim() || null,
        createdById: user.id,
      },
    });

    // Add creator as ADMIN member
    await tx.groupMember.create({
      data: {
        groupId: newGroup.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    // Add existing members
    for (const memberUser of existingUsers) {
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId: memberUser.id,
          role: "MEMBER",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        groupId: newGroup.id,
        action: "GROUP_CREATED",
        entityType: "GROUP",
        entityId: newGroup.id,
        metadata: {
          name: trimmedName,
          memberCount: existingUsers.length + 1,
        },
      },
    });

    return newGroup;
  });

  revalidatePath("/dashboard");
  return { success: true, groupId: group.id };
}
