import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/server/auth";

const f = createUploadthing();

async function requireUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) throw new UploadThingError("Silakan masuk dulu");
  return session.user;
}

export const uploadRouter = {
  productImage: f({
    image: { maxFileSize: "2MB", maxFileCount: 10 },
  })
    .middleware(async ({ req }) => {
      const user = await requireUser(req);
      if (user.role !== "admin") throw new UploadThingError("Akses ditolak");
      return { userId: user.id };
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl, key: file.key })),

  paymentProof: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await requireUser(req);
      return { userId: user.id };
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl, key: file.key })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
