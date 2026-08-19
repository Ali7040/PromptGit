import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PromptsService } from './prompts.service';

const mockPrisma = {
  workspace: { findUnique: jest.fn() },
  workspaceMember: { findUnique: jest.fn() },
  prompt: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
};

const WORKSPACE_ID = 'ws-1';
const USER_ID = 'user-1';
const PROMPT_ID = 'prompt-1';

const mockWorkspace = { id: WORKSPACE_ID, ownerId: USER_ID };
const mockMember = { workspaceId: WORKSPACE_ID, userId: USER_ID, role: 'EDITOR' };
const mockPrompt = {
  id: PROMPT_ID,
  workspaceId: WORKSPACE_ID,
  name: 'My Prompt',
  slug: 'my-prompt',
  description: null,
  tags: [],
  isPublic: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PromptsService', () => {
  let service: PromptsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PromptsService(mockPrisma as any);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { name: 'My Prompt', description: 'desc', tags: ['ai'] };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.prompt.findUnique.mockResolvedValue(null);
      mockPrisma.prompt.create.mockResolvedValue(mockPrompt);
    });

    it('creates prompt and returns it', async () => {
      const result = await service.create(WORKSPACE_ID, USER_ID, dto);
      expect(result).toEqual(mockPrompt);
      expect(mockPrisma.prompt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'My Prompt', slug: 'my-prompt' }),
        }),
      );
    });

    it('generates kebab-case slug from name', async () => {
      await service.create(WORKSPACE_ID, USER_ID, { name: 'Hello World Prompt' });
      const call = mockPrisma.prompt.create.mock.calls[0][0];
      expect(call.data.slug).toBe('hello-world-prompt');
    });

    it('appends numeric suffix when slug already exists', async () => {
      mockPrisma.prompt.findUnique.mockResolvedValue({ slug: 'my-prompt' });
      mockPrisma.prompt.findMany.mockResolvedValue([]);
      await service.create(WORKSPACE_ID, USER_ID, dto);
      const call = mockPrisma.prompt.create.mock.calls[0][0];
      expect(call.data.slug).toBe('my-prompt-1');
    });

    it('increments suffix past existing ones', async () => {
      mockPrisma.prompt.findUnique.mockResolvedValue({ slug: 'my-prompt' });
      mockPrisma.prompt.findMany.mockResolvedValue([
        { slug: 'my-prompt-1' },
        { slug: 'my-prompt-2' },
      ]);
      await service.create(WORKSPACE_ID, USER_ID, dto);
      const call = mockPrisma.prompt.create.mock.calls[0][0];
      expect(call.data.slug).toBe('my-prompt-3');
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      await expect(service.create(WORKSPACE_ID, USER_ID, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not a member or owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: WORKSPACE_ID, ownerId: 'other' });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.create(WORKSPACE_ID, USER_ID, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows workspace owner without an explicit member record', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      mockPrisma.prompt.findUnique.mockResolvedValue(null);
      mockPrisma.prompt.create.mockResolvedValue(mockPrompt);
      await expect(service.create(WORKSPACE_ID, USER_ID, dto)).resolves.toBeDefined();
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    const query = { page: 1, limit: 20 };

    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.prompt.findMany.mockResolvedValue([mockPrompt]);
      mockPrisma.prompt.count.mockResolvedValue(1);
    });

    it('returns paginated result', async () => {
      const result = await service.list(WORKSPACE_ID, USER_ID, query);
      expect(result).toMatchObject({ items: [mockPrompt], total: 1, page: 1, limit: 20, pages: 1 });
    });

    it('excludes soft-deleted prompts', async () => {
      await service.list(WORKSPACE_ID, USER_ID, query);
      const whereArg = mockPrisma.prompt.findMany.mock.calls[0][0].where;
      expect(whereArg).toMatchObject({ deletedAt: null });
    });

    it('applies correct skip for page 2', async () => {
      await service.list(WORKSPACE_ID, USER_ID, { page: 2, limit: 10 });
      const args = mockPrisma.prompt.findMany.mock.calls[0][0];
      expect(args.skip).toBe(10);
      expect(args.take).toBe(10);
    });

    it('calculates pages correctly', async () => {
      mockPrisma.prompt.count.mockResolvedValue(45);
      const result = await service.list(WORKSPACE_ID, USER_ID, { page: 1, limit: 20 });
      expect(result.pages).toBe(3);
    });

    it('throws ForbiddenException for non-member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: WORKSPACE_ID, ownerId: 'other' });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.list(WORKSPACE_ID, USER_ID, query)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns prompt with latest version', async () => {
      const promptWithVersion = { ...mockPrompt, versions: [] };
      mockPrisma.prompt.findFirst.mockResolvedValue(promptWithVersion);
      const result = await service.findOne(PROMPT_ID);
      expect(result).toEqual(promptWithVersion);
    });

    it('queries with deletedAt null to exclude deleted', async () => {
      mockPrisma.prompt.findFirst.mockResolvedValue(mockPrompt);
      await service.findOne(PROMPT_ID);
      const args = mockPrisma.prompt.findFirst.mock.calls[0][0];
      expect(args.where).toMatchObject({ deletedAt: null });
    });

    it('throws NotFoundException when prompt does not exist', async () => {
      mockPrisma.prompt.findFirst.mockResolvedValue(null);
      await expect(service.findOne(PROMPT_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a deleted prompt', async () => {
      mockPrisma.prompt.findFirst.mockResolvedValue(null);
      await expect(service.findOne(PROMPT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── softDelete ───────────────────────────────────────────────────────────

  describe('softDelete', () => {
    const promptWithWorkspace = {
      ...mockPrompt,
      workspace: { id: WORKSPACE_ID },
    };

    beforeEach(() => {
      mockPrisma.prompt.findFirst.mockResolvedValue(promptWithWorkspace);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.prompt.update.mockResolvedValue({ ...mockPrompt, deletedAt: new Date() });
    });

    it('sets deletedAt on the prompt', async () => {
      await service.softDelete(PROMPT_ID, USER_ID);
      expect(mockPrisma.prompt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PROMPT_ID },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });

    it('returns the updated prompt', async () => {
      const result = await service.softDelete(PROMPT_ID, USER_ID);
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when prompt does not exist', async () => {
      mockPrisma.prompt.findFirst.mockResolvedValue(null);
      await expect(service.softDelete(PROMPT_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not a member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({ id: WORKSPACE_ID, ownerId: 'other' });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(service.softDelete(PROMPT_ID, USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('does not update an already-deleted prompt', async () => {
      mockPrisma.prompt.findFirst.mockResolvedValue(null);
      await expect(service.softDelete(PROMPT_ID, USER_ID)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.prompt.update).not.toHaveBeenCalled();
    });
  });

  // ─── slug generation (private, tested via create) ─────────────────────────

  describe('slug generation edge cases', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.prompt.findUnique.mockResolvedValue(null);
      mockPrisma.prompt.create.mockResolvedValue(mockPrompt);
    });

    it.each([
      ['  Hello World  ', 'hello-world'],
      ['Hello---World', 'hello-world'],
      ['UPPERCASE NAME', 'uppercase-name'],
      ['special!@#chars', 'special-chars'],
      ['multiple   spaces', 'multiple-spaces'],
    ])('slugifies "%s" → "%s"', async (name, expectedSlug) => {
      await service.create(WORKSPACE_ID, USER_ID, { name });
      const call = mockPrisma.prompt.create.mock.calls[0][0];
      expect(call.data.slug).toBe(expectedSlug);
    });
  });
});
