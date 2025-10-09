"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  topic: z.string().min(2),
  message: z.string().min(10)
});

type FormValues = z.infer<typeof schema>;

export function ContactForm({ labels }: { labels: { name: string; email: string; topic: string; message: string; submit: string; success: string; error: string } }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus("success");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-label="Contact form">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{labels.name}</Label>
          <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{labels.email}</Label>
          <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="topic">{labels.topic}</Label>
        <Input id="topic" {...register("topic")} aria-invalid={!!errors.topic} />
        {errors.topic && <p className="text-xs text-danger">{errors.topic.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{labels.message}</Label>
        <Textarea id="message" rows={5} {...register("message")} aria-invalid={!!errors.message} />
        {errors.message && <p className="text-xs text-danger">{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? "..." : labels.submit}
      </Button>
      {status === "success" && <p className="text-sm text-success">{labels.success}</p>}
      {status === "error" && <p className="text-sm text-danger">{labels.error}</p>}
    </form>
  );
}
