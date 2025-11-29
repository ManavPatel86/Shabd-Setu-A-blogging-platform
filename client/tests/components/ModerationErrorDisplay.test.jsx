import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModerationErrorDisplay from '../../src/components/ModerationErrorDisplay';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

describe('ModerationErrorDisplay', () => {
  const mockOnClose = vi.fn();
  const mockOnFixLine = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when errors array is empty', () => {
    const { container } = render(
      <ModerationErrorDisplay errors={[]} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when errors is null', () => {
    const { container } = render(
      <ModerationErrorDisplay errors={null} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when errors is undefined', () => {
    const { container } = render(
      <ModerationErrorDisplay onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays errors when provided', () => {
    const errors = [
      { line: 1, text: 'Bad content', issues: ['inappropriate'], severity: 'MODERATE' },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Content Moderation Failed')).toBeInTheDocument();
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('"Bad content"')).toBeInTheDocument();
  });

  it('displays critical error with special styling', () => {
    const errors = [
      { line: 1, text: 'Critical content', issues: ['hate speech'], severity: 'CRITICAL' },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('🚫 CONTENT BLOCKED')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
  });

  it('displays multiple errors', () => {
    const errors = [
      { line: 1, text: 'Error 1', issues: ['issue1'], severity: 'MODERATE' },
      { line: 3, text: 'Error 2', issues: ['issue2'], severity: 'MODERATE' },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('❌ Found 2 policy violations')).toBeInTheDocument();
    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 3')).toBeInTheDocument();
  });

  it('displays summary when provided', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' }];
    const summary = 'Overall moderation summary';

    render(
      <ModerationErrorDisplay
        errors={errors}
        summary={summary}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Overall moderation summary')).toBeInTheDocument();
  });

  it('displays suggestions for each error', () => {
    const errors = [
      {
        line: 2,
        text: 'problematic text',
        issues: ['inappropriate'],
        suggestions: 'Please rephrase this content',
        severity: 'MODERATE',
      },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('💡 Action Required:')).toBeInTheDocument();
    expect(screen.getByText(/Please rephrase this content/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' }];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByTestId('x-icon').parentElement;
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onFixLine when "Go to Line" button clicked', () => {
    const errors = [{ line: 5, text: 'test', issues: ['issue'], severity: 'MODERATE' }];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
        onFixLine={mockOnFixLine}
      />
    );

    const goToLineButton = screen.getByText('Go to Line →');
    fireEvent.click(goToLineButton);

    expect(mockOnFixLine).toHaveBeenCalledWith(5);
  });

  it('displays issues joined by comma', () => {
    const errors = [
      {
        line: 1,
        text: 'test',
        issues: ['hate speech', 'violence', 'profanity'],
        severity: 'MODERATE',
      },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('hate speech, violence, profanity')).toBeInTheDocument();
  });

  it('displays singular "violation" for one error', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' }];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('❌ Found 1 policy violation')).toBeInTheDocument();
  });

  it('displays critical warning message when critical error exists', () => {
    const errors = [
      { line: 1, text: 'test', issues: ['issue'], severity: 'CRITICAL' },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(/This content cannot be published/)
    ).toBeInTheDocument();
  });

  it('applies red border for critical errors', () => {
    const errors = [
      { line: 1, text: 'test', issues: ['issue'], severity: 'CRITICAL' },
    ];

    const { container } = render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    const modalContent = container.querySelector('.border-4.border-red-600');
    expect(modalContent).toBeInTheDocument();
  });

  it('displays moderate error without critical styling', () => {
    const errors = [
      { line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Content Moderation Failed')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('displays warning emoji for critical errors', () => {
    const errors = [
      { line: 10, text: 'critical content', issues: ['severe'], severity: 'CRITICAL' },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    const lineLabel = screen.getByText(/Line 10.*⚠️/);
    expect(lineLabel).toBeInTheDocument();
  });

  it('handles missing onFixLine gracefully', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' }];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    const goToLineButton = screen.getByText('Go to Line →');
    expect(() => fireEvent.click(goToLineButton)).not.toThrow();
  });

  it('renders scrollable content area', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' }];

    const { container } = render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    const scrollableArea = container.querySelector('.overflow-y-auto');
    expect(scrollableArea).toBeInTheDocument();
  });

  it('displays error text in monospace font', () => {
    const errors = [
      { line: 1, text: 'code snippet', issues: ['issue'], severity: 'MODERATE' },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    const errorText = screen.getByText('"code snippet"');
    expect(errorText).toHaveClass('font-mono');
  });

  it('handles mixed severity errors', () => {
    const errors = [
      { line: 1, text: 'moderate issue', issues: ['issue1'], severity: 'MODERATE' },
      { line: 2, text: 'critical issue', issues: ['issue2'], severity: 'CRITICAL' },
    ];

    render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    // Should show critical styling since one error is critical
    expect(screen.getByText('🚫 CONTENT BLOCKED')).toBeInTheDocument();
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
  });

  it('renders fixed overlay backdrop', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' }];

    const { container } = render(
      <ModerationErrorDisplay
        errors={errors}
        onClose={mockOnClose}
      />
    );

    const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();
  });

  it('displays general suggestions when provided', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' }];
    const suggestions = ['Remove inappropriate words', 'Use proper language'];

    render(
      <ModerationErrorDisplay
        errors={errors}
        suggestions={suggestions}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('📝 Required Changes:')).toBeInTheDocument();
    expect(screen.getByText('Remove inappropriate words')).toBeInTheDocument();
    expect(screen.getByText('Use proper language')).toBeInTheDocument();
  });

  it('displays suggestions with critical styling', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'CRITICAL' }];
    const suggestions = ['Critical change needed'];

    render(
      <ModerationErrorDisplay
        errors={errors}
        suggestions={suggestions}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('📝 Required Changes:')).toBeInTheDocument();
    expect(screen.getByText('Critical change needed')).toBeInTheDocument();
  });

  it('does not display suggestions section when empty', () => {
    const errors = [{ line: 1, text: 'test', issues: ['issue'], severity: 'MODERATE' }];

    render(
      <ModerationErrorDisplay
        errors={errors}
        suggestions={[]}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('📝 Required Changes:')).not.toBeInTheDocument();
  });
});
