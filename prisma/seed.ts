import { PrismaClient, Role, SplitType } from "@prisma/client";
import { fakerEN_IN as faker } from "@faker-js/faker";
import { hashPassword } from "better-auth/crypto";
import { computeServerExpenseShares } from "../lib/validations/expense";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting SplitEase database seeding (en_IN locale)...");

  // 1. Clean up existing data in correct dependency order
  await prisma.supportRequest.deleteMany().catch(() => {});
  await prisma.transaction.deleteMany().catch(() => {});
  await prisma.emailEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expenseShare.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned old records.");

  // Pre-compute password hashes
  const adminHashedPassword = await hashPassword("Admin@123");
  const memberHashedPassword = await hashPassword("Member@123");

  // 2. Create 1 Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: "Aarav Sharma (Admin)",
      email: "admin@splitease.example.com",
      emailVerified: true,
      role: Role.ADMIN,
      accounts: {
        create: {
          accountId: "admin@splitease.example.com",
          providerId: "credential",
          password: adminHashedPassword,
        },
      },
    },
  });

  const auditLogsData: {
    userId?: string;
    groupId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: any;
    createdAt: Date;
  }[] = [];

  auditLogsData.push({
    userId: adminUser.id,
    action: "USER_REGISTERED",
    entityType: "USER",
    entityId: adminUser.id,
    metadata: { email: adminUser.email, role: "ADMIN" },
    createdAt: new Date(Date.now() - 30 * 86400000),
  });

  // 3. Create 8 Regular Member Users with Indian names
  const memberUsers = [];
  const indianNames = [
    "Priya Patel",
    "Rohan Verma",
    "Ananya Iyer",
    "Vikram Malhotra",
    "Neha Gupta",
    "Kabir Sen",
    "Tanvi Kulkarni",
    "Dev Mehta",
  ];

  for (let i = 0; i < 8; i++) {
    const email = `member${i + 1}@example.com`;
    const user = await prisma.user.create({
      data: {
        name: indianNames[i] || faker.person.fullName(),
        email,
        emailVerified: true,
        role: Role.MEMBER,
        accounts: {
          create: {
            accountId: email,
            providerId: "credential",
            password: memberHashedPassword,
          },
        },
      },
    });
    memberUsers.push(user);

    auditLogsData.push({
      userId: user.id,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: user.id,
      metadata: { email, role: "MEMBER" },
      createdAt: new Date(Date.now() - (28 - i * 2) * 86400000),
    });
  }

  const allUsers = [adminUser, ...memberUsers];

  // 4. Create 4 Groups
  const groupDefs = [
    {
      name: "Goa Beach Villa Trip",
      description: "Annual friends trip to North Goa with scooter rentals & beach shacks.",
      creator: memberUsers[0],
      members: [adminUser, memberUsers[0], memberUsers[1], memberUsers[2], memberUsers[3]],
    },
    {
      name: "Apartment 402 - Koramangala",
      description: "Monthly flat expenses, cook, high-speed WiFi & Groceries.",
      creator: memberUsers[1],
      members: [memberUsers[1], memberUsers[2], memberUsers[4], memberUsers[5]],
    },
    {
      name: "Manali Himalayan Trek",
      description: "Camping gear, homestays, trekking guide, and travel.",
      creator: memberUsers[3],
      members: [adminUser, memberUsers[3], memberUsers[5], memberUsers[6], memberUsers[7]],
    },
    {
      name: "Weekend Badminton & Sports",
      description: "Court bookings, Yonex shuttles, and weekend post-game brunches.",
      creator: memberUsers[4],
      members: [memberUsers[0], memberUsers[4], memberUsers[6], memberUsers[7]],
    },
  ];

  const createdGroups = [];

  for (const def of groupDefs) {
    const group = await prisma.group.create({
      data: {
        name: def.name,
        description: def.description,
        currency: "INR",
        createdById: def.creator.id,
        members: {
          create: def.members.map((m) => ({
            userId: m.id,
            role: m.id === def.creator.id ? "ADMIN" : "MEMBER",
          })),
        },
      },
      include: {
        members: true,
      },
    });

    createdGroups.push({ group, def });

    auditLogsData.push({
      userId: def.creator.id,
      groupId: group.id,
      action: "GROUP_CREATED",
      entityType: "GROUP",
      entityId: group.id,
      metadata: { name: def.name, memberCount: def.members.length },
      createdAt: new Date(Date.now() - 20 * 86400000),
    });
  }

  // 5. Create ~30 Expenses across the 4 groups with exact share balance
  const expenseDescriptions: Record<string, { desc: string; category: string; minRs: number; maxRs: number }[]> = {
    "Goa Beach Villa Trip": [
      { desc: "Villa Booking Advance", category: "ACCOMMODATION", minRs: 12000, maxRs: 25000 },
      { desc: "Thalassa Sunset Dinner", category: "FOOD", minRs: 4500, maxRs: 8500 },
      { desc: "Activa Scooter Rentals (3 days)", category: "TRAVEL", minRs: 3000, maxRs: 6000 },
      { desc: "Baga Beach Water Sports", category: "ENTERTAINMENT", minRs: 3500, maxRs: 7000 },
      { desc: "Supermarket Snacks & Beverages", category: "FOOD", minRs: 2000, maxRs: 4200 },
      { desc: "Fuel for Scooters", category: "TRAVEL", minRs: 1200, maxRs: 2500 },
      { desc: "Anjuna Flea Market Souvenirs", category: "SHOPPING", minRs: 1800, maxRs: 3500 },
      { desc: "Airport Cab to Dabolim", category: "TRAVEL", minRs: 2200, maxRs: 3200 },
    ],
    "Apartment 402 - Koramangala": [
      { desc: "ACT Fibernet Broadband 300Mbps", category: "UTILITIES", minRs: 1199, maxRs: 1500 },
      { desc: "Cook & Maid Monthly Salary", category: "GENERAL", minRs: 8000, maxRs: 12000 },
      { desc: "Blinkit Weekly Grocery Haul", category: "FOOD", minRs: 3200, maxRs: 5800 },
      { desc: "BESCOM Electricity Bill", category: "UTILITIES", minRs: 2400, maxRs: 4500 },
      { desc: "Bisleri 20L Water Cans (10x)", category: "UTILITIES", minRs: 900, maxRs: 1400 },
      { desc: "Urban Company Deep Cleaning", category: "GENERAL", minRs: 2500, maxRs: 4000 },
      { desc: "Weekend House Party Biryani", category: "FOOD", minRs: 2800, maxRs: 4800 },
    ],
    "Manali Himalayan Trek": [
      { desc: "Tent & Sleeping Bag Rentals", category: "ACCOMMODATION", minRs: 6000, maxRs: 10000 },
      { desc: "Local Certified Trekking Guide", category: "GENERAL", minRs: 5000, maxRs: 8000 },
      { desc: "Volvo Bus Delhi-Manali Tickets", category: "TRAVEL", minRs: 7500, maxRs: 12000 },
      { desc: "Old Manali Cafe Breakfast", category: "FOOD", minRs: 1800, maxRs: 3400 },
      { desc: "High Altitude Dry Fruits & Energy Bars", category: "FOOD", minRs: 2200, maxRs: 4000 },
      { desc: "Thermal Gloves & Trekking Poles", category: "SHOPPING", minRs: 3000, maxRs: 5500 },
      { desc: "Solang Valley 4x4 Gypsy Taxi", category: "TRAVEL", minRs: 3500, maxRs: 5000 },
      { desc: "Bonfire & Camp Dinner", category: "FOOD", minRs: 2400, maxRs: 4200 },
    ],
    "Weekend Badminton & Sports": [
      { desc: "Playo Wooden Court Booking (2 hrs)", category: "ENTERTAINMENT", minRs: 1400, maxRs: 2000 },
      { desc: "Yonex Mavis 350 Shuttles (Pack of 6)", category: "SHOPPING", minRs: 950, maxRs: 1200 },
      { desc: "Energy Drinks & Coconut Water", category: "FOOD", minRs: 500, maxRs: 900 },
      { desc: "Post-Game Dosa & Filter Coffee", category: "FOOD", minRs: 800, maxRs: 1600 },
      { desc: "Racket Stringing at Decathlon", category: "GENERAL", minRs: 1200, maxRs: 1800 },
      { desc: "Tournament Entry Fee", category: "ENTERTAINMENT", minRs: 1500, maxRs: 2500 },
      { desc: "Gatorade & Protein Bars", category: "FOOD", minRs: 750, maxRs: 1200 },
    ],
  };

  let totalExpensesCreated = 0;

  for (const { group, def } of createdGroups) {
    const items = expenseDescriptions[def.name] || [];
    const members = def.members;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const payer = members[idx % members.length];
      const amountPaise = Math.round(
        (Math.floor(Math.random() * (item.maxRs - item.minRs)) + item.minRs) * 100
      );

      // Choose split type: predominantly EQUAL, with occasional EXACT or PERCENT
      let splitType: SplitType = SplitType.EQUAL;
      if (idx === 2) splitType = SplitType.PERCENT;
      else if (idx === 4) splitType = SplitType.EXACT;

      const participantIds = members.map((m) => m.id);
      let exactSharesPaise: Record<string, number> | undefined;
      let percentShares: Record<string, number> | undefined;

      if (splitType === SplitType.EXACT) {
        exactSharesPaise = {};
        let remaining = amountPaise;
        for (let p = 0; p < participantIds.length; p++) {
          if (p === participantIds.length - 1) {
            exactSharesPaise[participantIds[p]] = remaining;
          } else {
            const share = Math.floor(amountPaise / participantIds.length);
            exactSharesPaise[participantIds[p]] = share;
            remaining -= share;
          }
        }
      } else if (splitType === SplitType.PERCENT) {
        percentShares = {};
        const count = participantIds.length;
        const basePct = Math.floor(100 / count);
        let remPct = 100;
        for (let p = 0; p < count; p++) {
          if (p === count - 1) {
            percentShares[participantIds[p]] = remPct;
          } else {
            percentShares[participantIds[p]] = basePct;
            remPct -= basePct;
          }
        }
      }

      // Compute exact shares
      const computedShares = computeServerExpenseShares(
        amountPaise,
        splitType,
        participantIds,
        exactSharesPaise,
        percentShares
      );

      const expenseDate = new Date(Date.now() - (items.length - idx) * 2 * 86400000);

      const exp = await prisma.expense.create({
        data: {
          groupId: group.id,
          paidById: payer.id,
          description: item.desc,
          category: item.category,
          amount: amountPaise,
          splitType,
          date: expenseDate,
          shares: {
            create: computedShares.map((s) => ({
              userId: s.userId,
              amount: s.amountPaise,
              percentage: s.percentage,
            })),
          },
        },
      });

      totalExpensesCreated++;

      auditLogsData.push({
        userId: payer.id,
        groupId: group.id,
        action: "EXPENSE_CREATED",
        entityType: "EXPENSE",
        entityId: exp.id,
        metadata: {
          description: item.desc,
          amountPaise,
          splitType,
          payerId: payer.id,
        },
        createdAt: expenseDate,
      });
    }
  }

  // 6. Create a few Settlements across groups
  let totalSettlementsCreated = 0;
  for (const { group, def } of createdGroups) {
    if (def.members.length >= 2) {
      const payer = def.members[1];
      const receiver = def.members[0];
      const settlementPaise = 150000; // ₹1,500.00

      const st = await prisma.settlement.create({
        data: {
          groupId: group.id,
          payerId: payer.id,
          receiverId: receiver.id,
          amount: settlementPaise,
          note: "UPI settlement via Google Pay",
          date: new Date(Date.now() - 3 * 86400000),
        },
      });

      totalSettlementsCreated++;

      auditLogsData.push({
        userId: payer.id,
        groupId: group.id,
        action: "SETTLEMENT_RECORDED",
        entityType: "SETTLEMENT",
        entityId: st.id,
        metadata: {
          payerId: payer.id,
          receiverId: receiver.id,
          amountPaise: settlementPaise,
          note: "UPI settlement via Google Pay",
        },
        createdAt: new Date(Date.now() - 3 * 86400000),
      });
    }
  }

  // 7. Insert Audit Logs (Target: ~40 logs)
  for (const log of auditLogsData) {
    await prisma.auditLog.create({
      data: log,
    });
  }

  // 8. Create ~15 Email Events
  const emailEventTypes = [
    "email.delivered",
    "email.delivered",
    "email.delivered",
    "email.opened",
    "email.opened",
    "email.delivered",
    "email.delivered",
    "email.bounced",
    "email.delivered",
    "email.opened",
    "email.sent",
    "email.delivered",
    "email.opened",
    "email.complained",
    "email.delivered",
  ];

  const emailSubjects = [
    "Welcome to SplitEase! 🎉",
    "New expense in Goa Beach Villa Trip: Villa Booking Advance",
    "New expense in Apartment 402: Bescom Bill",
    "Debt settled in Goa Beach Villa Trip: ₹1,500.00",
    "New expense in Manali Himalayan Trek: Tent & Sleeping Bag Rentals",
  ];

  for (let i = 0; i < emailEventTypes.length; i++) {
    const user = allUsers[i % allUsers.length];
    const type = emailEventTypes[i];
    const subject = emailSubjects[i % emailSubjects.length];
    const resendId = `msg_resend_mock_${1000 + i}`;

    await prisma.emailEvent.create({
      data: {
        type,
        recipient: user.email,
        subject,
        resendId,
        metadata: {
          event: type,
          recipient: user.email,
          simulated: true,
          status: type.replace("email.", ""),
        },
        timestamp: new Date(Date.now() - (15 - i) * 12 * 3600000),
      },
    });
  }

  // ── 8. Seed Transactions (30 records) ──────────────────────────────────
  console.log("💳 Seeding transactions...");
  const txTypes = ["CREDIT", "DEBIT", "TRANSFER"] as const;
  const txStatuses = ["PENDING", "COMPLETED", "FAILED", "REVERSED"] as const;
  const txDescriptions = [
    "Salary credit", "Monthly rent payment", "Grocery shopping", "Electricity bill",
    "Freelance payment received", "Online subscription", "Travel reimbursement",
    "Medical expense", "Food delivery", "Mobile recharge", "Transfer to savings",
    "UPI payment", "ATM withdrawal", "Insurance premium", "Festival bonus",
  ];

  for (let i = 0; i < 30; i++) {
    const user = allUsers[i % allUsers.length];
    const type = txTypes[i % txTypes.length];
    const status = txStatuses[Math.floor(Math.random() * txStatuses.length)];
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type,
        status,
        amount: Math.round((faker.number.float({ min: 50, max: 50000, fractionDigits: 2 })) * 100) / 100,
        description: txDescriptions[i % txDescriptions.length],
        reference: `REF${Date.now()}${i}`,
        metadata: { seeded: true, source: "faker" },
        createdAt: new Date(Date.now() - (30 - i) * 24 * 3600000),
        updatedAt: new Date(Date.now() - (30 - i) * 24 * 3600000),
      },
    });
  }
  console.log("💳 30 transactions seeded.");

  // ── 9. Seed Support Requests (15 records) ──────────────────────────────
  console.log("🎫 Seeding support requests...");
  const supportSubjects = [
    "Cannot join group", "Expense calculation wrong", "Payment not reflecting",
    "Account locked", "Email not received", "Delete account request",
    "Wrong split type applied", "Settlement not recorded", "Feature request: CSV export",
    "App is slow", "Password reset issue", "Group not visible",
    "Duplicate expense added", "Can't see my transactions", "Change email request",
  ];
  const supportStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

  for (let i = 0; i < 15; i++) {
    const user = allUsers[(i + 1) % allUsers.length];
    await prisma.supportRequest.create({
      data: {
        userId: user.id,
        subject: supportSubjects[i],
        message: faker.lorem.paragraph(),
        status: supportStatuses[i % supportStatuses.length],
        adminNote: i % 3 === 0 ? "Investigated and resolved." : null,
        createdAt: new Date(Date.now() - (15 - i) * 2 * 86400000),
        updatedAt: new Date(Date.now() - (15 - i) * 86400000),
      },
    });
  }
  console.log("🎫 15 support requests seeded.");

  console.log("\n========================================================");
  console.log("🎉 SPLITEASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("========================================================");
  console.log(`Users Created:       ${allUsers.length} (1 Admin, 8 Members)`);
  console.log(`Groups Created:      ${createdGroups.length}`);
  console.log(`Expenses Created:    ${totalExpensesCreated} (sum of shares strictly matches amounts)`);
  console.log(`Settlements Created: ${totalSettlementsCreated}`);
  console.log(`Audit Logs Created:  ${auditLogsData.length}`);
  console.log(`Email Events:        ${emailEventTypes.length}`);
  console.log(`Transactions:        30`);
  console.log(`Support Requests:    15`);
  console.log("--------------------------------------------------------");
  console.log("🔑 TEST CREDENTIALS:");
  console.log("  ADMIN:  admin@splitease.example.com / Admin@123");
  console.log("  MEMBER: member1@example.com         / Member@123");
  console.log("          member2@example.com         / Member@123");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
