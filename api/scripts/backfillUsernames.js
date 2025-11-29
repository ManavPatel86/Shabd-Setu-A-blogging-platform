import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import { generateUsernameSuggestion, isValidUsername, normalizeUsername } from "../utils/username.js";

dotenv.config();

const run = async () => {
    try {
        const connectionString = process.env.MONGODB_CONN;
        if (!connectionString) {
            console.error("MONGODB_CONN is not set in your environment.");
            process.exit(1);
        }

        await mongoose.connect(connectionString, {
            dbName: process.env.MONGODB_DB || "Shabd-Setu",
        });

        const filter = {
            $or: [
                { username: { $exists: false } },
                { username: null },
                { username: "" },
            ],
        };

        const cursor = User.find(filter).cursor();
        let processed = 0;

        for (let user = await cursor.next(); user != null; user = await cursor.next()) {
            if (user.username && isValidUsername(normalizeUsername(user.username))) {
                continue;
            }

            const seed = user.name || user.email || user._id?.toString() || "user";
            user.username = await generateUsernameSuggestion(seed);
            await user.save();
            processed += 1;
            if (processed % 50 === 0) {
                console.log(`✅ Processed ${processed} users so far...`);
            }
        }

        console.log(`🎉 Backfilled usernames for ${processed} user(s).`);
    } catch (error) {
        console.error("❌ Failed to backfill usernames:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close().catch(() => {});
    }
};

run();
