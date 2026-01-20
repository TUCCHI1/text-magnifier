import * as vscode from 'vscode';
import { PRESET_COLORS, type ColorKey, hexToRgba } from '@reading-spotlight/shared';

interface SpotlightState {
  enabled: boolean;
  spotlightDecoration: vscode.TextEditorDecorationType | null;
  dimDecoration: vscode.TextEditorDecorationType | null;
}

const state: SpotlightState = {
  enabled: true,
  spotlightDecoration: null,
  dimDecoration: null,
};

const getConfig = () => {
  const config = vscode.workspace.getConfiguration('readingSpotlight');
  return {
    enabled: config.get<boolean>('enabled', true),
    lineCount: config.get<number>('lineCount', 1),
    color: config.get<ColorKey>('color', 'yellow'),
    customColor: config.get<string | null>('customColor', null),
    dimOpacity: config.get<number>('dimOpacity', 0.25),
  };
};

const getSpotlightColor = (color: ColorKey, customColor: string | null): string => {
  if (customColor) {
    return hexToRgba(customColor);
  }
  return PRESET_COLORS[color];
};

const createDecorations = () => {
  disposeDecorations();

  const config = getConfig();
  const spotlightColor = getSpotlightColor(config.color, config.customColor);

  state.spotlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: spotlightColor,
    isWholeLine: true,
  });

  state.dimDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: `rgba(0, 0, 0, ${config.dimOpacity})`,
    isWholeLine: true,
  });
};

const disposeDecorations = () => {
  if (state.spotlightDecoration) {
    state.spotlightDecoration.dispose();
    state.spotlightDecoration = null;
  }
  if (state.dimDecoration) {
    state.dimDecoration.dispose();
    state.dimDecoration = null;
  }
};

const clearDecorations = (editor: vscode.TextEditor) => {
  if (state.spotlightDecoration) {
    editor.setDecorations(state.spotlightDecoration, []);
  }
  if (state.dimDecoration) {
    editor.setDecorations(state.dimDecoration, []);
  }
};

const createRange = (line: number) => new vscode.Range(line, 0, line, 0);

const updateDecorations = (editor: vscode.TextEditor) => {
  const config = getConfig();

  if (!config.enabled || !state.enabled) {
    clearDecorations(editor);
    return;
  }

  if (!state.spotlightDecoration || !state.dimDecoration) {
    createDecorations();
  }

  if (!state.spotlightDecoration || !state.dimDecoration) {
    return;
  }

  const cursorLine = editor.selection.active.line;
  const lineCount = config.lineCount;
  const halfLines = Math.floor(lineCount / 2);

  const startLine = Math.max(0, cursorLine - halfLines);
  const endLine = Math.min(editor.document.lineCount - 1, cursorLine + halfLines);

  const spotlightRanges = Array.from({ length: endLine - startLine + 1 }, (_, i) =>
    createRange(startLine + i),
  );

  const dimRanges = Array.from({ length: editor.document.lineCount }, (_, i) => i)
    .filter((i) => i < startLine || i > endLine)
    .map(createRange);

  editor.setDecorations(state.spotlightDecoration, spotlightRanges);
  editor.setDecorations(state.dimDecoration, dimRanges);
};

const getStatusMessage = (enabled: boolean): string => {
  if (enabled) {
    return 'Reading Spotlight: Enabled';
  }
  return 'Reading Spotlight: Disabled';
};

const toggle = () => {
  state.enabled = !state.enabled;

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    if (state.enabled) {
      updateDecorations(editor);
    } else {
      clearDecorations(editor);
    }
  }

  vscode.window.showInformationMessage(getStatusMessage(state.enabled));
};

export const activate = (context: vscode.ExtensionContext) => {
  const config = getConfig();
  state.enabled = config.enabled;

  createDecorations();

  const toggleCommand = vscode.commands.registerCommand('readingSpotlight.toggle', toggle);

  const selectionChangeListener = vscode.window.onDidChangeTextEditorSelection((event) => {
    updateDecorations(event.textEditor);
  });

  const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateDecorations(editor);
    }
  });

  const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('readingSpotlight')) {
      createDecorations();
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        updateDecorations(editor);
      }
    }
  });

  context.subscriptions.push(
    toggleCommand,
    selectionChangeListener,
    activeEditorChangeListener,
    configChangeListener,
  );

  const editor = vscode.window.activeTextEditor;
  if (editor && state.enabled) {
    updateDecorations(editor);
  }
};

export const deactivate = () => {
  disposeDecorations();
};
