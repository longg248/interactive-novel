import type { StoryNode, ScriptedParagraph, Choice, SceneData, GameState, NodeTransition } from '@/types';

class StoryScript {
  private nodes: Map<string, StoryNode> = new Map();
  private currentNodeId: string | null = null;
  private loaded = false;

  async loadAllNodes(): Promise<void> {
    if (this.loaded) return;

    try {
      const indexResponse = await fetch('/data/story/nodes/index.json');
      const index: string[] = await indexResponse.json();

      await Promise.all(
        index.map(async (nodeId) => {
          const response = await fetch(`/data/story/nodes/${nodeId}.json`);
          if (response.ok) {
            const node: StoryNode = await response.json();
            this.nodes.set(nodeId, node);
          }
        })
      );

      this.loaded = true;
      console.log(`Loaded ${this.nodes.size} story nodes`);
    } catch (error) {
      console.error('Failed to load story nodes:', error);
    }
  }

  getNode(nodeId: string): StoryNode | undefined {
    return this.nodes.get(nodeId);
  }

  getCurrentNode(): StoryNode | undefined {
    return this.currentNodeId ? this.nodes.get(this.currentNodeId) : undefined;
  }

  setCurrentNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.currentNodeId = nodeId;
      return true;
    }
    return false;
  }

  getAvailableTransitions(gameState: GameState): Array<{ node: StoryNode; transition: NodeTransition }> {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return [];

    return currentNode.transitions
      .map(t => {
        const targetNode = this.nodes.get(t.targetNodeId);
        return targetNode ? { node: targetNode, transition: t } : null;
      })
      .filter((t): t is { node: StoryNode; transition: NodeTransition } =>
        t !== null && this.evaluateConditions(t.transition.conditions, gameState)
      );
  }

  private evaluateConditions(conditions: NodeTransition['conditions'], gameState: GameState): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(c => {
      let value: unknown;
      switch (c.type) {
        case 'flag': value = gameState.flags[c.key]; break;
        case 'variable': value = gameState.variables[c.key]; break;
        case 'relationship': value = gameState.relationships[c.key]; break;
        case 'inventory': value = gameState.inventory.some(i => i.id === c.key); break;
        default: return false;
      }
      return this.compareValues(value, c.operator, c.value);
    });
  }

  private compareValues(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'gt': return Number(actual) > Number(expected);
      case 'lt': return Number(actual) < Number(expected);
      case 'gte': return Number(actual) >= Number(expected);
      case 'lte': return Number(actual) <= Number(expected);
      case 'contains': return String(actual).includes(String(expected));
      default: return false;
    }
  }

  getChoicesFromNode(node: StoryNode): Choice[] {
    return node.transitions.map(t => ({
      id: t.choiceId,
      text: this.getChoiceText(t.choiceId),
      conditions: t.conditions,
    }));
  }

  private getChoiceText(choiceId: string): string {
    const choiceTexts: Record<string, string> = {
      'introduce_self': 'Giới thiệu bản thân: "Tên tôi là..."',
      'ask_question': 'Hỏi: "Lão Tổ là ai? Tại sao lão ở đây?"',
      'stay_silent': 'Cúi đầu im lặng, chờ lệnh',
      'accept': 'Đồng ý nhập môn',
      'refuse': 'Từ chối, muốn về làng',
      'explore': 'Khám phá xung quanh',
      'train': 'Bắt đầu tu luyện ngay',
      'talk_lan': 'Tìm Tiểu Lan nói chuyện',
      'train_sword': 'Tập kiếm thuật',
      'meditate': 'Tĩnh tọa tu luyện',
    };
    return choiceTexts[choiceId] || choiceId;
  }

  getParagraphs(node: StoryNode): ScriptedParagraph[] {
    return node.content.paragraphs;
  }

  getSceneData(node: StoryNode): SceneData {
    return node.sceneData;
  }

  isAIBridge(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    return node?.type === 'ai_bridge';
  }

  getAllNodes(): StoryNode[] {
    return Array.from(this.nodes.values());
  }
}

export const storyScript = new StoryScript();