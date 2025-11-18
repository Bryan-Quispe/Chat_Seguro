#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';

dotenv.config();

async function run() {
  await connectDB();
  console.log('Connected to DB');
  const db = mongoose.connection.db;
  const coll = db.collection('rooms');
  try {
    const indexes = await coll.indexes();
    console.log('Existing indexes:', indexes.map(i => i.name));
    // Drop index named 'pin_1' if exists
    if (indexes.some(i => i.name === 'pin_1')) {
      await coll.dropIndex('pin_1');
      console.log('Dropped index pin_1');
    } else {
      console.log('Index pin_1 not found, nothing to do');
    }
  } catch (err) {
    console.error('Error dropping index:', err.message);
  } finally {
    process.exit(0);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
