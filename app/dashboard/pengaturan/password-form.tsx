"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { changePasswordAction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Password berhasil diubah.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {[
        ["currentPassword", "Password saat ini", "current-password"],
        ["newPassword", "Password baru (min. 8 karakter)", "new-password"],
        ["confirmPassword", "Konfirmasi password baru", "new-password"],
      ].map(([name, label, ac]) => (
        <div key={name} className="space-y-1.5">
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} name={name} type="password" autoComplete={ac} required />
        </div>
      ))}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Simpan Password
      </Button>
    </form>
  );
}
