"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { slugify } from "@/lib/slug";
import { useTRPC } from "@/trpc/client";
import { categoryNameSchema } from "../schemas";

export type CategoryDialogState =
  | { mode: "create" }
  | { mode: "edit"; id: string; name: string }
  | null;

export function CategoryDialog({
  state,
  onOpenChange,
}: {
  state: CategoryDialogState;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {state ? (
          <CategoryForm
            key={state.mode === "edit" ? state.id : "create"}
            state={state}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  state,
  onDone,
}: {
  state: NonNullable<CategoryDialogState>;
  onDone: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [name, setName] = useState(state.mode === "edit" ? state.name : "");
  const [error, setError] = useState<string>();

  const options = {
    onSuccess: async () => {
      toast.success(state.mode === "edit" ? "Kategori diperbarui" : "Kategori ditambahkan");
      onDone();
      await Promise.all([
        queryClient.invalidateQueries(trpc.admin.categories.pathFilter()),
        queryClient.invalidateQueries(trpc.admin.products.pathFilter()),
        queryClient.invalidateQueries(trpc.catalog.pathFilter()),
      ]);
    },
    onError: (e: { message: string }) => setError(e.message),
  };
  const create = useMutation(trpc.admin.categories.create.mutationOptions(options));
  const update = useMutation(trpc.admin.categories.update.mutationOptions(options));
  const pending = create.isPending || update.isPending;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = categoryNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    if (state.mode === "edit") update.mutate({ id: state.id, name: parsed.data });
    else create.mutate({ name: parsed.data });
  }

  const slug = slugify(name);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{state.mode === "edit" ? "Ubah Kategori" : "Tambah Kategori"}</DialogTitle>
        <DialogDescription>Tampil di menu dan filter katalog</DialogDescription>
      </DialogHeader>
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="category-name">Nama kategori</FieldLabel>
        <Input
          id="category-name"
          className="h-10"
          placeholder="Contoh: Gergaji Mesin"
          value={name}
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>
            Slug URL: <span className="font-mono text-ink-700">/{slug || "..."}</span>, dibuat otomatis dari nama
          </FieldDescription>
        )}
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            Batal
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner /> : null}
          Simpan
        </Button>
      </DialogFooter>
    </form>
  );
}
