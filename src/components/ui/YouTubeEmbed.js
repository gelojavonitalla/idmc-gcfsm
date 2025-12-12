import styles from './YouTubeEmbed.module.css';

/**
 * YouTubeEmbed Component
 * Displays a responsive YouTube video embed using the privacy-enhanced embed URL.
 *
 * @param {Object} props - Component props
 * @param {string} props.videoId - The YouTube video ID
 * @param {string} [props.title] - Optional title for the iframe (accessibility)
 * @returns {JSX.Element} A responsive YouTube embed component
 */
function YouTubeEmbed({ videoId, title = 'YouTube video' }) {
  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  return (
    <div className={styles.container}>
      <iframe
        className={styles.iframe}
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export default YouTubeEmbed;
