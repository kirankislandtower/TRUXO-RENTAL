// The public contact form stores phone and address inside `equipment_required`
// as "[Phone: …] [Address: …]\n\n<message>". This is the one place that knows
// how to take that apart again (used by the admin UI and the approve flow).
const CONTACT_PREFIX = /^\[Phone: (.*?)\] \[Address: (.*?)\]\n\n([\s\S]*)$/;

export function splitContactRequest(equipmentRequired?: string): {
  phone?: string;
  address?: string;
  message: string;
} {
  const match = equipmentRequired?.match(CONTACT_PREFIX);
  if (!match) return { message: equipmentRequired ?? "" };
  return { phone: match[1], address: match[2], message: match[3] };
}

export function parseContactRequest<T extends { equipment_required?: string }>(
  request: T,
): T & { phone?: string; address?: string } {
  const { phone, address, message } = splitContactRequest(request.equipment_required);
  if (phone === undefined && address === undefined) return request;
  return { ...request, phone, address, equipment_required: message };
}
