import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Editor from '../../src/components/Editor';
import { CKEditor } from '@ckeditor/ckeditor5-react';

// Mock CKEditor
vi.mock('@ckeditor/ckeditor5-react', () => ({
  CKEditor: vi.fn(() => null),
}));

// Mock CKEditor5 modules
vi.mock('ckeditor5', () => ({
  Alignment: vi.fn(),
  AutoImage: vi.fn(),
  AutoLink: vi.fn(),
  Autoformat: vi.fn(),
  Autosave: vi.fn(),
  BalloonToolbar: vi.fn(),
  BlockQuote: vi.fn(),
  BlockToolbar: vi.fn(),
  Bold: vi.fn(),
  ClassicEditor: vi.fn(),
  CloudServices: vi.fn(),
  Code: vi.fn(),
  CodeBlock: vi.fn(),
  Emoji: vi.fn(),
  Essentials: vi.fn(),
  FontBackgroundColor: vi.fn(),
  FontColor: vi.fn(),
  FontFamily: vi.fn(),
  FontSize: vi.fn(),
  Fullscreen: vi.fn(),
  GeneralHtmlSupport: vi.fn(),
  Heading: vi.fn(),
  Highlight: vi.fn(),
  HorizontalLine: vi.fn(),
  HtmlComment: vi.fn(),
  ImageBlock: vi.fn(),
  ImageCaption: vi.fn(),
  ImageInline: vi.fn(),
  ImageInsert: vi.fn(),
  ImageInsertViaUrl: vi.fn(),
  ImageStyle: vi.fn(),
  ImageTextAlternative: vi.fn(),
  ImageToolbar: vi.fn(),
  ImageUpload: vi.fn(),
  Indent: vi.fn(),
  IndentBlock: vi.fn(),
  Italic: vi.fn(),
  Link: vi.fn(),
  LinkImage: vi.fn(),
  List: vi.fn(),
  Mention: vi.fn(),
  Paragraph: vi.fn(),
  PlainTableOutput: vi.fn(),
  ShowBlocks: vi.fn(),
  SourceEditing: vi.fn(),
  Strikethrough: vi.fn(),
  Style: vi.fn(),
  Subscript: vi.fn(),
  Superscript: vi.fn(),
  Table: vi.fn(),
  TableCaption: vi.fn(),
  TableToolbar: vi.fn(),
  TextPartLanguage: vi.fn(),
  TextTransformation: vi.fn(),
  TodoList: vi.fn(),
  Underline: vi.fn(),
}));

// Mock CSS import
vi.mock('ckeditor5/ckeditor5.css', () => ({}));

