/**
 * Dados estáticos de Path of Exile.
 * Camada isolada para, no futuro, ser substituída por chamadas à API oficial do jogo
 * (ver `PoeProvider`), sem tocar nos componentes.
 */
export const CLASSES: Record<string, string[]> = {
  Marauder: ['Juggernaut', 'Berserker', 'Chieftain'],
  Duelist: ['Slayer', 'Gladiator', 'Champion'],
  Ranger: ['Deadeye', 'Raider', 'Pathfinder'],
  Shadow: ['Assassin', 'Saboteur', 'Trickster'],
  Witch: ['Necromancer', 'Occultist', 'Elementalist'],
  Templar: ['Inquisitor', 'Hierophant', 'Guardian'],
  Scion: ['Ascendant'],
};

export interface CharacterSnapshot {
  name: string;
  class: string;
  level: number;
  playedSeconds?: number;
}

/** Contrato para uma futura integração com a API oficial do PoE. */
export interface PoeProvider {
  fetchCharacter(account: string, character: string): Promise<CharacterSnapshot | null>;
}

/** Implementação atual: sem API oficial; os dados vêm das evidências validadas. */
export const manualProvider: PoeProvider = {
  async fetchCharacter() {
    return null;
  },
};
