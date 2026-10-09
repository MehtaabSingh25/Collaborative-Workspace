import { Schema, model, Types } from "mongoose";

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface ITask {
  workspace: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: Types.ObjectId;
  dueDate?: Date;
  createdBy: Types.ObjectId;
}

const taskSchema = new Schema<ITask>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.TODO },
    priority: { type: String, enum: Object.values(TaskPriority), default: TaskPriority.MEDIUM },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    dueDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

taskSchema.index({ workspace: 1, status: 1, createdAt: -1 });

const Task = model<ITask>("Task", taskSchema);
export default Task;
