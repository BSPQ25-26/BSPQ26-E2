package com.bspq.e2.service;

import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.dto.UserStatsDTO;
import com.bspq.e2.model.Movie;
import com.bspq.e2.model.User;
import com.bspq.e2.model.UserMovieStatus;
import com.bspq.e2.repository.MovieRepository;
import com.bspq.e2.repository.UserMovieStatusRepository;
import com.bspq.e2.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserMovieStatusService {

    private static final int MAX_NOTE_LENGTH = 1000;
    private static final int MAX_RECOMMENDATIONS = 6;
    private static final int GENRE_MATCH_SCORE = 5;
    private static final int DECADE_MATCH_SCORE = 2;
    private static final int DURATION_MATCH_SCORE = 1;
    private static final int MIN_RECOMMENDATION_SCORE = DECADE_MATCH_SCORE;
    private static final int SIMILAR_DURATION_MINUTES = 20;

    private final UserMovieStatusRepository statusRepository;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;

    public UserMovieStatusService(UserMovieStatusRepository statusRepository,
                                UserRepository userRepository,
                                MovieRepository movieRepository) {
        this.statusRepository = statusRepository;
        this.userRepository = userRepository;
        this.movieRepository = movieRepository;
    }

        // Watch Later
    public MovieStatusDTO saveForLater(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.saveForLater();
        return toDTO(statusRepository.save(status));
    }

        // Remove from Watch Later
    public MovieStatusDTO removeFromWatchLater(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.removeFromWatchLater();
        return toDTO(statusRepository.save(status));
    }

    @Transactional(readOnly = true)
    public List<MovieStatusDTO> getWatchLaterList(Long userId) {
        return statusRepository.findByUserIdAndWatchLaterTrue(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Movie> getWatchLaterMovies(Long userId) {
        return statusRepository.findByUserIdAndWatchLaterTrue(userId).stream()
                .map(UserMovieStatus::getMovie)
                .collect(Collectors.toList());
    }

    // Mark as Watched
    public MovieStatusDTO markAsWatched(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.markAsWatched();
        return toDTO(statusRepository.save(status));
    }

    public MovieStatusDTO removeFromWatched(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.removeFromWatched();
        return toDTO(statusRepository.save(status));
    }

    @Transactional(readOnly = true)
    public List<Movie> getWatchedList(Long userId) {
        return statusRepository.findByUserIdAndWatchedTrue(userId).stream()
                .map(UserMovieStatus::getMovie)
                .collect(Collectors.toList());
    }

    // Like / Dislike
    public MovieStatusDTO likeMovie(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.like();
        return toDTO(statusRepository.save(status));
    }

    public MovieStatusDTO dislikeMovie(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.dislike();
        return toDTO(statusRepository.save(status));
    }

    public MovieStatusDTO removeLike(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.removeLike();
        return toDTO(statusRepository.save(status));
    }

    @Transactional(readOnly = true)
    public List<Movie> getLikedList(Long userId) {
        return statusRepository.findByUserIdAndLikedTrue(userId).stream()
                .map(UserMovieStatus::getMovie)
                .collect(Collectors.toList());
    }

    public MovieStatusDTO removeDislike(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.removeDislike();
        return toDTO(statusRepository.save(status));
    }

    @Transactional(readOnly = true)
    public List<Movie> getDislikedList(Long userId) {
        return statusRepository.findByUserIdAndDislikedTrue(userId).stream()
                .map(UserMovieStatus::getMovie)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MovieStatusDTO getStatus(Long userId, Long movieId) {
        return statusRepository.findByUserIdAndMovieId(userId, movieId)
                .map(this::toDTO)
                .orElse(new MovieStatusDTO(movieId, false, false, false, false, null));
    }

    public MovieStatusDTO updateNote(Long userId, Long movieId, String note) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.setNote(normalizeNote(note));
        return toDTO(statusRepository.save(status));
    }

    @Transactional(readOnly = true)
    public UserStatsDTO getUserStats(Long userId) {
        List<UserMovieStatus> statuses = statusRepository.findByUserId(userId);

        long totalMoviesWatched = statuses.stream()
                .filter(UserMovieStatus::isWatched)
                .count();
        long totalWatchTimeMinutes = statuses.stream()
                .filter(UserMovieStatus::isWatched)
                .map(UserMovieStatus::getMovie)
                .filter(movie -> movie != null)
                .mapToLong(Movie::getDuration)
                .sum();
        long likedCount = statuses.stream()
                .filter(UserMovieStatus::isLiked)
                .count();
        long dislikedCount = statuses.stream()
                .filter(UserMovieStatus::isDisliked)
                .count();
        long watchLaterCount = statuses.stream()
                .filter(UserMovieStatus::isWatchLater)
                .count();

        return new UserStatsDTO(totalMoviesWatched, totalWatchTimeMinutes, likedCount, dislikedCount, watchLaterCount);
    }

    @Transactional(readOnly = true)
    public List<Movie> getRecommendations(Long userId) {
        List<UserMovieStatus> statuses = statusRepository.findByUserId(userId);
        Set<Long> trackedMovieIds = new HashSet<>();
        List<Movie> likedMovies = statuses.stream()
                .filter(UserMovieStatus::isLiked)
                .map(UserMovieStatus::getMovie)
                .filter(movie -> movie != null)
                .toList();

        statuses.forEach(status -> {
            Movie movie = status.getMovie();
            if (movie == null || movie.getId() == null) {
                return;
            }

            trackedMovieIds.add(movie.getId());
        });

        if (likedMovies.isEmpty()) {
            return List.of();
        }

        return movieRepository.findAll().stream()
                .filter(movie -> isRecommendableCandidate(movie, trackedMovieIds))
                .map(movie -> new RecommendationCandidate(movie, recommendationScore(movie, likedMovies)))
                .filter(candidate -> candidate.score() >= MIN_RECOMMENDATION_SCORE)
                .sorted(Comparator
                        .comparingInt(RecommendationCandidate::score)
                        .reversed()
                        .thenComparing(candidate -> normalize(candidate.movie().getTitle()))
                        .thenComparing(candidate -> candidate.movie().getId()))
                .limit(MAX_RECOMMENDATIONS)
                .map(RecommendationCandidate::movie)
                .collect(Collectors.toList());
    }

    private UserMovieStatus getOrCreate(Long userId, Long movieId) {
        return statusRepository.findByUserIdAndMovieId(userId, movieId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
                    Movie movie = movieRepository.findById(movieId)
                            .orElseThrow(() -> new RuntimeException("Movie not found: " + movieId));
                    UserMovieStatus s = new UserMovieStatus();
                    s.setUser(user);
                    s.setMovie(movie);
                    return s;
                });
    }

    private MovieStatusDTO toDTO(UserMovieStatus s) {
        return new MovieStatusDTO(
                s.getMovie().getId(),
                s.isWatchLater(),
                s.isWatched(),
                s.isLiked(),
                s.isDisliked(),
                s.getNote()
        );
    }

    private String normalizeNote(String note) {
        if (note == null) {
            return null;
        }

        String trimmed = note.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (trimmed.length() > MAX_NOTE_LENGTH) {
            throw new IllegalArgumentException("Note must be 1000 characters or less");
        }

        return trimmed;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isRecommendableCandidate(Movie movie, Set<Long> trackedMovieIds) {
        return movie != null && movie.getId() != null && !trackedMovieIds.contains(movie.getId());
    }

    private int recommendationScore(Movie candidate, List<Movie> likedMovies) {
        return likedMovies.stream()
                .mapToInt(likedMovie -> scoreAgainstLikedMovie(candidate, likedMovie))
                .sum();
    }

    private int scoreAgainstLikedMovie(Movie candidate, Movie likedMovie) {
        int score = 0;

        if (hasText(candidate.getGenre())
                && normalize(candidate.getGenre()).equals(normalize(likedMovie.getGenre()))) {
            score += GENRE_MATCH_SCORE;
        }

        if (sameDecade(candidate.getYear(), likedMovie.getYear())) {
            score += DECADE_MATCH_SCORE;
        }

        if (similarDuration(candidate.getDuration(), likedMovie.getDuration())) {
            score += DURATION_MATCH_SCORE;
        }

        return score;
    }

    private boolean sameDecade(int leftYear, int rightYear) {
        return leftYear > 0 && rightYear > 0 && (leftYear / 10) == (rightYear / 10);
    }

    private boolean similarDuration(int leftDuration, int rightDuration) {
        return leftDuration > 0
                && rightDuration > 0
                && Math.abs(leftDuration - rightDuration) <= SIMILAR_DURATION_MINUTES;
    }

    private record RecommendationCandidate(Movie movie, int score) {}
}
