import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModerationWarning from '../../src/components/ModerationWarning';

describe('ModerationWarning', () => {
  it('returns null when no data provided', () => {
    const { container } = render(<ModerationWarning />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when all props are empty', () => {
    const { container } = render(
      <ModerationWarning badLines={[]} suggestions={[]} message="" summary="" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays message when provided', () => {
    render(<ModerationWarning message="Content flagged" />);
    expect(screen.getByText('Content flagged')).toBeInTheDocument();
  });

  it('displays summary instead of message when both provided', () => {
    render(
      <ModerationWarning message="Message text" summary="Summary text" />
    );
    expect(screen.getByText('Summary text')).toBeInTheDocument();
    expect(screen.queryByText('Message text')).not.toBeInTheDocument();
  });

  it('displays default message when no message or summary provided but badLines exist', () => {
    render(<ModerationWarning badLines={[{ line: 1, text: 'bad content' }]} />);
    expect(
      screen.getByText('Your comment was flagged by moderation.')
    ).toBeInTheDocument();
  });

  it('displays bad lines with line numbers', () => {
    const badLines = [
      { line: 1, text: 'inappropriate text' },
      { line: 3, text: 'flagged content' },
    ];

    render(<ModerationWarning badLines={badLines} />);

    expect(screen.getByText('Line 1:')).toBeInTheDocument();
    expect(screen.getByText('inappropriate text', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Line 3:')).toBeInTheDocument();
    expect(screen.getByText('flagged content', { exact: false })).toBeInTheDocument();
  });

  it('displays suggestions for bad lines', () => {
    const badLines = [
      { line: 2, text: 'bad text', suggestion: 'Try rephrasing' },
    ];

    render(<ModerationWarning badLines={badLines} />);

    expect(screen.getByText(/Suggestion: Try rephrasing/)).toBeInTheDocument();
  });

  it('displays general suggestions section', () => {
    const suggestions = ['Remove offensive words', 'Be more respectful'];

    render(<ModerationWarning suggestions={suggestions} message="Flagged" />);

    expect(screen.getByText('Suggestions:')).toBeInTheDocument();
    expect(screen.getByText('Remove offensive words')).toBeInTheDocument();
    expect(screen.getByText('Be more respectful')).toBeInTheDocument();
  });

  it('displays both bad lines and suggestions', () => {
    const badLines = [{ line: 1, text: 'bad word' }];
    const suggestions = ['Use better language'];

    render(
      <ModerationWarning
        badLines={badLines}
        suggestions={suggestions}
        message="Content moderated"
      />
    );

    expect(screen.getByText('Line 1:')).toBeInTheDocument();
    expect(screen.getByText('bad word', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Suggestions:')).toBeInTheDocument();
    expect(screen.getByText('Use better language')).toBeInTheDocument();
  });

  it('renders with correct styling classes', () => {
    render(<ModerationWarning message="Test message" />);

    const container = document.querySelector('.bg-red-50');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('border', 'border-red-300', 'rounded', 'p-2', 'mt-2');
  });

  it('displays multiple bad lines correctly', () => {
    const badLines = [
      { line: 1, text: 'line one issue' },
      { line: 2, text: 'line two issue' },
      { line: 5, text: 'line five issue' },
    ];

    render(<ModerationWarning badLines={badLines} />);

    expect(screen.getByText('Line 1:')).toBeInTheDocument();
    expect(screen.getByText('Line 2:')).toBeInTheDocument();
    expect(screen.getByText('Line 5:')).toBeInTheDocument();
  });

  it('displays multiple suggestions correctly', () => {
    const suggestions = [
      'First suggestion',
      'Second suggestion',
      'Third suggestion',
    ];

    render(<ModerationWarning suggestions={suggestions} message="Flagged" />);

    suggestions.forEach((suggestion) => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('handles bad lines without suggestions', () => {
    const badLines = [{ line: 1, text: 'flagged text' }];

    render(<ModerationWarning badLines={badLines} />);

    expect(screen.getByText('Line 1:')).toBeInTheDocument();
    expect(screen.queryByText(/Suggestion:/)).not.toBeInTheDocument();
  });

  it('handles empty badLines array', () => {
    render(<ModerationWarning badLines={[]} message="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles empty suggestions array', () => {
    render(<ModerationWarning suggestions={[]} message="Test" />);
    expect(screen.queryByText('Suggestions:')).not.toBeInTheDocument();
  });

  it('renders line numbers in monospace font', () => {
    const badLines = [{ line: 42, text: 'test' }];

    render(<ModerationWarning badLines={badLines} />);

    const lineElement = screen.getByText('Line 42:');
    expect(lineElement).toHaveClass('font-mono');
  });
});
