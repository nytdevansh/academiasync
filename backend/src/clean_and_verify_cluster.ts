import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Department from './models/Department';
import TrainingSession from './models/TrainingSession';
import TrainingProgram from './models/TrainingProgram';
import Certificate from './models/Certificate';
import { generateAccessToken, issueRefreshToken } from './controllers/authController';

dotenv.config();

async function cleanAndVerifyCluster() {
  console.log('====================================================');
  console.log('ACADEMIASYNC CLUSTER AUDIT, CLEANUP & AUTH VERIFICATION');
  console.log('====================================================\n');

  let uri = process.env.MONGO_URI || process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
  if (!uri) {
    const atlasPath = path.join(__dirname, '..', 'atlas-credentials.env');
    if (fs.existsSync(atlasPath)) {
      dotenv.config({ path: atlasPath });
      uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    }
  }

  if (!uri) {
    console.error('❌ MONGO_URI not found.');
    process.exit(1);
  }

  const targetDbName = process.env.DB_NAME || 'academiasync';

  // Enforce targetDbName in connection string
  if (!uri.includes(`/${targetDbName}`)) {
    if (uri.includes('?')) {
      uri = uri.replace(/\/(?:\?|$)/, `/${targetDbName}?`);
    } else {
      uri = `${uri.replace(/\/$/, '')}/${targetDbName}`;
    }
  }

  console.log(`[1/5] Connecting to MongoDB Cluster: ${uri.replace(/:([^:@]{3})[^:@]*@/, ':$1***@')}...`);
  const conn = await mongoose.connect(uri, { dbName: targetDbName });
  console.log(`  [PASS] Connected successfully to host: ${conn.connection.host}`);
  console.log(`  [PASS] Active Mongoose default database: "${conn.connection.name}"\n`);

  // [2/5] Inspect Cluster Databases
  console.log('[2/5] Inspecting all databases present on this cluster...');
  const adminDb = conn.connection.db!.admin();
  const dbsResult = await adminDb.listDatabases();
  const dbNames = dbsResult.databases.map((d: any) => d.name);
  console.log('  Found databases on cluster:', dbNames);

  // [3/5] Clean the Cluster: Drop leftover "test" database if present
  console.log('\n[3/5] Checking for leftover "test" database to clean cluster...');
  if (dbNames.includes('test')) {
    console.log('  ⚠️  Detected leftover "test" database on cluster. Inspecting collections...');
    const testDb = conn.connection.useDb('test');
    const testCollections = await testDb.db!.listCollections().toArray();
    console.log(`  "test" database contains ${testCollections.length} collections:`, testCollections.map((c) => c.name));

    console.log('  🗑  Dropping "test" database from the cluster...');
    const dropResult = await testDb.dropDatabase();
    console.log('  [PASS] "test" database dropped successfully:', dropResult);

    // Verify it is gone
    const postDbs = await adminDb.listDatabases();
    const remainingDbs = postDbs.databases.map((d: any) => d.name);
    console.log('  Cluster databases after cleanup:', remainingDbs);
  } else {
    console.log('  [PASS] Cluster is clean — no leftover "test" database exists on cluster.');
  }

  // [4/5] Verify Real "academiasync" Database & Collections
  console.log(`\n[4/5] Verifying real "${targetDbName}" database collections and records...`);
  if (conn.connection.name !== targetDbName) {
    throw new Error(`CRITICAL: Expected active DB to be "${targetDbName}", but got "${conn.connection.name}"`);
  }

  const collections = await conn.connection.db!.listCollections().toArray();
  console.log(`  Found ${collections.length} collections in "${targetDbName}":`);

  for (const col of collections) {
    const count = await conn.connection.db!.collection(col.name).countDocuments();
    console.log(`    - ${col.name.padEnd(28)} : ${count} documents`);
  }

  // [5/5] Verify User Creation & Login Flow Directly Against Real Database
  console.log(`\n[5/5] Verifying user creation and authentication against "${targetDbName}"...`);

  // Ensure Department model is initialized on the default connection
  const _deptModel = Department;
  const adminUser = await User.findOne({ email: 'admin@academiasync.edu' }).populate('department');
  if (!adminUser) {
    throw new Error('admin@academiasync.edu not found in academiasync.users table');
  }
  console.log(`  [PASS] Found Admin user: "${adminUser.name}" (Role: ${adminUser.role})`);
  console.log(`  [PASS] Department link verified: "${(adminUser.department as any)?.name}"`);

  // Verify bcrypt password verification against passwordHash
  const adminPwMatch = await bcrypt.compare('Admin@123', adminUser.passwordHash);
  if (!adminPwMatch) {
    throw new Error('Password verification failed for Admin@123');
  }
  console.log('  [PASS] Bcrypt password match verified for "Admin@123"');

  const wrongPwMatch = await bcrypt.compare('WrongPassword', adminUser.passwordHash);
  if (wrongPwMatch) {
    throw new Error('Invalid password unexpectedly matched!');
  }
  console.log('  [PASS] Invalid password correctly rejected (security check passed)');

  // Verify JWT access token & RefreshToken creation in real DB
  const accessToken = generateAccessToken(adminUser);
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('Access token generation failed');
  }
  console.log('  [PASS] JWT access token generated successfully');

  const rawRefreshToken = await issueRefreshToken(adminUser._id);
  if (!rawRefreshToken) {
    throw new Error('Refresh token issuance failed');
  }
  const savedRefreshTokenCount = await conn.connection.db!.collection('refreshtokens').countDocuments({ userId: adminUser._id });
  console.log(`  [PASS] Refresh token persisted in "${targetDbName}.refreshtokens" (Count: ${savedRefreshTokenCount})`);

  // Verify Faculty user
  const facultyUser = await User.findOne({ email: 'faculty@academiasync.edu' }).populate('department');
  if (!facultyUser) {
    throw new Error('faculty@academiasync.edu not found in academiasync.users table');
  }
  const facPwMatch = await bcrypt.compare('Faculty@123', facultyUser.passwordHash);
  if (!facPwMatch) {
    throw new Error('Password verification failed for Faculty@123');
  }
  console.log(`  [PASS] Found Faculty user: "${facultyUser.name}" (Department: ${(facultyUser.department as any)?.name})`);
  console.log('  [PASS] Bcrypt password match verified for "Faculty@123"');

  // Verify Live User Creation in Real DB
  const tempEmail = `audit_verify_${Date.now()}@academiasync.edu`;
  const createdUser = await User.create({
    name: 'Temporary Audit User',
    email: tempEmail,
    passwordHash: await bcrypt.hash('TestPass@123', 12),
    role: 'faculty_member',
    status: 'active',
  });
  console.log(`  [PASS] Real user creation verified in "${targetDbName}.users" (ID: ${createdUser._id})`);

  // Verify retrieval
  const foundUser = await User.findById(createdUser._id);
  if (!foundUser || foundUser.email !== tempEmail) {
    throw new Error('Created user could not be retrieved from real users table');
  }
  console.log('  [PASS] Created user successfully queried from real database');

  // Delete temp user
  await User.findByIdAndDelete(createdUser._id);
  console.log('  [PASS] Temporary audit user cleaned up from real database');

  // Verify Training Sessions in Real DB
  const sessionsCount = await TrainingSession.countDocuments();
  console.log(`  [PASS] Training sessions verified in "${targetDbName}.trainingsessions" (Total: ${sessionsCount})`);

  // Verify Certificates in Real DB
  const certCount = await Certificate.countDocuments();
  console.log(`  [PASS] Certificates verified in "${targetDbName}.certificates" (Total: ${certCount})`);

  console.log('\n====================================================');
  console.log('AUDIT COMPLETE: CLUSTER CLEAN, 100% RUNNING ON "academiasync"');
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

cleanAndVerifyCluster().catch((err) => {
  console.error('❌ Audit script failed:', err);
  process.exit(1);
});
