import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RelatedBlog from '../../src/components/RelatedBlog';
import userReducer from '../../src/redux/user/user.slice';

// Mock dependencies
vi.mock('@/hooks/useFetch');
vi.mock('@/helpers/getEnv');
vi.mock('@/components/Loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

const { useFetch } = await import('@/hooks/useFetch');
const { getEnv } = await import('@/helpers/getEnv');

describe('RelatedBlog', () => {
  let mockStore;
  const mockUseFetch = vi.mocked(useFetch);
  const mockGetEnv = vi.mocked(getEnv);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnv.mockReturnValue('http://localhost:5000');
    
    mockStore = configureStore({
      reducer: {
        user: userReducer,
      },
      preloadedState: {
        user: {
          isLoggedIn: false,
          user: null,
        },
      },
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <MemoryRouter>
          <RelatedBlog {...props} />
        </MemoryRouter>
      </Provider>
    );
  };

  it('renders loading state', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    renderComponent({ category: 'tech' });

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseFetch.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
    });

    renderComponent({ category: 'tech' });

    expect(screen.getByText('Unable to load related posts.')).toBeInTheDocument();
  });

  it('renders no related posts message when empty', () => {
    mockUseFetch.mockReturnValue({
      data: { relatedBlog: [] },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech' });

    expect(screen.getByText('No related posts found.')).toBeInTheDocument();
  });

  it('renders related blog posts', async () => {
    const mockPosts = [
      {
        _id: '1',
        title: 'Test Post 1',
        featuredImage: 'image1.jpg',
        author: { name: 'John Doe', username: 'johndoe' },
        categories: [{ slug: 'tech' }],
        slug: 'test-post-1',
      },
      {
        _id: '2',
        title: 'Test Post 2',
        featuredImage: 'image2.jpg',
        author: { name: 'Jane Smith', username: 'janesmith' },
        categories: [{ slug: 'tech' }],
        slug: 'test-post-2',
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { relatedBlog: mockPosts },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech' });

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('handles category as slug string', () => {
    mockUseFetch.mockReturnValue({
      data: { relatedBlog: [] },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'technology' });

    expect(mockUseFetch).toHaveBeenCalledWith(
      expect.stringContaining('technology'),
      expect.any(Object),
      expect.any(Array)
    );
  });

  it('handles category as array', () => {
    mockUseFetch.mockReturnValue({
      data: { relatedBlog: [] },
      loading: false,
      error: null,
    });

    renderComponent({ category: [{ slug: 'tech' }] });

    expect(mockUseFetch).toHaveBeenCalledWith(
      expect.stringContaining('tech'),
      expect.any(Object),
      expect.any(Array)
    );
  });

  it('uses personalized endpoint when logged in with currentBlog', () => {
    mockStore = configureStore({
      reducer: { user: userReducer },
      preloadedState: {
        user: { isLoggedIn: true, user: { _id: 'user1' } },
      },
    });

    mockUseFetch.mockReturnValue({
      data: { relatedBlog: [] },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech', currentBlog: 'blog123' });

    expect(mockUseFetch).toHaveBeenCalledWith(
      expect.stringContaining('get-personalized-related/blog123'),
      expect.any(Object),
      expect.any(Array)
    );
  });

  it('uses personalized home endpoint when logged in without currentBlog', () => {
    mockStore = configureStore({
      reducer: { user: userReducer },
      preloadedState: {
        user: { isLoggedIn: true, user: { _id: 'user1' } },
      },
    });

    mockUseFetch.mockReturnValue({
      data: { relatedBlog: [] },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech' });

    expect(mockUseFetch).toHaveBeenCalledWith(
      expect.stringContaining('get-personalized-home'),
      expect.any(Object),
      expect.any(Array)
    );
  });

  it('limits displayed posts to 6', () => {
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      _id: `${i}`,
      title: `Post ${i}`,
      featuredImage: `image${i}.jpg`,
      author: { name: `Author ${i}`, username: `author${i}` },
      categories: [{ slug: 'tech' }],
      slug: `post-${i}`,
    }));

    mockUseFetch.mockReturnValue({
      data: { relatedBlog: mockPosts },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech' });

    const links = screen.getAllByRole('link');
    expect(links.length).toBeLessThanOrEqual(6);
  });

  it('displays author username when name not available', () => {
    const mockPosts = [
      {
        _id: '1',
        title: 'Test Post',
        featuredImage: 'image.jpg',
        author: { username: 'testuser' },
        categories: [{ slug: 'tech' }],
        slug: 'test-post',
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { relatedBlog: mockPosts },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech' });

    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('handles data from blog property', () => {
    const mockPosts = [
      {
        _id: '1',
        title: 'Blog Post',
        featuredImage: 'image.jpg',
        author: { name: 'Author' },
        categories: [{ slug: 'tech' }],
        slug: 'blog-post',
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { blog: mockPosts },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech' });

    expect(screen.getByText('Blog Post')).toBeInTheDocument();
  });

  it('handles data from savedBlogs property', () => {
    const mockPosts = [
      {
        _id: '1',
        title: 'Saved Post',
        featuredImage: 'image.jpg',
        author: { name: 'Author' },
        categories: [{ slug: 'tech' }],
        slug: 'saved-post',
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { savedBlogs: mockPosts },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech' });

    expect(screen.getByText('Saved Post')).toBeInTheDocument();
  });

  it('renders without close button when hideCloseButton is true', () => {
    const mockPosts = [
      {
        _id: '1',
        title: 'Post',
        featuredImage: 'image.jpg',
        author: { name: 'Author' },
        categories: [{ slug: 'tech' }],
        slug: 'post',
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { relatedBlog: mockPosts },
      loading: false,
      error: null,
    });

    renderComponent({ category: 'tech', hideCloseButton: true });

    const closeButtons = screen.queryAllByRole('button');
    expect(closeButtons.length).toBe(0);
  });

  it('falls back to /blog/blogs when no category and not logged in', () => {
    mockUseFetch.mockReturnValue({
      data: { blog: [] },
      loading: false,
      error: null,
    });

    renderComponent({});

    expect(mockUseFetch).toHaveBeenCalledWith(
      expect.stringContaining('/blog/blogs'),
      expect.any(Object),
      expect.any(Array)
    );
  });

  it('calls onClose callback when close button is clicked and onClose is provided', () => {
    const mockPosts = [
      {
        _id: '1',
        title: 'Test Post',
        featuredImage: 'image.jpg',
        author: { name: 'Author', username: 'author' },
        categories: [{ slug: 'tech' }],
        slug: 'test-post',
      },
    ];

    mockUseFetch.mockReturnValue({
      data: { relatedBlog: mockPosts },
      loading: false,
      error: null,
    });

    const onCloseMock = vi.fn();

    renderComponent({ categorySlug: 'tech', onClose: onCloseMock });

    const closeButton = screen.getByLabelText(/close recommendations/i);
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
