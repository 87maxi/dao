"use server";

import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

/**
 * Server-side date formatting function
 * Used for consistent server/client rendering
 */
export function formatServerDate(date: Date): string {
  try {
    return format(date, 'MMM d, yyyy h:mm a', { locale: enUS });
  } catch {
    // Fallback if date-fns fails
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
