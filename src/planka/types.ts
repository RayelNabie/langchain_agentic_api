export type PlankaCard = { id: string; name: string; description?: string | null };
export type PlankaUser = { id: string; name: string };
export type CardMembership = { cardId: string; userId: string };

export type BoardResponse = {
  item: { id: string; name: string };
  included: {
    cards: PlankaCard[];
    cardMemberships: CardMembership[];
    users: PlankaUser[];
  };
};

export type CreateCardOptions = {
  description?: string;
  acceptanceCriteria?: string[];
  dueDate?: string;
  assigneeName?: string;
  boardId?: string;
};

export type WorkloadEntry = { user: string; cardCount: number; cards: string[] };
