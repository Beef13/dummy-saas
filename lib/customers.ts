import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

/** Returns the Stripe customer id for this user, creating the customer on first checkout. */
export async function getOrCreateCustomer(userId: string, email: string | undefined) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.stripe_customer_id) return existing.stripe_customer_id as string;

  const customer = await stripe().customers.create({ email, metadata: { user_id: userId } });
  const { error } = await admin
    .from("customers")
    .insert({ user_id: userId, stripe_customer_id: customer.id });
  if (error) throw new Error(`Could not save customer: ${error.message}`);
  return customer.id;
}

export async function getCustomerId(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.stripe_customer_id as string | undefined) ?? null;
}
