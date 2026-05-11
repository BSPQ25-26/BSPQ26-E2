package com.bspq.e2.service;

import com.bspq.e2.model.Movie;
import com.bspq.e2.model.User;
import com.bspq.e2.model.UserMovieStatus;
import com.bspq.e2.repository.MovieRepository;
import com.bspq.e2.repository.UserMovieStatusRepository;
import com.bspq.e2.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationService.class);

    private final UserMovieStatusRepository statusRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    public RecommendationService(UserMovieStatusRepository statusRepository,
                               MovieRepository movieRepository,
                               UserRepository userRepository) {
        this.statusRepository = statusRepository;
        this.movieRepository = movieRepository;
        this.userRepository = userRepository;
    }

    public List<Movie> getRecommendations(Long userId, int limit) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<UserMovieStatus> userStatuses = statusRepository.findByUserId(userId);
        Set<Long> interactedMovieIds = userStatuses.stream()
                .map(status -> status.getMovie().getId())
                .collect(Collectors.toSet());

        Set<String> likedGenres = userStatuses.stream()
                .filter(UserMovieStatus::isLiked)
                .map(status -> status.getMovie().getGenre())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> watchedGenres = userStatuses.stream()
                .filter(UserMovieStatus::isWatched)
                .map(status -> status.getMovie().getGenre())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> preferredGenres = new HashSet<>(likedGenres);
        if (preferredGenres.isEmpty()) {
            preferredGenres = watchedGenres;
        }

        Set<Movie> recommendedMovies = new LinkedHashSet<>();

        // Strategy 1: Genre-based recommendations
        if (!preferredGenres.isEmpty()) {
            List<Movie> genreMovies;
            if (!interactedMovieIds.isEmpty()) {
                genreMovies = movieRepository.findByGenreInAndIdNotIn(
                    new ArrayList<>(preferredGenres), 
                    interactedMovieIds
                );
            } else {
                genreMovies = movieRepository.findByGenreIn(new ArrayList<>(preferredGenres));
            }
            
            genreMovies.stream()
                    .limit(limit / 2)
                    .forEach(recommendedMovies::add);
        }

        // Strategy 2: Collaborative filtering
        if (recommendedMovies.size() < limit) {
            findCollaborativeRecommendations(userId, interactedMovieIds, recommendedMovies, limit);
        }

        // Strategy 3: Popular movies as fallback
        if (recommendedMovies.size() < limit) {
            findPopularRecommendations(interactedMovieIds, recommendedMovies, limit);
        }

        List<Movie> result = recommendedMovies.stream()
                .limit(limit)
                .collect(Collectors.toList());

        logger.info("Generated {} recommendations for user {}", result.size(), userId);
        return result;
    }

    private void findCollaborativeRecommendations(Long userId, Set<Long> userInteractedIds, 
                                                  Set<Movie> recommendations, int limit) {
        List<UserMovieStatus> allStatuses = statusRepository.findByUserIdNot(userId);
        
        Map<Long, Set<Long>> userLikedMovies = new HashMap<>();
        for (UserMovieStatus status : allStatuses) {
            if (status.isLiked()) {
                userLikedMovies
                    .computeIfAbsent(status.getUser().getId(), k -> new HashSet<>())
                    .add(status.getMovie().getId());
            }
        }

        List<UserMovieStatus> currentUserLiked = statusRepository.findByUserIdAndLikedTrue(userId);
        Set<Long> currentUserLikedIds = currentUserLiked.stream()
                .map(s -> s.getMovie().getId())
                .collect(Collectors.toSet());

        Map<Long, Long> recommendedMovieScores = new HashMap<>();
        
        for (Map.Entry<Long, Set<Long>> entry : userLikedMovies.entrySet()) {
            Set<Long> otherUserLikes = entry.getValue();
            
            long commonLikes = otherUserLikes.stream()
                    .filter(currentUserLikedIds::contains)
                    .count();
            
            if (commonLikes > 0) {
                otherUserLikes.stream()
                        .filter(movieId -> !userInteractedIds.contains(movieId))
                        .forEach(movieId -> recommendedMovieScores.merge(movieId, commonLikes, Long::sum));
            }
        }

        recommendedMovieScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(limit - recommendations.size())
                .forEach(entry -> {
                    movieRepository.findById(entry.getKey())
                            .ifPresent(recommendations::add);
                });
    }

    private void findPopularRecommendations(Set<Long> userInteractedIds, 
                                           Set<Movie> recommendations, int limit) {
        List<UserMovieStatus> popularStatuses = statusRepository.findByLikedTrue();
        
        Map<Long, Long> popularityCount = popularStatuses.stream()
                .collect(Collectors.groupingBy(
                    s -> s.getMovie().getId(),
                    Collectors.counting()
                ));

        popularityCount.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .filter(movieId -> !userInteractedIds.contains(movieId))
                .filter(movieId -> recommendations.stream().noneMatch(m -> m.getId().equals(movieId)))
                .limit(limit - recommendations.size())
                .forEach(movieId -> {
                    movieRepository.findById(movieId)
                            .ifPresent(recommendations::add);
                });
    }

    public List<Movie> getGeneralRecommendations(int limit) {
        List<UserMovieStatus> popularStatuses = statusRepository.findByLikedTrue();
        
        Map<Long, Long> popularityCount = popularStatuses.stream()
                .collect(Collectors.groupingBy(
                    s -> s.getMovie().getId(),
                    Collectors.counting()
                ));

        return popularityCount.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> movieRepository.findById(entry.getKey()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }
}