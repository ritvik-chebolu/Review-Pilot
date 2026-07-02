import { createServerFn } from "@tanstack/react-start";
import { teamDbExec } from "./team-db";
import { v4 as uuidv4 } from "uuid";

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  location: string;
  brand_voice: string;
  signature_style: string;
  custom_instructions: string;
  created_at: string;
}

export const getBusiness = createServerFn({ method: "GET" })
  .validator((d: unknown) => d as { userId: string })
  .handler(async ({ data }): Promise<Business | null> => {
    const escapedUserId = JSON.stringify(data.userId);
    const result = teamDbExec(
      `SELECT id, user_id, business_name, business_type, location, brand_voice, signature_style, custom_instructions, created_at FROM businesses WHERE user_id = ${escapedUserId} ORDER BY created_at DESC LIMIT 1`
    ) as Record<string, unknown>[];
    if (!result || result.length === 0) return null;
    return result[0] as unknown as Business;
  });

export const upsertBusiness = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    d as {
      userId: string;
      businessId?: string;
      business_name: string;
      business_type: string;
      location: string;
      brand_voice: string;
      signature_style: string;
      custom_instructions: string;
    }
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string; id?: string }> => {
    const escapedUserId = JSON.stringify(data.userId);
    const escapedName = JSON.stringify(data.business_name.trim());
    const escapedType = JSON.stringify(data.business_type);
    const escapedLocation = JSON.stringify(data.location);
    const escapedVoice = JSON.stringify(data.brand_voice);
    const escapedStyle = JSON.stringify(data.signature_style);
    const escapedInstructions = JSON.stringify(data.custom_instructions);

    if (data.businessId) {
      // Update existing business
      const escapedId = JSON.stringify(data.businessId);
      // Verify ownership
      const check = teamDbExec(
        `SELECT id FROM businesses WHERE id = ${escapedId} AND user_id = ${escapedUserId}`
      ) as { id: string }[];
      if (!check || check.length === 0) {
        return { ok: false, error: "Business not found or access denied" };
      }
      teamDbExec(
        `UPDATE businesses SET business_name = ${escapedName}, business_type = ${escapedType}, location = ${escapedLocation}, brand_voice = ${escapedVoice}, signature_style = ${escapedStyle}, custom_instructions = ${escapedInstructions} WHERE id = ${escapedId}`
      );
      return { ok: true, id: data.businessId };
    } else {
      // Create new business
      const id = uuidv4();
      const escapedId = JSON.stringify(id);
      teamDbExec(
        `INSERT INTO businesses (id, user_id, business_name, business_type, location, brand_voice, signature_style, custom_instructions) VALUES (${escapedId}, ${escapedUserId}, ${escapedName}, ${escapedType}, ${escapedLocation}, ${escapedVoice}, ${escapedStyle}, ${escapedInstructions})`
      );
      return { ok: true, id };
    }
  });