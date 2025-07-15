#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import minimist from 'minimist';
import pkg from '../package.json' with { type: 'json' };
import { YoutubeLoader } from './youtubeloader.js'; // Adjust the import path as necessary
class YoutubeMcpServer {
    constructor() {
        this.server = new McpServer({
            name: pkg.name,
            version: pkg.version,
        });
        this.setupToolHandlers();
        this.setupErrorHandlers();
    }
    setupToolHandlers() {
        this.server.tool('load_video_transcript', 'Load transcript from YouTube URL. example: https://www.youtube.com/watch?v=VIDEO_ID', {
            url: z.string().describe('YouTube video URL'),
            language: z.string().describe('Language code for transcript').default('en'),
        }, async ({ url, language }) => {
            try {
                const loader = YoutubeLoader.createFromUrl(url, {
                    language,
                    addVideoInfo: true,
                });
                const docs = await loader.load();
                return {
                    content: [
                        {
                            type: 'text',
                            text: docs[0].pageContent,
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Failed to load transcript: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    setupErrorHandlers() {
        // Handle process termination gracefully
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
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
${pkg.name}: ${pkg.version}
${pkg.description}

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
            console.error('Provide a YouTube URL as an argument or use --help for more information.');
            process.exit(1);
        }
        const language = args.language;
        try {
            const loader = YoutubeLoader.createFromUrl(url, {
                language,
                addVideoInfo: true,
            });
            const docs = await loader.load();
            console.log(docs[0].metadata.title);
            console.log(docs[0].metadata.description);
            console.log('Transcript:');
            console.log(docs[0].pageContent);
        }
        catch (error) {
            console.error('Error loading transcript:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }
}
main().catch(console.error);
