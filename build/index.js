#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import minimist from 'minimist';
import pkg from '../package.json' with { type: 'json' };
import { YoutubeLoader } from './youtubeloader.js'; // Adjust the import path as necessary
class YoutubeMcpServer {
    constructor() {
        this.server = new Server({
            name: pkg.name,
            version: pkg.version,
        }, {
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.setupErrorHandlers();
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'load_video_transcript',
                    description: 'Load transcript from YouTube URL. example: https://www.youtube.com/watch?v=VIDEO_ID',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'YouTube video URL'
                            },
                            language: {
                                type: 'string',
                                description: 'Language code for transcript',
                                default: 'en'
                            }
                        },
                        required: ['url']
                    }
                }
            ]
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name === 'load_video_transcript') {
                const { url, language = 'en' } = request.params.arguments;
                const loader = YoutubeLoader.createFromUrl(url, {
                    language,
                    addVideoInfo: true
                });
                const docs = await loader.load();
                return {
                    content: [{
                            type: 'text',
                            text: docs[0].pageContent,
                        }]
                };
            }
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        });
    }
    setupErrorHandlers() {
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        // console.error('YouTube MCP server running on stdio');
    }
}
async function main() {
    const args = minimist(process.argv.slice(2), {
        alias: { h: 'help', l: 'language' },
        boolean: ['mcp', 'help'],
        string: ['language'],
        default: { language: 'en' },
    });
    const helpMessage = `
Usage: youtube-mcp [options] [YouTube URL]

Options:
  --mcp                Run as MCP server.
  -l, --language CODE  Language code for transcript (default: "en").
  -h, --help           Display this help message.

If not in MCP mode, a YouTube URL is required as an argument.
Example:
  youtube-mcp https://www.youtube.com/watch?v=dQw4w9WgXcQ
  youtube-mcp --mcp
  youtube-mcp -l fr https://www.youtube.com/watch?v=dQw4w9WgXcQ
`;
    if (args.help) {
        console.log(helpMessage);
        process.exit(0);
    }
    if (args.mcp) {
        const server = new YoutubeMcpServer();
        server.run().catch(console.error);
    }
    else {
        const url = args._[0];
        if (!url) {
            console.error('Please provide a YouTube URL as an argument or use --help for more information.');
            console.log(helpMessage); // Show help if no URL and not MCP mode
            process.exit(1);
        }
        const language = args.language;
        const originalConsoleWarn = console.warn;
        const originalConsoleError = console.error;
        // Temporarily silence console output
        console.warn = console.error = () => { };
        try {
            const loader = YoutubeLoader.createFromUrl(url, {
                language,
                addVideoInfo: true,
            });
            const docs = await loader.load();
            console.log(docs[0].pageContent);
        }
        catch (error) {
            console.error('Error loading transcript:', error);
            process.exit(1);
        }
        finally {
            console.warn = originalConsoleWarn;
            console.error = originalConsoleError;
        }
    }
}
main().catch(console.error);
