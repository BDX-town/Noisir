import { Media } from '../types/Media';
import { WebdavFile } from '../types/webdav';
import { Blog } from '../types/Blog';

function parseMedia(file: WebdavFile): Media {
    return {
        name: file.basename,
        updatedAt: new Date(file.lastmod),
        weight: file.size,
        url: file.filename,
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchMedia(client: any, blog: Partial<Blog>): Promise<Media[]> {
    const files: WebdavFile[] = await client.getDirectoryContents(`/${blog.name}/ressources`);
    return files.map(parseMedia);
}