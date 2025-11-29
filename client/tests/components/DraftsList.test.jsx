import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DraftsList from '../../src/components/DraftsList';

// Mock dependencies
vi.mock('@/hooks/useFetch');
vi.mock('@/helpers/getEnv');
vi.mock('@/helpers/showToast');
vi.mock('@/components/Loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

const { useFetch } = await import('@/hooks/useFetch');
const { getEnv } = await import('@/helpers/getEnv');
const { showToast } = await import('@/helpers/showToast');

describe('DraftsList', () => {
  const mockUseFetch = vi.mocked(useFetch);
  const mockGetEnv = vi.mocked(getEnv);
  const mockShowToast = vi.mocked(showToast);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnv.mockReturnValue('http://localhost:5000');
    global.fetch = vi.fn();
    global.confirm = vi.fn();
  });

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <DraftsList {...props} />
      </MemoryRouter>
    );
  };

  it('renders loading state', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: false,
      error: { message: 'Failed to fetch drafts' },
    });

    renderComponent();

    expect(screen.getByText(/Error loading drafts/)).toBeInTheDocument();
  });

  it('renders empty state when no drafts', () => {
    mockUseFetch.mockReturnValue({
      data: { drafts: [] },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('No drafts yet')).toBeInTheDocument();
    expect(screen.getByText('Your saved drafts will appear here')).toBeInTheDocument();
  });

  it('renders list of drafts', () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft 1',
        description: 'Description 1',
        updatedAt: new Date().toISOString(),
      },
      {
        _id: '2',
        title: 'Draft 2',
        description: 'Description 2',
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Your Drafts')).toBeInTheDocument();
    expect(screen.getByText('2 draft(s)')).toBeInTheDocument();
    expect(screen.getByText('Draft 1')).toBeInTheDocument();
    expect(screen.getByText('Draft 2')).toBeInTheDocument();
  });

  it('deletes draft when delete button clicked and confirmed', async () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft to Delete',
        description: 'Description',
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    global.confirm.mockReturnValue(true);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Draft deleted' }),
    });

    renderComponent();

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.className.includes('hover:bg-red-50'));
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/blog/delete/1'),
        expect.objectContaining({
          method: 'delete',
          credentials: 'include',
        })
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith('success', 'Draft deleted successfully');
  });

  it('does not delete draft when user cancels confirmation', async () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft',
        description: 'Description',
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    global.confirm.mockReturnValue(false);

    renderComponent();

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.className.includes('hover:bg-red-50'));
    fireEvent.click(deleteButton);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles delete error', async () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft',
        description: 'Description',
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    global.confirm.mockReturnValue(true);
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Delete failed' }),
    });

    renderComponent();

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.className.includes('hover:bg-red-50'));
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Delete failed');
    });
  });

  it('handles delete exception', async () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft',
        description: 'Description',
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    global.confirm.mockReturnValue(true);
    global.fetch.mockRejectedValue(new Error('Network error'));

    renderComponent();

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.className.includes('hover:bg-red-50'));
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Network error');
    });
  });

  it('renders edit link for each draft', () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft 1',
        description: 'Description',
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    renderComponent();

    const editLink = screen.getByRole('link', { name: /Continue Writing/i });
    expect(editLink).toBeInTheDocument();
  });

  it('displays draft count correctly', () => {
    const mockDrafts = Array.from({ length: 5 }, (_, i) => ({
      _id: `${i}`,
      title: `Draft ${i}`,
      description: `Description ${i}`,
      updatedAt: new Date().toISOString(),
    }));

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('5 draft(s)')).toBeInTheDocument();
  });

  it('displays draft titles', () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft',
        description: 'This is a test description',
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('handles refresh trigger prop', () => {
    mockUseFetch.mockReturnValue({
      data: { drafts: [] },
      loading: false,
      error: null,
    });

    const { rerender } = renderComponent({ refreshTrigger: 1 });

    expect(mockUseFetch).toHaveBeenCalled();

    rerender(
      <MemoryRouter>
        <DraftsList refreshTrigger={2} />
      </MemoryRouter>
    );

    // useFetch should be called again with new refreshTrigger
    expect(mockUseFetch).toHaveBeenCalledTimes(2);
  });

  it('disables delete button while deleting', async () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft',
        description: 'Description',
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    global.confirm.mockReturnValue(true);
    
    let resolveDelete;
    global.fetch.mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve;
      })
    );

    renderComponent();

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.className.includes('hover:bg-red-50'));
    fireEvent.click(deleteButton);

    // Cleanup
    resolveDelete({ ok: true, json: async () => ({}) });
  });

  it('handles missing updatedAt gracefully', () => {
    const mockDrafts = [
      {
        _id: '1',
        title: 'Draft without date',
        description: 'Description',
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { drafts: mockDrafts },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Draft without date')).toBeInTheDocument();
  });
});
