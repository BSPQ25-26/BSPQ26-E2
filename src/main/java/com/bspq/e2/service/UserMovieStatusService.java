package com.bspq.e2.service;

import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.model.Movie;
import com.bspq.e2.model.User;
import com.bspq.e2.model.UserMovieStatus;
import com.bspq.e2.repository.MovieRepository;
import com.bspq.e2.repository.UserMovieStatusRepository;
import com.bspq.e2.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserMovieStatusService {

    private static final int MAX_NOTE_LENGTH = 1000;

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
}
