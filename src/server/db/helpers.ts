import { sql } from "drizzle-orm";
import { products } from "./schema";

export const available = sql<number>`(${products.stockPhysical} - ${products.stockLocked})`;

export function likePattern(input: string) {
  return `%${input.replace(/[\\%_]/g, "\\$&")}%`;
}

export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}
