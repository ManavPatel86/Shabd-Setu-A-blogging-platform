import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Saved from '../../src/pages/Saved';
import userReducer from '../../src/redux/user/user.slice';

// Mock dependencies
vi.mock('@/hooks/useFetch');
vi.mock('@/helpers/getEnv');
vi.mock('@/components/BlogCard');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useFetch } from '@/hooks/useFetch';
import { getEnv } from '@/helpers/getEnv';
import BlogCard from '@/components/BlogCard';

describe('Saved Page', () => {
  let mockUseFetch;

  const mockSavedBlogs = [
    {
      _id: '1',
      title: 'Tech Article',
      description: 'Learn about technology',
      createdAt: '2024-01-15T10:00:00Z',
      categories: [{ name: 'Technology' }],
    },
    {
      _id: '2',
      title: 'Travel Guide',
      description: 'Explore the world',
      createdAt: '2024-01-14T10:00:00Z',
      categories: [{ name: 'Travel' }],
    },
    {
      _id: '3',
      title: 'Health Tips',
      description: 'Stay healthy',
      createdAt: '2024-01-13T10:00:00Z',
      categories: [{ name: 'Health' }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    mockUseFetch = vi.mocked(useFetch);
    vi.mocked(getEnv).mockReturnValue('http://localhost:3000');
    vi.mocked(BlogCard).mockImplementation(({ blog }) => (
      <div data-testid="blog-card">{blog.title}</div>
    ));

    mockUseFetch.mockReturnValue({
      data: { savedBlogs: mockSavedBlogs },
      loading: false,
      error: null,
    });
  });

  const renderComponent = (isLoggedIn = true) => {
    const store = configureStore({
      reducer: {
        user: userReducer,
      },
      preloadedState: {
        user: {
          isLoggedIn,
          user: isLoggedIn ? { _id: 'user123' } : {},
        },
      },
    });

    return render(
      <Provider store={store}>
        <MemoryRouter>
          <Saved />
        </MemoryRouter>
      </Provider>
    );
  };

  it('redirects to sign in when user is not logged in', () => {
    renderComponent(false);
    waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sign-in', { replace: true });
    });
  });

  it('renders saved blogs page for logged in user', () => {
    renderComponent();
    expect(screen.getByText('Saved Blogs')).toBeInTheDocument();
  });

  it('displays saved blogs count', () => {
    renderComponent();
    expect(screen.getByText(/3 saved/i)).toBeInTheDocument();
  });

  it('displays all saved blog cards', () => {
    renderComponent();
    
    expect(screen.getByText('Tech Article')).toBeInTheDocument();
    expect(screen.getByText('Travel Guide')).toBeInTheDocument();
    expect(screen.getByText('Health Tips')).toBeInTheDocument();
  });

  it('shows loading skeleton when data is loading', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    renderComponent();
    
    // Check for loading placeholder
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it('displays empty state when no saved blogs', () => {
    mockUseFetch.mockReturnValue({
      data: { savedBlogs: [] },
      loading: false,
      error: null,
    });

    renderComponent();
    
    expect(screen.getByText('No saved blogs yet')).toBeInTheDocument();
    expect(screen.getByText(/Tap the bookmark icon/)).toBeInTheDocument();
  });

  it('filters blogs by search term', () => {
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText(/Search saved titles or categories/i);
    fireEvent.change(searchInput, { target: { value: 'Tech' } });

    waitFor(() => {
      expect(screen.getByText('Tech Article')).toBeInTheDocument();
      expect(screen.queryByText('Travel Guide')).not.toBeInTheDocument();
    });
  });

  it('filters blogs by category', () => {
    renderComponent();
    
    const technologyButton = screen.getByText(/Technology/);
    fireEvent.click(technologyButton);

    waitFor(() => {
      expect(screen.getByText(/1 shown/)).toBeInTheDocument();
    });
  });

  it('shows all categories button and filters correctly', () => {
    renderComponent();
    
    const allCategoriesButton = screen.getByText('All categories');
    expect(allCategoriesButton).toBeInTheDocument();
    
    fireEvent.click(allCategoriesButton);
    
    waitFor(() => {
      expect(screen.getByText(/3 shown/)).toBeInTheDocument();
    });
  });

  it('sorts blogs by newest first (default)', () => {
    renderComponent();
    
    const blogCards = screen.getAllByTestId('blog-card');
    expect(blogCards[0]).toHaveTextContent('Tech Article');
  });

  it('sorts blogs by oldest first', () => {
    renderComponent();
    
    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });

    waitFor(() => {
      const blogCards = screen.getAllByTestId('blog-card');
      expect(blogCards[0]).toHaveTextContent('Health Tips');
    });
  });

  it('sorts blogs by title A-Z', () => {
    renderComponent();
    
    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'title' } });

    waitFor(() => {
      const blogCards = screen.getAllByTestId('blog-card');
      expect(blogCards[0]).toHaveTextContent('Health Tips');
    });
  });

  it('switches to grid view', () => {
    renderComponent();
    
    const gridViewButton = screen.getByLabelText('Grid view');
    fireEvent.click(gridViewButton);

    expect(gridViewButton).toHaveClass('bg-[#6C5CE7]');
  });

  it('switches to list view', () => {
    renderComponent();
    
    const listViewButton = screen.getByLabelText('List view');
    fireEvent.click(listViewButton);

    expect(listViewButton).toHaveClass('bg-[#6C5CE7]');
  });

  it('displays category frequency in filter buttons', () => {
    renderComponent();
    
    // Check for category count badges
    expect(screen.getByText(/Technology/)).toBeInTheDocument();
    expect(screen.getAllByText(/• 1/).length).toBeGreaterThan(0);
  });

  it('updates on savedUpdated event', () => {
    renderComponent();
    
    // Simulate savedUpdated event
    const event = new Event('savedUpdated');
    window.dispatchEvent(event);

    // useFetch should be called with updated refreshKey
    waitFor(() => {
      expect(mockUseFetch).toHaveBeenCalled();
    });
  });

  it('displays dashboard breadcrumb', () => {
    renderComponent();
    
    expect(screen.getByText(/Dashboard • Saved/)).toBeInTheDocument();
  });

  it('shows visible count in filter section', () => {
    renderComponent();
    
    expect(screen.getAllByText(/3 shown/).length).toBeGreaterThan(0);
  });

  it('handles category filtering with active category display', () => {
    renderComponent();
    
    const technologyButton = screen.getByText(/Technology/);
    fireEvent.click(technologyButton);

    waitFor(() => {
      expect(screen.getByText(/Technology/)).toHaveClass('bg-[#6C5CE7]/10');
    });
  });

  it('displays helper text for saved posts', () => {
    renderComponent();
    
    expect(screen.getByText('ready to revisit')).toBeInTheDocument();
  });

  it('shows curated message in hero section', () => {
    renderComponent();
    
    expect(screen.getByText(/Curate inspiration, keep your learning streak alive/)).toBeInTheDocument();
  });

  it('handles blogs with array of string categories', () => {
    const blogsWithArrayCategories = [
      {
        _id: '1',
        title: 'Blog with array categories',
        createdAt: '2024-01-15T10:00:00Z',
        category: ['Tech', 'Design'],
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { savedBlogs: blogsWithArrayCategories },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Blog with array categories')).toBeInTheDocument();
  });

  it('handles blogs with category as object with name', () => {
    const blogsWithCategoryObject = [
      {
        _id: '1',
        title: 'Blog with category object',
        createdAt: '2024-01-15T10:00:00Z',
        category: { name: 'Technology' },
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { savedBlogs: blogsWithCategoryObject },
      loading: false,
      error: null,
    });

    renderComponent();

    expect(screen.getByText('Blog with category object')).toBeInTheDocument();
  });

  it('filters by category description match', () => {
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText(/Search saved titles or categories/i);
    fireEvent.change(searchInput, { target: { value: 'technology' } });

    waitFor(() => {
      expect(screen.getByText('Tech Article')).toBeInTheDocument();
    });
  });

  it('shows category in dive back message when filtered', () => {
    renderComponent();
    
    const technologyButton = screen.getByText(/Technology/);
    fireEvent.click(technologyButton);

    waitFor(() => {
      expect(screen.getByText(/• Technology/)).toBeInTheDocument();
    });
  });
});
