import { redirect } from "next/navigation";

export default function ApplicationIndexPage() {
  redirect("/app/dashboard");
}
