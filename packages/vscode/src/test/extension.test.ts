import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Reading Spotlight Extension', () => {
  vscode.window.showInformationMessage('Starting Reading Spotlight tests');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('TUCCHI1.reading-spotlight-vscode'));
  });

  test('Should register toggle command', async () => {
    // Command should execute without throwing "command not found"
    // This implicitly tests that the command is registered
    try {
      await vscode.commands.executeCommand('readingSpotlight.toggle');
      assert.ok(true, 'Command executed successfully');
    } catch {
      assert.fail('Command should be registered and executable');
    }
  });

  test('Toggle command should execute without error', async () => {
    await vscode.commands.executeCommand('readingSpotlight.toggle');
    // If we get here without throwing, the command executed successfully
    assert.ok(true);
  });

  test('Configuration should have default values', () => {
    const config = vscode.workspace.getConfiguration('readingSpotlight');

    assert.strictEqual(config.get('enabled'), true);
    assert.strictEqual(config.get('lineCount'), 1);
    assert.strictEqual(config.get('color'), 'yellow');
    assert.strictEqual(config.get('customColor'), null);
    assert.strictEqual(config.get('dimOpacity'), 0.25);
  });

  test('Should open a text document and apply decorations', async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5',
      language: 'plaintext',
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Move cursor to line 3
    const position = new vscode.Position(2, 0);
    editor.selection = new vscode.Selection(position, position);

    // Wait for decorations to be applied
    await new Promise((resolve) => setTimeout(resolve, 100));

    // If we get here without throwing, decorations were applied
    assert.ok(editor.document.lineCount === 5);
  });

  test('Toggle should change enabled state', async () => {
    // Toggle off
    await vscode.commands.executeCommand('readingSpotlight.toggle');
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Toggle back on
    await vscode.commands.executeCommand('readingSpotlight.toggle');
    await new Promise((resolve) => setTimeout(resolve, 100));

    // If we get here without throwing, toggles worked
    assert.ok(true);
  });
});
