/**
 * Dates des promos, partagées par la configuration (au build) et le navigateur (compte à rebours).
 * Une promo « jusqu'au 2027-02-08 » reste valable toute cette journée, heure locale du visiteur.
 */

/** Fin du dernier jour de validité, heure locale. */
export const promoEnd = (until: string): Date => new Date(`${until}T23:59:59`);

/** Jours calendaires entre aujourd'hui et le dernier jour : 0 le dernier jour, négatif une fois passé. */
export function daysUntil(until: string, now: Date = new Date()): number {
  const [y, m, d] = until.split('-').map(Number);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000);
}
