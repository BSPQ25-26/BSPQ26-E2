package com.bspq.e2.rmi;

import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.dto.UserStatsDTO;
import com.bspq.e2.model.Movie;

import java.rmi.Remote;
import java.rmi.RemoteException;
import java.util.List;
import java.util.Map;

/**
 * @brief Remote contract for MovieTrakk operations.
 *
 * This interface documents the stable RMI boundary for the application. The
 * current production adapter is REST, but the methods mirror the public remote
 * use cases so Doxygen can generate the requested interface documentation.
 */
public interface MovieTrakkRmi extends Remote {

    /**
     * @brief Registers a standard user account.
     *
     * @param username unique username used for login and session resolution.
     * @param email contact email stored with the account.
     * @param password raw password that the server hashes before persistence.
     * @return the created user identifier.
     * @throws RemoteException if the remote call fails or the username already exists.
     */
    Long registerUser(String username, String email, String password) throws RemoteException;

    /**
     * @brief Authenticates a user and returns session metadata.
     *
     * @param username username submitted by the client.
     * @param password raw password submitted by the client.
     * @return a map containing message, userId, username and role.
     * @throws RemoteException if credentials are invalid or the remote call fails.
     */
    Map<String, Object> login(String username, String password) throws RemoteException;

    /**
     * @brief Resolves the numeric user id for an existing username.
     *
     * @param username username to resolve.
     * @return a map containing userId, username and role.
     * @throws RemoteException if the user does not exist or the remote call fails.
     */
    Map<String, Object> resolveUser(String username) throws RemoteException;

    /**
     * @brief Finds movies using optional catalog filters.
     *
     * @param title optional title filter.
     * @param genre optional exact genre filter; use null or "all" for every genre.
     * @param year optional release year filter.
     * @return movies that match all provided filters.
     * @throws RemoteException if catalog data cannot be read.
     */
    List<Movie> findMovies(String title, String genre, Integer year) throws RemoteException;

    /**
     * @brief Loads a single movie by id.
     *
     * @param movieId movie identifier.
     * @return the matching movie, or null when no movie exists for the id.
     * @throws RemoteException if the remote lookup fails.
     */
    Movie getMovieById(Long movieId) throws RemoteException;

    /**
     * @brief Creates a movie in the catalog.
     *
     * @param movie movie payload to persist.
     * @param role caller role; only ADMIN is accepted.
     * @return the saved movie with its generated id.
     * @throws RemoteException if the caller is not an admin or persistence fails.
     */
    Movie createMovie(Movie movie, String role) throws RemoteException;

    /**
     * @brief Updates an existing movie.
     *
     * @param movieId movie identifier.
     * @param movie replacement movie data.
     * @param role caller role; only ADMIN is accepted.
     * @return the updated movie.
     * @throws RemoteException if the caller is not an admin, the movie is missing or persistence fails.
     */
    Movie updateMovie(Long movieId, Movie movie, String role) throws RemoteException;

    /**
     * @brief Deletes a movie from the catalog.
     *
     * @param movieId movie identifier.
     * @param role caller role; only ADMIN is accepted.
     * @return true when the movie was deleted.
     * @throws RemoteException if the caller is not an admin, the movie is missing or deletion fails.
     */
    boolean deleteMovie(Long movieId, String role) throws RemoteException;

    /**
     * @brief Reads the current tracking state for one user/movie pair.
     *
     * @param userId owner of the personal status.
     * @param movieId movie identifier.
     * @return status flags and note for the movie.
     * @throws RemoteException if status data cannot be read.
     */
    MovieStatusDTO getStatus(Long userId, Long movieId) throws RemoteException;

    /**
     * @brief Saves a movie into the user's watch-later list.
     *
     * @param userId owner of the personal list.
     * @param movieId movie identifier.
     * @return updated movie status.
     * @throws RemoteException if the user or movie cannot be updated.
     */
    MovieStatusDTO saveForLater(Long userId, Long movieId) throws RemoteException;

    /**
     * @brief Removes a movie from the user's watch-later list.
     *
     * @param userId owner of the personal list.
     * @param movieId movie identifier.
     * @return updated movie status.
     * @throws RemoteException if the user or movie cannot be updated.
     */
    MovieStatusDTO removeFromWatchLater(Long userId, Long movieId) throws RemoteException;

    /**
     * @brief Marks a movie as watched and clears watch-later state.
     *
     * @param userId owner of the personal status.
     * @param movieId movie identifier.
     * @return updated movie status.
     * @throws RemoteException if the user or movie cannot be updated.
     */
    MovieStatusDTO markAsWatched(Long userId, Long movieId) throws RemoteException;

    /**
     * @brief Removes the watched flag from a movie.
     *
     * @param userId owner of the personal status.
     * @param movieId movie identifier.
     * @return updated movie status.
     * @throws RemoteException if the user or movie cannot be updated.
     */
    MovieStatusDTO removeFromWatched(Long userId, Long movieId) throws RemoteException;

    /**
     * @brief Likes a movie and clears any dislike flag.
     *
     * @param userId owner of the personal preference.
     * @param movieId movie identifier.
     * @return updated movie status.
     * @throws RemoteException if the preference cannot be updated.
     */
    MovieStatusDTO likeMovie(Long userId, Long movieId) throws RemoteException;

    /**
     * @brief Dislikes a movie and clears any like flag.
     *
     * @param userId owner of the personal preference.
     * @param movieId movie identifier.
     * @return updated movie status.
     * @throws RemoteException if the preference cannot be updated.
     */
    MovieStatusDTO dislikeMovie(Long userId, Long movieId) throws RemoteException;

    /**
     * @brief Stores or clears a personal note for a movie.
     *
     * @param userId owner of the note.
     * @param movieId movie identifier.
     * @param note note text; null clears the note.
     * @return updated movie status.
     * @throws RemoteException if the note cannot be persisted.
     */
    MovieStatusDTO updateNote(Long userId, Long movieId, String note) throws RemoteException;

    /**
     * @brief Lists recommended movies for a user.
     *
     * @param userId user whose liked movies drive recommendations.
     * @return untracked movies ranked by similarity to liked titles.
     * @throws RemoteException if recommendations cannot be computed.
     */
    List<Movie> getRecommendations(Long userId) throws RemoteException;

    /**
     * @brief Computes personal activity statistics.
     *
     * @param userId owner of the activity data.
     * @return watched count, watch time, likes, dislikes and watch-later totals.
     * @throws RemoteException if stats cannot be computed.
     */
    UserStatsDTO getUserStats(Long userId) throws RemoteException;
}
