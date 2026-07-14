import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
        },
        passwordHash: {
            type: String,
            required: false // Optional for Google Auth users
        },
        googleId: {
            type: String
        },
        provider: {
            type: String,
            enum: ["local", "google"],
            default: "local"
        },
        avatar: {
            type: String
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret) => {
                delete ret.passwordHash;
                delete ret.__v;
                return ret;
            }
        }
    }
);

export const User = mongoose.model("User", userSchema);
