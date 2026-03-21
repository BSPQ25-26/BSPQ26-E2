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
        return statusRepository.findByUserIdAndWatchLaterTrue(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Mark as Watched
    public MovieStatusDTO markAsWatched(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.markAsWatched();
        return toDTO(statusRepository.save(status));
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

    public MovieStatusDTO removeDislike(Long userId, Long movieId) {
        UserMovieStatus status = getOrCreate(userId, movieId);
        status.removeDislike();
        return toDTO(statusRepository.save(status));
    }

    @Transactional(readOnly = true)
    public MovieStatusDTO getStatus(Long userId, Long movieId) {
        return statusRepository.findByUserIdAndMovieId(userId, movieId)
                .map(this::toDTO)
                .orElse(new MovieStatusDTO(movieId, false, false, false, false));
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
                s.isDisliked()
        );
    }
}
