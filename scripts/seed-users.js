const admin = require("firebase-admin");
const serviceAccount = require("../backend/firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

const users = [
  {
    email: "dew@pshycolab.com",
    password: "Dew@123",
    displayName: "DewX Code",
    role: "ADMIN",
  },
  {
    email: "user@sliit.lk",
    password: "User@123",
    displayName: "Sumana Dasa",
    role: "USER",
  },
];

async function seedUsers() {
  console.log("🌱 Seeding Firebase users...\n");

  for (const user of users) {
    try {
      // 1. Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true,
      });

      console.log(`✅ Created Auth user: ${user.email} (UID: ${userRecord.uid})`);

      // 2. Set custom claims for role (used by Spring Boot security)
      await auth.setCustomUserClaims(userRecord.uid, { role: user.role });
      console.log(`   🎭 Role set: ${user.role}`);

      // 3. Save profile to Firestore 'users' collection
      await db.collection("users").doc(userRecord.uid).set({
        id: userRecord.uid,
        email: user.email,
        fullName: user.displayName,
        role: user.role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`   💾 Firestore profile saved\n`);
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        console.warn(`⚠️  User ${user.email} already exists — skipping.\n`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, error.message, "\n");
      }
    }
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seedUsers();