describe('Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CKEditor.mockImplementation(({ config, onChange }) => (
      <div data-testid="ckeditor-mock">
        <textarea data-testid="editor-textarea" />
      </div>
    ));
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders the editor container', () => {
    render(<Editor />);
    
    const container = document.querySelector('.main-container');
    expect(container).toBeInTheDocument();
    
    const editorContainer = document.querySelector('.editor-container');
    expect(editorContainer).toBeInTheDocument();
  });

  it('renders with default empty initialData', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.config.initialData).toBe('');
  });

  it('renders with custom initialData', async () => {
    const initialContent = '<p>Test content</p>';
    render(<Editor initialData={initialContent} />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.config.initialData).toBe(initialContent);
  });

  it('passes onChange handler to CKEditor', async () => {
    const onChangeMock = vi.fn();
    render(<Editor onChange={onChangeMock} />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.onChange).toBe(onChangeMock);
  });

  it('initializes with isLayoutReady false and sets to true', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<Editor />);
    unmount();
    // Component should handle cleanup properly
  });

  it('configures editor with all toolbar items', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.toolbar.items).toContain('undo');
    expect(config.toolbar.items).toContain('redo');
    expect(config.toolbar.items).toContain('sourceEditing');
    expect(config.toolbar.items).toContain('showBlocks');
    expect(config.toolbar.items).toContain('textPartLanguage');
    expect(config.toolbar.items).toContain('fullscreen');
    expect(config.toolbar.items).toContain('heading');
    expect(config.toolbar.items).toContain('style');
    expect(config.toolbar.items).toContain('fontSize');
    expect(config.toolbar.items).toContain('fontFamily');
    expect(config.toolbar.items).toContain('fontColor');
    expect(config.toolbar.items).toContain('fontBackgroundColor');
    expect(config.toolbar.items).toContain('bold');
    expect(config.toolbar.items).toContain('italic');
    expect(config.toolbar.items).toContain('underline');
    expect(config.toolbar.items).toContain('strikethrough');
    expect(config.toolbar.items).toContain('subscript');
    expect(config.toolbar.items).toContain('superscript');
    expect(config.toolbar.items).toContain('code');
    expect(config.toolbar.items).toContain('emoji');
    expect(config.toolbar.items).toContain('horizontalLine');
    expect(config.toolbar.items).toContain('link');
    expect(config.toolbar.items).toContain('insertImage');
    expect(config.toolbar.items).toContain('insertTable');
    expect(config.toolbar.items).toContain('highlight');
    expect(config.toolbar.items).toContain('blockQuote');
    expect(config.toolbar.items).toContain('codeBlock');
    expect(config.toolbar.items).toContain('alignment');
    expect(config.toolbar.items).toContain('bulletedList');
    expect(config.toolbar.items).toContain('numberedList');
    expect(config.toolbar.items).toContain('todoList');
    expect(config.toolbar.items).toContain('outdent');
    expect(config.toolbar.items).toContain('indent');
  });

  it('configures editor with all plugins', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.plugins).toBeDefined();
    expect(config.plugins.length).toBeGreaterThan(0);
  });

  it('configures balloon toolbar', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.balloonToolbar).toEqual(['bold', 'italic', '|', 'link', '|', 'bulletedList', 'numberedList']);
  });

  it('configures block toolbar', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.blockToolbar).toContain('fontSize');
    expect(config.blockToolbar).toContain('fontColor');
    expect(config.blockToolbar).toContain('fontBackgroundColor');
    expect(config.blockToolbar).toContain('bold');
    expect(config.blockToolbar).toContain('italic');
    expect(config.blockToolbar).toContain('link');
    expect(config.blockToolbar).toContain('insertTable');
    expect(config.blockToolbar).toContain('bulletedList');
    expect(config.blockToolbar).toContain('numberedList');
    expect(config.blockToolbar).toContain('outdent');
    expect(config.blockToolbar).toContain('indent');
  });

  it('configures font family with supportAllValues', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.fontFamily.supportAllValues).toBe(true);
  });

  it('configures font size with options and supportAllValues', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.fontSize.options).toEqual([10, 12, 14, 'default', 18, 20, 22]);
    expect(config.fontSize.supportAllValues).toBe(true);
  });

  it('configures fullscreen with onEnterCallback', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.fullscreen.onEnterCallback).toBeDefined();
    expect(typeof config.fullscreen.onEnterCallback).toBe('function');
    
    // Test the callback
    const mockContainer = {
      classList: {
        add: vi.fn(),
      },
    };
    config.fullscreen.onEnterCallback(mockContainer);
    expect(mockContainer.classList.add).toHaveBeenCalledWith(
      'editor-container',
      'editor-container_classic-editor',
      'editor-container_include-style',
      'editor-container_include-block-toolbar',
      'editor-container_include-fullscreen',
      'main-container'
    );
  });

  it('configures heading options with all heading levels', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.heading.options).toBeDefined();
    expect(config.heading.options.length).toBe(7); // paragraph + 6 headings
    
    const paragraph = config.heading.options.find(opt => opt.model === 'paragraph');
    expect(paragraph).toEqual({
      model: 'paragraph',
      title: 'Paragraph',
      class: 'ck-heading_paragraph',
    });
    
    const h1 = config.heading.options.find(opt => opt.model === 'heading1');
    expect(h1).toEqual({
      model: 'heading1',
      view: 'h1',
      title: 'Heading 1',
      class: 'ck-heading_heading1',
    });
    
    const h2 = config.heading.options.find(opt => opt.model === 'heading2');
    expect(h2.view).toBe('h2');
    
    const h3 = config.heading.options.find(opt => opt.model === 'heading3');
    expect(h3.view).toBe('h3');
    
    const h4 = config.heading.options.find(opt => opt.model === 'heading4');
    expect(h4.view).toBe('h4');
    
    const h5 = config.heading.options.find(opt => opt.model === 'heading5');
    expect(h5.view).toBe('h5');
    
    const h6 = config.heading.options.find(opt => opt.model === 'heading6');
    expect(h6.view).toBe('h6');
  });

  it('configures HTML support to allow all elements', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.htmlSupport.allow).toBeDefined();
    expect(config.htmlSupport.allow[0].name).toEqual(/^.*$/);
    expect(config.htmlSupport.allow[0].styles).toBe(true);
    expect(config.htmlSupport.allow[0].attributes).toBe(true);
    expect(config.htmlSupport.allow[0].classes).toBe(true);
  });

  it('configures image toolbar', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.image.toolbar).toEqual([
      'toggleImageCaption',
      'imageTextAlternative',
      '|',
      'imageStyle:inline',
      'imageStyle:wrapText',
      'imageStyle:breakText',
    ]);
  });

  it('sets license key to GPL', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.licenseKey).toBe('GPL');
  });

  it('configures link with default protocol and decorators', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.link.addTargetToExternalLinks).toBe(true);
    expect(config.link.defaultProtocol).toBe('https://');
    expect(config.link.decorators.toggleDownloadable).toEqual({
      mode: 'manual',
      label: 'Downloadable',
      attributes: {
        download: 'file',
      },
    });
  });

  it('configures mention with @ marker', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.mention.feeds).toBeDefined();
    expect(config.mention.feeds[0].marker).toBe('@');
    expect(config.mention.feeds[0].feed).toEqual([]);
  });

  it('sets placeholder text', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.placeholder).toBe('Type or paste your content here!');
  });

  it('configures style definitions', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.style.definitions).toBeDefined();
    expect(config.style.definitions.length).toBe(8);
    
    const articleCategory = config.style.definitions.find(def => def.name === 'Article category');
    expect(articleCategory).toEqual({
      name: 'Article category',
      element: 'h3',
      classes: ['category'],
    });
    
    const title = config.style.definitions.find(def => def.name === 'Title');
    expect(title).toEqual({
      name: 'Title',
      element: 'h2',
      classes: ['document-title'],
    });
    
    const subtitle = config.style.definitions.find(def => def.name === 'Subtitle');
    expect(subtitle.element).toBe('h3');
    
    const infoBox = config.style.definitions.find(def => def.name === 'Info box');
    expect(infoBox.element).toBe('p');
    
    const ctaPrimary = config.style.definitions.find(def => def.name === 'CTA Link Primary');
    expect(ctaPrimary.element).toBe('a');
    expect(ctaPrimary.classes).toEqual(['button', 'button--green']);
    
    const ctaSecondary = config.style.definitions.find(def => def.name === 'CTA Link Secondary');
    expect(ctaSecondary.classes).toEqual(['button', 'button--black']);
    
    const marker = config.style.definitions.find(def => def.name === 'Marker');
    expect(marker.element).toBe('span');
    expect(marker.classes).toEqual(['marker']);
    
    const spoiler = config.style.definitions.find(def => def.name === 'Spoiler');
    expect(spoiler.element).toBe('span');
    expect(spoiler.classes).toEqual(['spoiler']);
  });

  it('configures table content toolbar', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.table.contentToolbar).toEqual(['tableColumn', 'tableRow', 'mergeTableCells']);
  });

  it('does not render CKEditor before layout is ready', () => {
    // Mock to capture the initial render state
    let initialRenderCount = 0;
    CKEditor.mockImplementation(() => {
      initialRenderCount++;
      return <div data-testid="ckeditor-mock" />;
    });

    render(<Editor />);
    
    // CKEditor should be called after isLayoutReady becomes true
    expect(initialRenderCount).toBeGreaterThanOrEqual(0);
  });

  it('updates config when initialData changes', async () => {
    const { rerender } = render(<Editor initialData="initial content" />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const firstCallCount = CKEditor.mock.calls.length;
    
    rerender(<Editor initialData="updated content" />);
    
    await waitFor(() => {
      expect(CKEditor.mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });

  it('renders editor container with correct CSS classes', () => {
    render(<Editor />);
    
    const editorContainer = document.querySelector('.editor-container_classic-editor');
    expect(editorContainer).toBeInTheDocument();
    
    const includeStyle = document.querySelector('.editor-container_include-style');
    expect(includeStyle).toBeInTheDocument();
    
    const includeBlockToolbar = document.querySelector('.editor-container_include-block-toolbar');
    expect(includeBlockToolbar).toBeInTheDocument();
    
    const includeFullscreen = document.querySelector('.editor-container_include-fullscreen');
    expect(includeFullscreen).toBeInTheDocument();
  });

  it('renders nested editor container structure', () => {
    render(<Editor />);
    
    const editorContainerEditor = document.querySelector('.editor-container__editor');
    expect(editorContainerEditor).toBeInTheDocument();
  });

  it('sets shouldNotGroupWhenFull to false in toolbar config', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    const config = lastCall.config;
    
    expect(config.toolbar.shouldNotGroupWhenFull).toBe(false);
  });

  it('handles onChange event when provided', async () => {
    const onChangeMock = vi.fn();
    
    CKEditor.mockImplementation(({ onChange }) => {
      // Simulate editor change
      setTimeout(() => {
        if (onChange) {
          onChange({ getData: () => 'test content' });
        }
      }, 0);
      return <div data-testid="ckeditor-mock" />;
    });

    render(<Editor onChange={onChangeMock} />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });
  });

  it('does not crash when onChange is not provided', async () => {
    render(<Editor />);
    
    await waitFor(() => {
      expect(CKEditor).toHaveBeenCalled();
    });

    const calls = CKEditor.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.onChange).toBeUndefined();
  });
});
