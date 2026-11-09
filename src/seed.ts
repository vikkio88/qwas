export type SeedCommand = {
  command: string;
  description: string;
  tags: string[];
};

export const SEED_COMMANDS: SeedCommand[] = [
  {
    command: "du -h .",
    description: "get the size of the current folder",
    tags: ["disk", "size", "file"],
  },
  {
    command: "du -sh * | sort -rh",
    description: "list sizes of everything in the current folder, biggest first",
    tags: ["disk", "size", "file"],
  },
  {
    command: "df -h /media/stuff",
    description: "check free space on a mounted drive",
    tags: ["disk", "space", "free", "media"],
  },
  {
    command: "df -h",
    description: "check free space on all mounted drives",
    tags: ["disk", "space", "free"],
  },
  {
    command: "ffmpeg -i input.mp4 -vcodec libx264 -crf 23 output.mp4",
    description: "compress a video with ffmpeg",
    tags: ["ffmpeg", "video", "compress"],
  },
  {
    command: "ffmpeg -i input.mp4 output.gif",
    description: "convert a video to a gif with ffmpeg",
    tags: ["ffmpeg", "video", "gif", "convert"],
  },
  {
    command: "ffmpeg -i input.mp4 -vn -acodec copy output.aac",
    description: "extract audio from a video with ffmpeg",
    tags: ["ffmpeg", "audio", "video", "extract"],
  },
  {
    command: "convert input.jpg -resize 50% output.jpg",
    description: "resize an image to 50% with imagemagick",
    tags: ["imagemagick", "image", "resize"],
  },
  {
    command: "convert input.png -quality 80 output.jpg",
    description: "convert an image and compress it with imagemagick",
    tags: ["imagemagick", "image", "compress", "convert"],
  },
  {
    command: "mogrify -resize 1920x1080 -path ./resized *.jpg",
    description: "batch resize all jpgs in a folder with imagemagick",
    tags: ["imagemagick", "image", "resize", "batch"],
  },
];
