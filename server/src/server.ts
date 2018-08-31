import {
	createConnection, TextDocuments, ProposedFeatures, TextDocumentSyncKind, RequestHandler, InitializeParams, InitializeError, InitializeResult, ServerCapabilities
} from 'vscode-languageserver';

// import { initNimSuggest, setNimSuggester} from './nimSuggestExec';
import { NimCompletionItemProvider } from './nimSuggest';
// import { NimDefinitionProvider } from './nimDeclaration';
// import { NimReferenceProvider } from './nimReferences';
// import { NimHoverProvider } from './nimHover';
// import { NimDocumentSymbolProvider, NimWorkspaceSymbolProvider } from './nimOutline';
// import * as indexer from './nimIndexer';
// import { NimSignatureHelpProvider } from './nimSignature';
// import { NimFormattingProvider } from './nimFormatting';
// import { check, ICheckResult } from './nimBuild';
// import { NIM_MODE } from './nimMode';
// import { showHideStatus, showNimVer } from './nimStatus';
// import { getDirtyFile } from './nimUtils';
// Creates the LSP connection
let connection = createConnection(ProposedFeatures.all);

// Create a manager for open text documents
let documents = new TextDocuments();

// The workspace folder this server is operating on
let workspaceFolder: string;

documents.onDidOpen((event) => {
	
	connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Document opened: ${event.document.uri}`);
	
// 	vscode.languages.registerWorkspaceSymbolProvider(new NimWorkspaceSymbolProvider());
// vscode.languages.registerCompletionItemProvider(NIM_MODE, new NimCompletionItemProvider(), '.', ' ');
// vscode.languages.registerDefinitionProvider(NIM_MODE, new NimDefinitionProvider());
// vscode.languages.registerReferenceProvider(NIM_MODE, new NimReferenceProvider());
// vscode.languages.registerDocumentSymbolProvider(NIM_MODE, new NimDocumentSymbolProvider());
// vscode.languages.registerSignatureHelpProvider(NIM_MODE, new NimSignatureHelpProvider(), '(', ',');
// vscode.languages.registerHoverProvider(NIM_MODE, new NimHoverProvider());
// vscode.languages.registerDocumentFormattingEditProvider(NIM_MODE, new NimFormattingProvider());
})

documents.listen(connection);

// let initializeHandler: RequestHandler<InitializeParams, InitializeResult, InitializeError> | undefined = undefined;

connection.onInitialize((params: InitializeParams) => {
	console.log("server init")
	workspaceFolder = params.rootUri;
	connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Started and initialize received`);
	let capabilities: ServerCapabilities ={
			"documentSymbolProvider":true,
			"completionProvider":{"triggerCharacters":[ '.', ' ']},
			"definitionProvider":true,
			"referencesProvider":true,
			"workspaceSymbolProvider":true,
			"signatureHelpProvider":{"triggerCharacters":['(', ',']},
			"hoverProvider":true,
			"documentFormattingProvider":true,
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.None
			}
		};
	return {
		capabilities: capabilities
	}
});


connection.listen();