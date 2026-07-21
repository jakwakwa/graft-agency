"use client";
import { Add01Icon, Delete02Icon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui-v2/button";
import { saveBotSettingsAction } from "../actions";

export interface KnowledgeSnippet {
  id: string;
  question: string;
  answer: string;
}

interface BotSettingsFormProps {
  initialData: {
    agentName: string | null;
    greetingMessage: string | null;
    systemPrompt: string;
    widgetPrimaryColour: string | null;
    widgetSecondaryColour: string | null;
    calComUsername: string | null;
    defaultEventSlug: string | null;
    knowledgeBase: KnowledgeSnippet[] | null;
  };
  /** Gated by the Booking Integration add-on — hides the Cal.com booking config when false. */
  bookingEnabled: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      <HugeiconsIcon icon={FloppyDiskIcon} className="mr-2 h-4 w-4" />
      {pending ? "Saving..." : "Save Settings"}
    </Button>
  );
}

export function BotSettingsForm({ initialData, bookingEnabled }: BotSettingsFormProps) {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeSnippet[]>(
    Array.isArray(initialData.knowledgeBase)
      ? initialData.knowledgeBase.map((s, i) => ({
          id: s.id || `snippet-${i}`,
          question: s.question || "",
          answer: s.answer || "",
        }))
      : [],
  );

  const addSnippet = () => {
    setKnowledgeBase([...knowledgeBase, { id: crypto.randomUUID(), question: "", answer: "" }]);
  };

  const removeSnippet = (id: string) => {
    setKnowledgeBase(knowledgeBase.filter((s) => s.id !== id));
  };

  const updateSnippet = (id: string, field: keyof KnowledgeSnippet, value: string) => {
    setKnowledgeBase(
      knowledgeBase.map((s) => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      }),
    );
  };

  async function clientAction(formData: FormData) {
    formData.append("knowledgeBase", JSON.stringify(knowledgeBase));
    try {
      const result = await saveBotSettingsAction(formData);
      if (result.success) {
        toast.success("Saved. Your bot will use these settings on the next conversation.");
      }
    } catch {
      toast.error("Couldn't save. Try again, or refresh and check your connection.");
    }
  }

  return (
    <form action={clientAction} className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Identity & Core Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>How your bot identifies itself to visitors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Bot name</Label>
              <Input
                id="agentName"
                name="agentName"
                defaultValue={initialData.agentName ?? ""}
                placeholder="e.g. Sam, Helper, Graft AI Agent"
                required
              />
              <Typography.Muted>Shown above the chat.</Typography.Muted>
            </div>

            <div className="space-y-2">
              <Label htmlFor="greetingMessage">Greeting</Label>
              <Textarea
                id="greetingMessage"
                name="greetingMessage"
                defaultValue={initialData.greetingMessage ?? ""}
                placeholder="Hello! How can I help you today?"
                required
              />
              <Typography.Muted>The first message your bot says when someone opens chat.</Typography.Muted>
            </div>

            <div className="space-y-2">
              <Label>Brand colours</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Typography.Muted className="text-xs">Primary</Typography.Muted>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <Input
                      id="widgetPrimaryColour"
                      name="widgetPrimaryColour"
                      type="color"
                      defaultValue={initialData.widgetPrimaryColour ?? "#7c3aed"}
                      className="w-12 h-10 p-1 m-0 border-white/50 outline-1 outline-white overflow-hidden rounded-lg"
                    />
                    <Input
                      defaultValue={initialData.widgetPrimaryColour ?? "#7c3aed"}
                      placeholder="#7C3AED"
                      className="font-mono uppercase h-10"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Typography.Muted className="text-xs">Secondary</Typography.Muted>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <Input
                      id="widgetSecondaryColour"
                      name="widgetSecondaryColour"
                      type="color"
                      defaultValue={initialData.widgetSecondaryColour ?? "#1e1b4b"}
                      className="w-12 h-10 p-1 m-0 border-white/50 outline-1 outline-white overflow-hidden rounded-lg"
                    />
                    <Input
                      defaultValue={initialData.widgetSecondaryColour ?? "#1e1b4b"}
                      placeholder="#1E1B4B"
                      className="font-mono uppercase h-10"
                      disabled
                    />
                  </div>
                </div>
              </div>
              <Typography.Muted>
                Primary drives accents and user bubbles; secondary shades the chrome and surfaces.
              </Typography.Muted>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Define your bot's personality and goals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Instructions</Label>
              <Textarea
                id="systemPrompt"
                name="systemPrompt"
                defaultValue={initialData.systemPrompt}
                placeholder="You are a helpful assistant for Graft Today Agency..."
                className="min-h-[200px]"
                required
              />
              <Typography.Muted>
                Tell your bot how to behave — its tone, what it can help with, what to avoid.
              </Typography.Muted>
            </div>
          </CardContent>
        </Card>

        {/* Bookings — gated by the Booking Integration add-on */}
        {bookingEnabled ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Bookings (Cal.com)</CardTitle>
              <CardDescription>Let visitors book meetings directly through chat.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calComUsername">Cal.com username</Label>
                <Input
                  id="calComUsername"
                  name="calComUsername"
                  defaultValue={initialData.calComUsername ?? ""}
                  placeholder="yourname"
                />
                <Typography.Muted>Optional — let visitors book a call directly.</Typography.Muted>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultEventSlug">Booking event</Label>
                <Input
                  id="defaultEventSlug"
                  name="defaultEventSlug"
                  defaultValue={initialData.defaultEventSlug ?? ""}
                  placeholder="15min"
                />
                <Typography.Muted>Optional — Cal.com event type slug.</Typography.Muted>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Bookings (Cal.com)</CardTitle>
              <CardDescription>
                Requires the Booking Integration add-on. Without it your bot captures the visitor&rsquo;s contact
                details and emails them to you to follow up — add the Booking Integration add-on from the Billing page
                to let visitors book meetings directly through chat.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Knowledge Base */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Knowledge snippets</CardTitle>
              <CardDescription>Q&A pairs your bot can pull from to answer questions.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSnippet}>
              <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 mr-2" />
              Add Snippet
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {knowledgeBase.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                No snippets added yet. Add some to help your bot answer specific questions about your business.
              </div>
            )}
            {knowledgeBase.map((snippet) => (
              <div
                key={snippet.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-muted/30 rounded-lg relative group"
              >
                <div className="md:col-span-5 space-y-2">
                  <Label>Question</Label>
                  <Input
                    value={snippet.question}
                    onChange={(e) => updateSnippet(snippet.id, "question", e.target.value)}
                    placeholder="e.g. What are your pricing plans?"
                  />
                </div>
                <div className="md:col-span-6 space-y-2">
                  <Label>Answer</Label>
                  <Textarea
                    value={snippet.answer}
                    onChange={(e) => updateSnippet(snippet.id, "answer", e.target.value)}
                    placeholder="e.g. We have three tiers: Basic ($29), Pro ($99), and Enterprise."
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeSnippet(snippet.id)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-variant/10 md:ml-64 backdrop-blur border-t z-10 flex justify-center md:pl-64">
        <div className="w-full max-w-6xl px-8 flex justify-end">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
