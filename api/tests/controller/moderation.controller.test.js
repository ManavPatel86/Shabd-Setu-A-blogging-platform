// tests/moderation.controller.test.js

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Create mock functions
const mockModerateBlog = jest.fn();
const mockModerateComment = jest.fn();

// Use unstable_mockModule for ESM
jest.unstable_mockModule('../../utils/moderation.js', () => ({
  moderateBlog: mockModerateBlog,
  moderateComment: mockModerateComment,
}));

// Import controller AFTER mock is set up
const { moderateBlog, moderateComment } = await import('../../controllers/moderation.controller.js');

// Helper to create a mock Express res object
const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('moderation.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- moderateBlog ----------

  test('moderateBlog returns 400 if content is missing', async () => {
    const req = { body: {} };
    const res = createMockRes();

    await moderateBlog(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Content is required.' });
    expect(mockModerateBlog).not.toHaveBeenCalled();
  });

  test('moderateBlog calls checkBlogModeration and returns result on success', async () => {
    const fakeResult = {
      safe: true,
      badLines: [],
      suggestions: [],
    };

    mockModerateBlog.mockResolvedValueOnce(fakeResult);

    const req = { body: { content: 'Test blog content' } };
    const res = createMockRes();

    await moderateBlog(req, res);

    // Default status is 200 if not explicitly set
    expect(mockModerateBlog).toHaveBeenCalledWith('Test blog content');
    expect(res.status).not.toHaveBeenCalled(); // controller doesn't set status explicitly
    expect(res.json).toHaveBeenCalledWith(fakeResult);
  });

  test('moderateBlog returns 500 if checkBlogModeration throws', async () => {
    mockModerateBlog.mockRejectedValueOnce(new Error('Test error'));

    const req = { body: { content: 'Bad content' } };
    const res = createMockRes();

    await moderateBlog(req, res);

    expect(mockModerateBlog).toHaveBeenCalledWith('Bad content');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Moderation failed.' });
  });

  // ---------- moderateComment ----------

  test('moderateComment returns 400 if text is missing', async () => {
    const req = { body: {} };
    const res = createMockRes();

    await moderateComment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Text is required.' });
    expect(mockModerateComment).not.toHaveBeenCalled();
  });

  test('moderateComment calls checkCommentModeration and returns result on success', async () => {
    const fakeResult = {
      safe: false,
      badLines: [1],
      suggestions: ['Remove abusive language'],
    };

    mockModerateComment.mockResolvedValueOnce(fakeResult);

    const req = { body: { text: 'Some comment' } };
    const res = createMockRes();

    await moderateComment(req, res);

    expect(mockModerateComment).toHaveBeenCalledWith('Some comment');
    expect(res.status).not.toHaveBeenCalled(); // default 200
    expect(res.json).toHaveBeenCalledWith(fakeResult);
  });

  test('moderateComment returns 500 if checkCommentModeration throws', async () => {
    mockModerateComment.mockRejectedValueOnce(new Error('Test error'));

    const req = { body: { text: 'Bad comment' } };
    const res = createMockRes();

    await moderateComment(req, res);

    expect(mockModerateComment).toHaveBeenCalledWith('Bad comment');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Moderation failed.' });
  });
});
