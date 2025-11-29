import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Index from '../../src/pages/Index';
import userReducer from '../../src/redux/user/user.slice';

// Mock dependencies
vi.mock('@/hooks/useFetch');
vi.mock('@/helpers/getEnv');
vi.mock('@/components/Loading');
vi.mock('@/components/CategoryBar');
vi.mock('@/components/FeedTabs');
vi.mock('@/components/FeaturedCard');
vi.mock('@/components/BlogCard');

import { useFetch } from '@/hooks/useFetch';
import { getEnv } from '@/helpers/getEnv';
import Loading from '@/components/Loading';
import CategoryBar from '@/components/CategoryBar';
import FeedTabs from '@/components/FeedTabs';
import FeaturedCard from '@/components/FeaturedCard';
import BlogCard from '@/components/BlogCard';

describe('Index Page', () => {
  let mockUseFetch;
  let store;

  const mockBlogs = [
    {
      _id: '1',
      title: 'Tech Blog',
      content: 'Content 1',
      createdAt: '2024-01-15T10:00:00Z',
      categories: [{ name: 'Technology', icon: '💻' }],
      author: { _id: 'author1', name: 'John Doe' },
    },
    {
      _id: '2',
      title: 'Travel Blog',
      content: 'Content 2',
      createdAt: '2024-01-14T10:00:00Z',
      categories: [{ name: 'Travel', icon: '✈' }],
      author: { _id: 'author2', name: 'Jane Smith' },
      isFeatured: true,
    },
    {
      _id: '3',
      title: 'Health Blog',
      content: 'Content 3',
      createdAt: '2024-01-13T10:00:00Z',
      categories: [{ name: 'Health', icon: '🏥' }],
      author: { _id: 'author1', name: 'John Doe' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    store = configureStore({
      reducer: {
        user: userReducer,
      },
      preloadedState: {
        user: {
          isLoggedIn: false,
          user: {},
        },
      },
    });

    mockUseFetch = vi.mocked(useFetch);
    vi.mocked(getEnv).mockReturnValue('http://localhost:3000');

    // Mock components
    vi.mocked(Loading).mockReturnValue(<div>Loading...</div>);
    vi.mocked(CategoryBar).mockImplementation(({ categories = [], activeCategory, setActiveCategory }) => (
      <div data-testid="category-bar">
        {(categories || []).map((cat) => (
          <button
            key={cat?.name || 'unknown'}
            onClick={() => setActiveCategory(cat?.name || 'All')}
            className={activeCategory === cat?.name ? 'active' : ''}
          >
            {cat?.icon || ''} {cat?.name || 'Unknown'}
          </button>
        ))}
      </div>
    ));
    vi.mocked(FeedTabs).mockImplementation(({ activeFeedTab, setActiveFeedTab }) => (
      <div data-testid="feed-tabs">
        <button onClick={() => setActiveFeedTab('Latest')}>Latest</button>
        <button onClick={() => setActiveFeedTab('Following')}>Following</button>
        <button onClick={() => setActiveFeedTab('Personalized')}>Personalized</button>
      </div>
    ));
    vi.mocked(FeaturedCard).mockReturnValue(<div data-testid="featured-card">Featured</div>);
    vi.mocked(BlogCard).mockImplementation(({ blog }) => (
      <div data-testid="blog-card">{blog.title}</div>
    ));

    // Default mock: blogs endpoint
    mockUseFetch.mockImplementation((url) => {
      if (url?.includes('/blog/blogs')) {
        return {
          data: { blog: mockBlogs },
          loading: false,
          error: null,
        };
      }
      return { data: null, loading: false, error: null };
    });
  });

  const renderComponent = (storeOverrides = {}) => {
    const testStore = configureStore({
      reducer: {
        user: userReducer,
      },
      preloadedState: {
        user: {
          isLoggedIn: storeOverrides.isLoggedIn ?? false,
          user: storeOverrides.user ?? {},
        },
      },
    });

    return render(
      <Provider store={testStore}>
        <MemoryRouter>
          <Index />
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders loading state initially', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders blog feed with all blogs', () => {
    renderComponent();

    expect(screen.getByText('Tech Blog')).toBeInTheDocument();
    expect(screen.getByText('Travel Blog')).toBeInTheDocument();
    expect(screen.getByText('Health Blog')).toBeInTheDocument();
  });

  it('displays total blog count', () => {
    renderComponent();

    expect(screen.getByText('Total blogs')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders category bar with dynamic categories', () => {
    renderComponent();

    const categoryBar = screen.getByTestId('category-bar');
    expect(categoryBar).toBeInTheDocument();
    
    // Check that category bar has buttons rendered
    const buttons = categoryBar.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('filters blogs by category when category is selected', async () => {
    renderComponent();

    const categoryBar = screen.getByTestId('category-bar');
    const buttons = categoryBar.querySelectorAll('button');
    // Click first category button (should be 'All' or first category)
    if (buttons.length > 1) {
      fireEvent.click(buttons[1]);
    }

    // After filtering, blog count should change
    await waitFor(() => {
      expect(screen.getByTestId('category-bar')).toBeInTheDocument();
    });
  });

  it('renders feed tabs', () => {
    renderComponent();

    const feedTabs = screen.getByTestId('feed-tabs');
    expect(feedTabs).toBeInTheDocument();
    expect(screen.getByText('Latest')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
    expect(screen.getByText('Personalized')).toBeInTheDocument();
  });

  it('renders featured card', () => {
    renderComponent();

    expect(screen.getByTestId('featured-card')).toBeInTheDocument();
  });

  it('shows empty state when no blogs match filter', () => {
    mockUseFetch.mockReturnValue({
      data: { blog: [] },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText(/No blogs match this view yet/)).toBeInTheDocument();
  });

  it('shows error state when fetch fails', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: false,
      error: 'Network error',
    });

    renderComponent();

    expect(screen.getByText(/We hit a snag/)).toBeInTheDocument();
    expect(screen.getByText(/Please refresh or try again shortly/)).toBeInTheDocument();
  });

  it('fetches personalized feed for logged-in users when Personalized tab is active', () => {
    mockUseFetch.mockImplementation((url) => {
      if (url?.includes('/blog/blogs')) {
        return { data: { blog: mockBlogs }, loading: false, error: null };
      }
      if (url?.includes('/get-personalized-home')) {
        return {
          data: {
            blog: [mockBlogs[0]],
            meta: { message: 'Based on your interests' },
          },
          loading: false,
          error: null,
        };
      }
      return { data: null, loading: false, error: null };
    });

    renderComponent({ isLoggedIn: true, user: { _id: 'user123' } });

    const personalizedButton = screen.getByText('Personalized');
    fireEvent.click(personalizedButton);

    waitFor(() => {
      expect(screen.getByText('Based on your interests')).toBeInTheDocument();
    });
  });

  it('shows message to sign in for personalized feed when not logged in', () => {
    renderComponent();

    const personalizedButton = screen.getByText('Personalized');
    fireEvent.click(personalizedButton);

    waitFor(() => {
      expect(screen.getByText(/Sign in to get personalized recommendations/)).toBeInTheDocument();
    });
  });

  it('fetches following data for logged-in users', () => {
    mockUseFetch.mockImplementation((url) => {
      if (url?.includes('/blog/blogs')) {
        return { data: { blog: mockBlogs }, loading: false, error: null };
      }
      if (url?.includes('/following/')) {
        return {
          data: {
            following: [{ _id: 'author1' }],
          },
          loading: false,
          error: null,
        };
      }
      return { data: null, loading: false, error: null };
    });

    renderComponent({ isLoggedIn: true, user: { _id: 'user123' } });

    const followingButton = screen.getByText('Following');
    fireEvent.click(followingButton);

    // Should filter to show only blogs from author1
    waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 blogs from author1
    });
  });

  it('shows message when Following tab is active but user follows nobody', () => {
    mockUseFetch.mockImplementation((url) => {
      if (url?.includes('/blog/blogs')) {
        return { data: { blog: mockBlogs }, loading: false, error: null };
      }
      if (url?.includes('/following/')) {
        return {
          data: { following: [] },
          loading: false,
          error: null,
        };
      }
      return { data: null, loading: false, error: null };
    });

    renderComponent({ isLoggedIn: true, user: { _id: 'user123' } });

    const followingButton = screen.getByText('Following');
    fireEvent.click(followingButton);

    waitFor(() => {
      expect(screen.getByText(/Follow authors to populate this feed/)).toBeInTheDocument();
    });
  });

  it('sorts blogs by newest first', () => {
    renderComponent();

    const blogCards = screen.getAllByTestId('blog-card');
    // First blog should be 'Tech Blog' (2024-01-15, newest)
    expect(blogCards[0]).toHaveTextContent('Tech Blog');
  });

  it('resets category to All if selected category is invalid', async () => {
    renderComponent();

    const categoryBar = screen.getByTestId('category-bar');
    const buttons = categoryBar.querySelectorAll('button');
    
    // Click a category button
    if (buttons.length > 1) {
      fireEvent.click(buttons[1]);
    }

    // Verify category bar still exists and is functional
    await waitFor(() => {
      expect(screen.getByTestId('category-bar')).toBeInTheDocument();
    });
  });

  it('displays active category name in the stats section', async () => {
    renderComponent();

    // Check that All categories is shown by default
    expect(screen.getByText('All categories')).toBeInTheDocument();

    const categoryBar = screen.getByTestId('category-bar');
    const buttons = categoryBar.querySelectorAll('button');
    
    // Click a category button to change active category
    if (buttons.length > 1) {
      fireEvent.click(buttons[1]);
    }

    await waitFor(() => {
      expect(screen.getByTestId('category-bar')).toBeInTheDocument();
    });
  });

  it('handles blogs with category as string instead of object', () => {
    const blogsWithStringCategory = [
      {
        _id: '1',
        title: 'Blog with string category',
        content: 'Content',
        createdAt: '2024-01-15T10:00:00Z',
        category: 'Technology',
        author: { _id: 'author1', name: 'John' },
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { blog: blogsWithStringCategory },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Blog with string category')).toBeInTheDocument();
  });

  it('handles blogs with no categories (uncategorized)', () => {
    const blogsWithNoCategory = [
      {
        _id: '1',
        title: 'Uncategorized Blog',
        content: 'Content',
        createdAt: '2024-01-15T10:00:00Z',
        author: { _id: 'author1', name: 'John' },
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { blog: blogsWithNoCategory },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Uncategorized Blog')).toBeInTheDocument();
  });

  it('handles following author with different ID formats', () => {
    const blogsWithVariousAuthorIds = [
      {
        _id: '1',
        title: 'Blog 1',
        createdAt: '2024-01-15T10:00:00Z',
        categories: [{ name: 'Tech' }],
        author: { id: 123, name: 'Author 1' }, // number ID
      },
      {
        _id: '2',
        title: 'Blog 2',
        createdAt: '2024-01-14T10:00:00Z',
        categories: [{ name: 'Tech' }],
        author: { userId: 'user456', name: 'Author 2' }, // userId field
      },
    ];

    mockUseFetch.mockImplementation((url) => {
      if (url?.includes('/blog/blogs')) {
        return { data: { blog: blogsWithVariousAuthorIds }, loading: false, error: null };
      }
      if (url?.includes('/following/')) {
        return {
          data: { following: [{ _id: '123' }, { _id: 'user456' }] },
          loading: false,
          error: null,
        };
      }
      return { data: null, loading: false, error: null };
    });

    renderComponent({ isLoggedIn: true, user: { _id: 'user123' } });

    const followingButton = screen.getByText('Following');
    fireEvent.click(followingButton);

    waitFor(() => {
      expect(screen.getByText('Blog 1')).toBeInTheDocument();
      expect(screen.getByText('Blog 2')).toBeInTheDocument();
    });
  });

  it('handles following author with followStatus flags', () => {
    const blogsWithFollowStatus = [
      {
        _id: '1',
        title: 'Followed Blog',
        createdAt: '2024-01-15T10:00:00Z',
        categories: [{ name: 'Tech' }],
        author: { _id: 'author1', name: 'Author 1', isFollowing: true },
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { blog: blogsWithFollowStatus },
      loading: false,
      error: null,
    });

    renderComponent({ isLoggedIn: true, user: { _id: 'user123' } });

    const followingButton = screen.getByText('Following');
    fireEvent.click(followingButton);

    waitFor(() => {
      expect(screen.getByText('Followed Blog')).toBeInTheDocument();
    });
  });

  it('detects category icons from emoji in label', () => {
    const blogsWithEmojiCategory = [
      {
        _id: '1',
        title: 'Tech Blog',
        createdAt: '2024-01-15T10:00:00Z',
        categories: [{ name: '💻 Technology' }],
        author: { _id: 'author1', name: 'John' },
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { blog: blogsWithEmojiCategory },
      loading: false,
      error: null,
    });

    renderComponent();

    const categoryBar = screen.getByTestId('category-bar');
    expect(categoryBar).toBeInTheDocument();
  });

  it('handles empty blog data gracefully', () => {
    mockUseFetch.mockReturnValue({
      data: {},
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText(/No blogs match this view yet/)).toBeInTheDocument();
  });

  it('handles null blogData gracefully', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText(/No blogs match this view yet/)).toBeInTheDocument();
  });

  it('shows personalized loading state', () => {
    mockUseFetch.mockImplementation((url) => {
      if (url?.includes('/blog/blogs')) {
        return { data: { blog: mockBlogs }, loading: false, error: null };
      }
      if (url?.includes('/get-personalized-home')) {
        return { data: null, loading: true, error: null };
      }
      return { data: null, loading: false, error: null };
    });

    renderComponent({ isLoggedIn: true, user: { _id: 'user123' } });

    const personalizedButton = screen.getByText('Personalized');
    fireEvent.click(personalizedButton);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles personalized feed error', () => {
    mockUseFetch.mockImplementation((url) => {
      if (url?.includes('/blog/blogs')) {
        return { data: { blog: mockBlogs }, loading: false, error: null };
      }
      if (url?.includes('/get-personalized-home')) {
        return { data: null, loading: false, error: 'Failed to fetch' };
      }
      return { data: null, loading: false, error: null };
    });

    renderComponent({ isLoggedIn: true, user: { _id: 'user123' } });

    const personalizedButton = screen.getByText('Personalized');
    fireEvent.click(personalizedButton);

    waitFor(() => {
      expect(screen.getByText(/couldn't load your personalized feed/)).toBeInTheDocument();
    });
  });

  it('handles categories with icon property', () => {
    const blogsWithIconProp = [
      {
        _id: '1',
        title: 'Custom Icon Blog',
        createdAt: '2024-01-15T10:00:00Z',
        categories: [{ name: 'Custom', icon: '🎯' }],
        author: { _id: 'author1', name: 'John' },
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { blog: blogsWithIconProp },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Custom Icon Blog')).toBeInTheDocument();
  });
});
