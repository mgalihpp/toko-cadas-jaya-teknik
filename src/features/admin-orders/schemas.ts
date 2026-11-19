import { z } from "zod";

export const rejectNoteSchema = z
  .string()
  .trim()
  .min(3, "Catatan minimal 3 huruf")
  .max(300, "Catatan maksimal 300 huruf");

export const cancelNoteSchema = z.string().trim().max(300, "Catatan maksimal 300 huruf");
