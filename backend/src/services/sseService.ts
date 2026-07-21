import { Response } from 'express';

/**
 * Registre en mémoire des connexions SSE ouvertes par utilisateur. Comme les
 * sessions du chatbot, ne survit pas à un redémarrage/scale horizontal — un
 * choix assumé vu la taille du déploiement (voir chatbot-engine.ts).
 */
const clients: Record<number, Response[]> = {};

export function registerClient(userId: number, res: Response): void {
  if (!clients[userId]) clients[userId] = [];
  clients[userId].push(res);
}

export function unregisterClient(userId: number, res: Response): void {
  if (!clients[userId]) return;
  clients[userId] = clients[userId].filter((r) => r !== res);
  if (clients[userId].length === 0) delete clients[userId];
}

/** Pousse un évènement SSE à toutes les connexions actives d'un utilisateur. */
export function pushToUser(userId: number, event: string, data: unknown): void {
  const conns = clients[userId];
  if (!conns || conns.length === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of conns) {
    res.write(payload);
  }
}
