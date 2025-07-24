# YouTube MCP Server

This project provides a Model Context Protocol (MCP) server for interacting with YouTube. It allows you to load video transcripts and potentially other YouTube data through the MCP interface. It can also be used as a command-line tool to fetch YouTube video transcripts directly.

## Features

- **MCP Server**: Exposes YouTube functionalities through the Model Context Protocol.
  - `load_video_transcript`: Loads the transcript of a given YouTube video URL.
- **Command-Line Interface (CLI)**: Fetch video transcripts directly from the terminal.

## Prerequisites

- Node.js (version 20.x or higher recommended)
- npm (usually comes with Node.js)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/varlabz/youtube-mcp.git
    cd youtube-mcp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the project:**
    ```bash
    npm run build
    ```

## Usage

### As an MCP Server

To run the application as an MCP server:

```bash
npx -y github:varlabz/youtube-mcp --mcp
```

The server will start and listen for MCP requests on standard input/output.

**Available Tools:**

-   **`load_video_transcript`**: Loads the transcript from a YouTube video.
    -   **Input:**
        -   `url` (string, required): The URL of the YouTube video (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`).
        -   `language` (string, optional, default: `en`): The language code for the transcript (e.g., `en`, `es`, `fr`).
    -   **Output:**
        -   The video transcript as text.

### As a Command-Line Tool

To fetch a YouTube video transcript directly from the command line:

```bash
npx -y github:varlabz/youtube-mcp <YouTube_URL> [options]
```

**Arguments:**

-   `<YouTube_URL>` (required): The full URL of the YouTube video.

**Options:**

-   `-l, --language <CODE>`: Specify the language code for the transcript (e.g., `en`, `fr`). Defaults to `en`.
-   `--title`: Show the video title.
-   `--description`: Show the video description.
-   `--transcript`: Show the transcript.
-   `-h, --help`: Display the help message.

> If none of `--title`, `--description`, or `--transcript` are provided, all are shown by default. If any of these are provided, only the specified ones are shown.

**Examples:**

```bash
# Show all (default)
npx github:varlabz/youtube-mcp https://www.youtube.com/watch?v=dQw4w9WgXcQ

# Fetch transcript in French, only show transcript
npx github:varlabz/youtube-mcp https://www.youtube.com/watch?v=dQw4w9WgXcQ -l fr --transcript

# Show only title and description (no transcript)
npx github:varlabz/youtube-mcp https://www.youtube.com/watch?v=dQw4w9WgXcQ --title --description

# Show only the title
npx github:varlabz/youtube-mcp https://www.youtube.com/watch?v=dQw4w9WgXcQ --title
```

## Development

### Scripts

-   `npm run build`: Compiles the TypeScript code to JavaScript and makes the output executable.
-   `npm test`: (Currently echoes an error, tests need to be implemented)

### Project Structure

-   `src/index.ts`: Main application code (MCP server and CLI logic).
-   `build/`: Compiled JavaScript output.
-   `package.json`: Project metadata and dependencies.
-   `tsconfig.json`: TypeScript compiler configuration.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

ISC
