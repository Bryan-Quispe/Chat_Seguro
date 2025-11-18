#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Room from '../src/models/Room.js';
import { hmacPin, encryptPin } from '../src/utils/pinCrypto.js';
import { connectDB } from '../src/config/db.js';

dotenv.config();

async function migrate() {
  await connectDB();
  console.log('Connected to DB');

  const rooms = await Room.find({ $or: [ { pin: { $exists: true } }, { pinHash: { $exists: false } } ] });
  console.log(`Found ${rooms.length} rooms to check`);

  for (const r of rooms) {
    try {
      if (r.pinHash && r.pinEncrypted) {
        console.log(`Skipping ${r._id} (already migrated)`);
        continue;
      }

      const plainPin = r.pin || r.pinPlain || null;
      if (!plainPin) {
        console.warn(`Room ${r._id} has no plain PIN, skipping`);
        continue;
      }

      const pinHash = hmacPin(plainPin);
      const pinEncrypted = encryptPin(plainPin);

      r.pinHash = pinHash;
      r.pinEncrypted = pinEncrypted;
      // remove old plain pin field if exists
      r.pin = undefined;

      await r.save();
      console.log(`Migrated room ${r._id}`);
    } catch (err) {
      console.error('Error migrating room', r._id, err.message);
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
