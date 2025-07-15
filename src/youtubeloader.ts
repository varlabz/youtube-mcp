// extracted from langchainjs youtube loader
// remove dependencies and types that are not used in the code
import { Innertube } from "youtubei.js";

interface YouTubeDocument {
  pageContent: string;
  metadata: VideoMetadata;
}

/**
 * Configuration options for the YoutubeLoader class. Includes properties
 * such as the videoId, language, and addVideoInfo.
 */
interface YoutubeConfig {
  videoId: string;
  language?: string;
  addVideoInfo?: boolean;
}

/**
 * Metadata of a YouTube video. Includes properties such as the source
 * (videoId), description, title, view_count, author, and category.
 */
interface VideoMetadata {
  source: string;
  description?: string;
  title?: string;
  view_count?: number;
  author?: string;
  category?: string;
}

/**
 * A document loader for loading data from YouTube videos. It uses the
 * youtubei.js library to fetch the transcript and video metadata.
 * @example
 * ```typescript
 * const loader = new YoutubeLoader(
 *   "https:
 *   "en",
 *   true,
 * );
 * const docs = await loader.load();
 * ```
 */
export class YoutubeLoader {
  private videoId: string;
  private language?: string;
  private addVideoInfo: boolean;

  constructor(config: YoutubeConfig) {
    this.videoId = config.videoId;
    this.language = config?.language;
    this.addVideoInfo = config?.addVideoInfo ?? false;
  }

  /**
   * Extracts the videoId from a YouTube video URL.
   * @param url The URL of the YouTube video.
   * @returns The videoId of the YouTube video.
   */
  private static getVideoID(url: string): string {
    const match = url.match(
      /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/
    );
    if (match !== null && match[1].length === 11) {
      return match[1];
    } else {
      throw new Error("Failed to get youtube video id from the url");
    }
  }

  /**
   * Creates a new instance of the YoutubeLoader class from a YouTube video
   * URL.
   * @param url The URL of the YouTube video.
   * @param config Optional configuration options for the YoutubeLoader instance, excluding the videoId.
   * @returns A new instance of the YoutubeLoader class.
   */
  static createFromUrl(
    url: string,
    config?: Omit<YoutubeConfig, "videoId">
  ): YoutubeLoader {
    const videoId = YoutubeLoader.getVideoID(url);
    return new YoutubeLoader({ ...config, videoId });
  }

  /**
   * Loads the transcript and video metadata from the specified YouTube
   * video. It uses the youtubei.js library to fetch the video metadata and transcripts.
   * @returns An array of Documents representing the retrieved data.
   */
  async load(): Promise<YouTubeDocument[]> {
    let transcript: string | undefined;
    const metadata: VideoMetadata = {
      source: this.videoId,
    };
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    console.warn = console.error = () => {};
    try {
      const youtube = await Innertube.create({
        lang: this.language,
        retrieve_player: false,
      });
      const info = await youtube.getInfo(this.videoId);
      const transcriptData = await info.getTranscript();
      transcript =
        transcriptData.transcript.content?.body?.initial_segments
          .map((segment) => segment.snippet.text)
          .join(" ") ?? "";
      if (transcript === undefined) {
        throw new Error("Transcription not found");
      }
      if (this.addVideoInfo) {
        const basicInfo = info.basic_info;
        metadata.description = basicInfo.short_description;
        metadata.title = basicInfo.title;
        metadata.view_count = basicInfo.view_count;
        metadata.author = basicInfo.author;
      }
    } catch (e: unknown) {
      throw new Error(
        `Failed to get YouTube video transcription: ${(e as Error).message}`
      );
    } finally {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    }
    const document = {
      pageContent: transcript,
      metadata,
    };
    return [document];
  }
}