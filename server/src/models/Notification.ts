import mongoose, { Schema, Model } from "mongoose";
import { NotificationDocument } from "../types";

const NotificationSchema = new Schema<NotificationDocument>({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["info", "warning", "success", "error"],
    default: "info",
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification: Model<NotificationDocument> =
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);

export default Notification;
