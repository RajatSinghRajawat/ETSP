import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderRole: { type: String, enum: ['employer', 'candidate'], required: true },
    senderEmail: { type: String, required: true, lowercase: true, trim: true },
    text: { type: String, required: true, trim: true, maxlength: 4000 },
    readByPeer: { type: Boolean, default: false },
    // AI-generated messages (plan auto-reply feature). Auto-replies never
    // trigger further auto-replies — this flag is the loop breaker.
    isAutoReply: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
