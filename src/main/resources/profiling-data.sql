INSERT INTO users (id, username, email, password_hash, role)
VALUES (1, 'perfuser', 'perfuser@example.com', 'seed-password', 'USER');

INSERT INTO movies (id, title, year, genre, duration, synopsis, poster_url)
VALUES
    (1, 'Performance Runner', 2024, 'Sci-Fi', 118, 'Seed movie used for remote performance and profiling checks.', 'https://example.com/posters/performance-runner.jpg'),
    (2, 'Profiling Session', 2023, 'Drama', 104, 'Secondary movie used for local profiling sessions.', 'https://example.com/posters/profiling-session.jpg'),
    (3, 'Load Check', 2025, 'Thriller', 96, 'Additional movie used to keep catalog responses non-trivial.', 'https://example.com/posters/load-check.jpg');

INSERT INTO user_movie_status (
    id,
    user_id,
    movie_id,
    watch_later,
    watched,
    liked,
    disliked,
    note,
    created_at,
    updated_at
)
VALUES
    (1, 1, 1, FALSE, TRUE, TRUE, FALSE, 'Seed note for remote checks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 1, 2, TRUE, FALSE, FALSE, FALSE, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

