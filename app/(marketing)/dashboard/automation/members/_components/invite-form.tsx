"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui-v2/button";
import { inviteMemberAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending..." : "Send Invitation"}
    </Button>
  );
}

export function InviteForm() {
  const [email, setEmail] = useState("");

  async function handleSubmit(formData: FormData) {
    try {
      await inviteMemberAction(formData);
      toast.success("Invitation sent successfully");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Invite Member
        </CardTitle>
        <CardDescription>
          Invite a client to your agency. They will receive an email to join your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="client@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
