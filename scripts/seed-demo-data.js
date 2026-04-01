const admin = require("firebase-admin");
const serviceAccount = require("../backend/firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function seed() {
  console.log("🌱 Seeding Firestore demo data...\n");

  // ─── RESOURCES ─────────────────────────────────────────────
  const resources = [
    { name: "Main Auditorium",    type: "ROOM",      capacity: 250, location: "Block A, Ground Floor", status: "ACTIVE" },
    { name: "Lecture Hall B1",    type: "ROOM",      capacity: 120, location: "Block B, 1st Floor",    status: "ACTIVE" },
    { name: "Lecture Hall B2",    type: "ROOM",      capacity: 120, location: "Block B, 2nd Floor",    status: "ACTIVE" },
    { name: "Computer Lab 01",    type: "LAB",       capacity: 40,  location: "Block C, 3rd Floor",   status: "ACTIVE" },
    { name: "Computer Lab 02",    type: "LAB",       capacity: 40,  location: "Block C, 4th Floor",   status: "ACTIVE" },
    { name: "Physics Lab",        type: "LAB",       capacity: 30,  location: "Block D, 2nd Floor",   status: "OUT_OF_SERVICE" },
    { name: "Meeting Room 01",    type: "ROOM",      capacity: 8,   location: "Block A, 2nd Floor",   status: "ACTIVE" },
    { name: "Meeting Room 02",    type: "ROOM",      capacity: 12,  location: "Block A, 3rd Floor",   status: "ACTIVE" },
    { name: "Projector (PJ-001)", type: "EQUIPMENT", capacity: 1,   location: "Store Room A",         status: "ACTIVE" },
    { name: "Projector (PJ-002)", type: "EQUIPMENT", capacity: 1,   location: "Store Room A",         status: "ACTIVE" },
  ];

  for (const r of resources) {
    await db.collection("resources").add({ ...r, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log(`✅ Seeded ${resources.length} resources`);

  // ─── FETCH USER UIDs ────────────────────────────────────────
  const usersSnap = await db.collection("users").get();
  const userDocs = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const adminUser    = userDocs.find(u => u.role === "ADMIN")       || userDocs[0];
  const regularUser  = userDocs.find(u => u.role === "USER")        || userDocs[0];
  const techUser     = userDocs.find(u => u.role === "TECHNICIAN")  || userDocs[0];

  console.log(`   Admin UID:       ${adminUser?.id}`);
  console.log(`   Regular user UID: ${regularUser?.id}`);
  console.log(`   Technician UID:  ${techUser?.id}`);

  // ─── BOOKINGS ────────────────────────────────────────────────
  const now = new Date();
  const hr = (h) => new Date(now.getTime() + h * 3600000);

  const bookings = [
    { userId: regularUser?.id,  resourceId: "Lecture Hall B1",  purpose: "Study Group Session",    attendeeCount: 20, status: "APPROVED",  startTime: hr(2),   endTime: hr(4)   },
    { userId: regularUser?.id,  resourceId: "Computer Lab 01",  purpose: "Project Development",    attendeeCount: 15, status: "PENDING",   startTime: hr(5),   endTime: hr(7)   },
    { userId: adminUser?.id,    resourceId: "Meeting Room 01",  purpose: "Staff Meeting",           attendeeCount: 8,  status: "APPROVED",  startTime: hr(24),  endTime: hr(25)  },
    { userId: regularUser?.id,  resourceId: "Main Auditorium",  purpose: "Society Annual Event",   attendeeCount: 200, status: "PENDING",  startTime: hr(48),  endTime: hr(51)  },
    { userId: regularUser?.id,  resourceId: "Meeting Room 02",  purpose: "Thesis Discussion",      attendeeCount: 4,  status: "REJECTED",  startTime: hr(-24), endTime: hr(-22), rejectionReason: "Conflicting reservation" },
  ];

  for (const b of bookings) {
    await db.collection("bookings").add({ ...b, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log(`✅ Seeded ${bookings.length} bookings`);

  // ─── TICKETS ─────────────────────────────────────────────────
  const sla = (h) => new Date(now.getTime() + h * 3600000);

  const tickets = [
    {
      title: "Projector not working in Hall B1",
      description: "The ceiling projector in Lecture Hall B1 fails to display output. Tried multiple HDMI cables.",
      priority: "HIGH",   status: "OPEN",        reporterId: regularUser?.id, resourceId: "Lecture Hall B1",
      technicianId: null, slaDeadline: sla(24),  imageUrls: [],
    },
    {
      title: "Air conditioning leak in Meeting Room 01",
      description: "Water dripping from the AC unit. Floor is wet and poses a slip hazard.",
      priority: "URGENT", status: "IN_PROGRESS", reporterId: regularUser?.id, resourceId: "Meeting Room 01",
      technicianId: techUser?.id, slaDeadline: sla(4),  imageUrls: [],
    },
    {
      title: "Computers slow and crashing in Lab 02",
      description: "Multiple PCs freezing during use. Seems like a RAM or software issue.",
      priority: "MEDIUM", status: "OPEN",        reporterId: regularUser?.id, resourceId: "Computer Lab 02",
      technicianId: null, slaDeadline: sla(72),  imageUrls: [],
    },
    {
      title: "Broken window latch in Lecture Hall B2",
      description: "The window cannot be locked properly. Security risk.",
      priority: "LOW",    status: "RESOLVED",    reporterId: adminUser?.id,   resourceId: "Lecture Hall B2",
      technicianId: techUser?.id, slaDeadline: sla(-24), imageUrls: [],
    },
    {
      title: "Network switch down — Physics Lab",
      description: "No internet connectivity in Physics Lab. Switch appears to be powered off but not responding.",
      priority: "HIGH",   status: "OPEN",        reporterId: regularUser?.id, resourceId: "Physics Lab",
      technicianId: null, slaDeadline: sla(-2),  imageUrls: [],
    },
  ];

  for (const t of tickets) {
    await db.collection("tickets").add({ ...t, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log(`✅ Seeded ${tickets.length} tickets`);

  // ─── NOTIFICATIONS ────────────────────────────────────────────
  const notifs = [
    { userId: adminUser?.id,   message: "📅 New booking request for Main Auditorium.",   type: "INFO",    readStatus: false, link: "/admin/bookings" },
    { userId: adminUser?.id,   message: "🎫 New ticket: Projector not working in Hall B1.", type: "INFO", readStatus: false, link: "/admin/tickets"  },
    { userId: regularUser?.id, message: "✅ Your booking for Lecture Hall B1 was approved!", type: "SUCCESS", readStatus: false, link: "/user/bookings" },
    { userId: regularUser?.id, message: "❌ Your booking for Meeting Room 02 was rejected. Reason: Conflicting reservation", type: "ALERT", readStatus: false, link: "/user/bookings" },
    { userId: techUser?.id,    message: "🛠️ A new ticket has been assigned to you: AC leak in Meeting Room 01.", type: "INFO", readStatus: false, link: "/tech/tickets" },
  ];

  for (const n of notifs) {
    await db.collection("notifications").add({ ...n, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log(`✅ Seeded ${notifs.length} notifications\n`);

  console.log("🎉 All demo data seeded successfully!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
