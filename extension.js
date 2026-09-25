const vscode = require("vscode");
const { LanguageClient, TransportKind } = require("vscode-languageclient/node");

/** @type {LanguageClient | undefined} */
let client;

function createClient() {
  const config = vscode.workspace.getConfiguration("bear");
  const command = config.get("server.path") || "bearls";
  const args = config.get("server.args") || [];

  const serverOptions = {
    command,
    args,
    transport: TransportKind.stdio,
  };

  const clientOptions = {
    documentSelector: [{ scheme: "file", language: "bear" }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher("**/*.{bear,br}"),
    },
  };

  return new LanguageClient("bear", "Bear Language Server", serverOptions, clientOptions);
}

async function startClient() {
  client = createClient();
  try {
    await client.start();
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to start the Bear language server (bearls). Make sure it is installed and on your PATH, ` +
        `or set "bear.server.path". ${err instanceof Error ? err.message : err}`
    );
  }
}

async function stopClient() {
  if (!client) return;
  const old = client;
  client = undefined;
  await old.dispose();
}

/** @param {vscode.ExtensionContext} context */
async function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("bear.restartServer", async () => {
      await stopClient();
      await startClient();
    }),
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration("bear.server")) {
        await stopClient();
        await startClient();
      }
    })
  );

  await startClient();
}

function deactivate() {
  return stopClient();
}

module.exports = { activate, deactivate };
