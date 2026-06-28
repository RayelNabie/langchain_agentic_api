import { PlankaHttp } from '#http/planka/routes.js';
import type {
  BoardResponse,
  CreateCardOptions,
  PlankaCard,
  PlankaUser,
  WorkloadEntry,
} from '#planka/types.js';

export class Planka extends PlankaHttp {
  async createCard(
    title: string,
    listId: string,
    options: CreateCardOptions = {},
  ): Promise<string> {
    const { description, acceptanceCriteria, dueDate, assigneeName, boardId } = options;

    const requestBody: Record<string, unknown> = { name: title, type: 'project', position: 0 };
    if (description) requestBody.description = description;
    if (dueDate) requestBody.dueDate = dueDate;

    const { item }: { item: PlankaCard } = await this.post(
      `/api/lists/${listId}/cards`,
      requestBody,
    );

    if (acceptanceCriteria?.length) {
      try {
        const { item: taskList }: { item: { id: string } } = await this.post(
          `/api/cards/${item.id}/task-lists`,
          { name: 'Acceptatiecriteria', position: 0 },
        );
        await Promise.all(
          acceptanceCriteria.map((criterion: string, index: number) =>
            this.post(`/api/task-lists/${taskList.id}/tasks`, {
              name: criterion,
              position: (index + 1) * 16384,
            }),
          ),
        );
      } catch {
        /* kaart aangemaakt, checklist overgeslagen */
      }
    }

    if (assigneeName && boardId) {
      try {
        const boardData: BoardResponse = await this.get(`/api/boards/${boardId}`);

        const boardUser: PlankaUser | undefined = boardData.included.users.find(
          (user: PlankaUser): boolean =>
            user.name.toLowerCase().includes(assigneeName.toLowerCase()),
        );

        if (boardUser) {
          await this.post(`/api/cards/${item.id}/card-memberships`, { userId: boardUser.id });
        }
      } catch {
        /* No one assigned */
      }
    }

    return `Taak "${item.name}" aangemaakt (id: ${item.id})`;
  }

  async getTeamWorkload(boardId: string): Promise<WorkloadEntry[]> {
    const boardData: BoardResponse = await this.get(`/api/boards/${boardId}`);

    const cardMap = new Map(
      boardData.included.cards.map((card: PlankaCard): [string, string] => [card.id, card.name]),
    );

    const workload = new Map<string, { name: string; cards: string[] }>(
      boardData.included.users.map((user: PlankaUser) => [user.id, { name: user.name, cards: [] }]),
    );

    for (const { cardId, userId } of boardData.included.cardMemberships) {
      workload.get(userId)?.cards.push(cardMap.get(cardId) ?? 'Onbekende taak');
    }

    return Array.from(workload.values()).map(({ name, cards }) => ({
      user: name,
      cardCount: cards.length,
      cards,
    }));
  }
}
