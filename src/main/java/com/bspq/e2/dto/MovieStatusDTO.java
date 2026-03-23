package com.bspq.e2.dto;

public class MovieStatusDTO {

    private Long movieId;
    private boolean watchLater;
    private boolean watched;
    private boolean liked;
    private boolean disliked;

    public MovieStatusDTO() {}

    public MovieStatusDTO(Long movieId, boolean watchLater, boolean watched,
                        boolean liked, boolean disliked) {
        this.movieId = movieId;
        this.watchLater = watchLater;
        this.watched = watched;
        this.liked = liked;
        this.disliked = disliked;
    }

    public Long getMovieId()          { return movieId; }
    public boolean isWatchLater()     { return watchLater; }
    public boolean isWatched()        { return watched; }
    public boolean isLiked()          { return liked; }
    public boolean isDisliked()       { return disliked; }

    public void setMovieId(Long movieId)       { this.movieId = movieId; }
    public void setWatchLater(boolean w)       { this.watchLater = w; }
    public void setWatched(boolean w)          { this.watched = w; }
    public void setLiked(boolean l)            { this.liked = l; }
    public void setDisliked(boolean d)         { this.disliked = d; }
}