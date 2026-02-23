/**
 * UserAvatar — Single source of truth for all avatar rendering across the app.
 *
 * Installation (run once):
 *   npm install react-avatar
 *
 * How it works:
 *  1. If `src` is provided and loads successfully  → shows the real photo.
 *  2. If `src` is provided but the URL is broken   → react-avatar silently
 *     falls back to the initials avatar (no broken-image icon ever appears).
 *  3. If `src` is null / undefined / empty string  → shows initials avatar
 *     immediately with no network request attempted.
 *
 * Props:
 *  @param {string}  src       - Full image URL from the API (may be empty/null).
 *  @param {string}  name      - User's display name, used to generate initials.
 *  @param {number}  size      - Diameter in pixels (default 40).
 *  @param {boolean} round     - Circular avatar (default true).
 *  @param {string}  color     - Background colour for the initials placeholder.
 *  @param {string}  className - Optional extra CSS classes for the wrapper div.
 */

import React from 'react';
import Avatar from 'react-avatar';

const PRIMARY_COLOR = '#f97316'; // Tailwind orange-500 — matches app's `primary` colour

const UserAvatar = ({
    src,
    name = 'User',
    size = 40,
    round = true,
    color = PRIMARY_COLOR,
    className = '',
}) => {
    // Normalise: treat empty strings the same as undefined so react-avatar
    // skips the network request and renders initials right away.
    const safeSrc = src && src.trim() !== '' ? src : undefined;

    // Normalise: ensure name is never blank so initials are always renderable.
    const safeName = name && name.trim() !== '' ? name.trim() : 'User';

    return (
        <div
            className={`inline-flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
            style={{
                width: size,
                height: size,
                borderRadius: round ? '50%' : undefined,
            }}
            aria-label={`${safeName}'s avatar`}
        >
            <Avatar
                src={safeSrc}
                name={safeName}
                size={String(size)}
                round={round}
                color={color}
                // react-avatar's `maxInitials` keeps two-letter initials for readability
                maxInitials={2}
                // `textSizeRatio` scales the initials text nicely at any size
                textSizeRatio={2.5}
                style={{ display: 'block' }}
            />
        </div>
    );
};

export default UserAvatar;
