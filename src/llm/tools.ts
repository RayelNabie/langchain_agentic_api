import { tool } from '@langchain/core/tools';
import { searchDocuments } from '#rag/retriever.js';
import { Planka } from '#planka/Planka.js';
import type { CreateTaskInput } from '#llm/types.js';
import type { WorkloadEntry } from '#planka/types.js';

const planka = new Planka();
const NO_BOARD = 'Selecteer eerst een bord in de UI voordat je deze actie uitvoert.';

class AgentTools {
  constructor(
    private readonly boardId?: string,
    private readonly listId?: string,
    private readonly autoAssign = false,
  ) {}

  readonly searchProductDocs = tool(
    async ({ query }: { query: string }): Promise<string> =>
      JSON.stringify({ results: await searchDocuments(query, this.boardId) }),
    {
      name: 'search_product_docs',
      description:
        'Doorzoek de productdocumentatie op relevante informatie. Gebruik dit wanneer de gebruiker vragen stelt over het product, de doelgroep, personas, epics, technische architectuur of sprintgeschiedenis.',
      schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Zoekterm of vraag om in de productdocumentatie te zoeken',
          },
        },
        required: ['query'],
      },
    },
  );

  readonly createPlankaTask = tool(
    async ({
      title,
      description,
      acceptanceCriteria,
      dueDate,
      assigneeName,
    }: CreateTaskInput): Promise<string> => {
      if (!this.listId) return 'Selecteer eerst een bord in de UI voordat je deze actie uitvoert.';

      let resolvedAssignee: string | undefined = assigneeName;

      if (!resolvedAssignee && this.autoAssign && this.boardId) {
        const workload: WorkloadEntry[] = await planka.getTeamWorkload(this.boardId);

        if (workload.length > 0) {
          resolvedAssignee = workload.sort((a: WorkloadEntry, b: WorkloadEntry): number => {
            return a.cardCount - b.cardCount;
          })[0]!.user;
        }
      }
      return planka.createCard(title, this.listId, {
        description,
        acceptanceCriteria,
        dueDate,
        assigneeName: resolvedAssignee,
        boardId: this.boardId,
      });
    },
    {
      name: 'create_planka_task',
      description:
        'Maak een nieuwe taak aan op het Kanban-bord in Planka. Gebruik dit wanneer de gebruiker een taak, user story of bug wil registreren, maar OOK wanneer de gebruiker een wijziging, feature of requirement beschrijft zonder expliciet om een taak te vragen.',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Titel in "Als [rol] wil ik [wens] zodat [doel]" formaat',
          },
          description: { type: 'string', description: 'Optionele korte beschrijving' },
          acceptanceCriteria: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Optionele lijst van acceptatiecriteria — aanvinkbare checkboxen op de kaart',
          },
          dueDate: {
            type: 'string',
            description: 'Optionele deadline in ISO 8601 formaat, bijv. "2026-07-15T00:00:00.000Z"',
          },
          assigneeName: {
            type: 'string',
            description: 'Optionele naam van het teamlid om de taak aan toe te wijzen',
          },
        },
        required: ['title'],
      },
    },
  );

  readonly analyzeTeamWorkload = tool(
    async (): Promise<string> => {
      if (!this.boardId) return NO_BOARD;
      const workload: WorkloadEntry[] = await planka.getTeamWorkload(this.boardId);
      if (!workload.length) return 'Er zijn geen taken toegewezen aan teamleden.';

      if (workload.length === 1) {
        const { user, cardCount } = workload[0]!;
        return `Er is maar één teamlid op dit bord: ${user} (${cardCount} taak(en)). Werklastanalyse heeft weinig zin bij één persoon — alle taken gaan sowieso naar ${user}.`;
      }

      const sorted: WorkloadEntry[] = [...workload].sort(
        (a: WorkloadEntry, b: WorkloadEntry): number => b.cardCount - a.cardCount,
      );
      const busiest: WorkloadEntry = sorted[0]!;
      const lightest: WorkloadEntry = sorted[sorted.length - 1]!;

      const lines: string[] = sorted.map(
        ({ user, cardCount, cards }: WorkloadEntry): string =>
          `${user}: ${cardCount} taak(en) — ${cards.join(', ')}`,
      );

      const advice: string =
        lightest.cardCount === 0
          ? `Advies: ${lightest.user} heeft nog geen taken en heeft volledige capaciteit vrij.`
          : busiest.cardCount >= lightest.cardCount * 2
            ? `Advies: ${busiest.user} heeft significant meer werk (${busiest.cardCount} taken) dan ${lightest.user} (${lightest.cardCount} taken). Overweeg nieuwe taken aan ${lightest.user} toe te wijzen.`
            : `Advies: De werklast is redelijk gelijk verdeeld. ${lightest.user} heeft met ${lightest.cardCount} taken de meeste ruimte.`;

      return `Werklastoverzicht:\n${lines.join('\n')}\n\n${advice}`;
    },
    {
      name: 'analyze_team_workload',
      description:
        'Analyseer de werklast van het team op het Kanban-bord. Gebruik dit wanneer de gebruiker wil weten hoe taken verdeeld zijn, wie overbelast is, of wie ruimte heeft voor nieuwe taken.',
      schema: { type: 'object', properties: {} },
    },
  );

  all() {
    return [this.searchProductDocs, this.createPlankaTask, this.analyzeTeamWorkload];
  }
}

export default AgentTools;
