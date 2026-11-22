import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name?: string;
  isEmailVerified: boolean;
  status: "active" | "blocked";
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    name: {
      type: String,
      trim: true
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IUser>("User", userSchema);