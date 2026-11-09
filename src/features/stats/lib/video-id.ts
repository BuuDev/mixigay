/** Real YouTube video ids are exactly 11 characters of [A-Za-z0-9_-]; demo ids are not, so they never become links. */
export const isYoutubeVideoId = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id);
