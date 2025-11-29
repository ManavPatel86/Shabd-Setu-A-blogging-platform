import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SummaryModal from '../../src/components/SummaryModal';

describe('SummaryModal', () => {
  let mockOnClose;
  let mockOnRefresh;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnRefresh = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when not open', () => {
    const { container } = render(
      <SummaryModal
        isOpen={false}
        onClose={mockOnClose}
        summary=""
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Test summary"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('AI Summary')).toBeInTheDocument();
  });

  it('displays summary text', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="This is a test summary"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('This is a test summary')).toBeInTheDocument();
  });

  it('splits summary by newlines into paragraphs', () => {
    const multilineSummary = "Line 1\nLine 2\nLine 3";
    
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary={multilineSummary}
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
    expect(screen.getByText('Line 3')).toBeInTheDocument();
  });

  it('filters out empty lines from summary', () => {
    const summaryWithEmptyLines = "Line 1\n\n\nLine 2\n";
    
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary={summaryWithEmptyLines}
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    const paragraphs = screen.getAllByText(/Line \d/);
    expect(paragraphs).toHaveLength(2);
  });

  it('shows loading state while generating summary', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary=""
        summaryLoading={true}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Generating summary...')).toBeInTheDocument();
  });

  it('shows refreshing state when reloading', () => {
    const { rerender } = render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Existing summary"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    // Click the refresh button
    fireEvent.click(screen.getByText('Refresh'));

    // Re-render with loading state
    rerender(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Existing summary"
        summaryLoading={true}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('shows error message when summary fails', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary=""
        summaryLoading={false}
        summaryError="Failed to generate summary"
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Failed to generate summary')).toBeInTheDocument();
  });

  it('shows placeholder when no summary yet', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary=""
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Summary will appear here once generated.')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Test"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('svg'));
    fireEvent.click(xButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Test"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    const backdrop = screen.getByText('AI Summary').parentElement.parentElement;
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when modal content clicked', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Test"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    const modalContent = screen.getByText('AI Summary').parentElement;
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onRefresh when refresh button clicked', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Test"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('closes modal on Escape key press', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Test"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('removes event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Test"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('shows refresh button in normal state', () => {
    render(
      <SummaryModal
        isOpen={true}
        onClose={mockOnClose}
        summary="Test"
        summaryLoading={false}
        summaryError={null}
        onRefresh={mockOnRefresh}
      />
    );

    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });
});
