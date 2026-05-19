package com.bspq.e2.dto;

import java.io.Serializable;

public class UserStatsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private long totalMoviesWatched;
    private long totalWatchTimeMinutes;
    private long likedCount;
    private long dislikedCount;
    private long watchLaterCount;

    public UserStatsDTO() {}

    public UserStatsDTO(long totalMoviesWatched, long totalWatchTimeMinutes,
                        long likedCount, long dislikedCount, long watchLaterCount) {
        this.totalMoviesWatched = totalMoviesWatched;
        this.totalWatchTimeMinutes = totalWatchTimeMinutes;
        this.likedCount = likedCount;
        this.dislikedCount = dislikedCount;
        this.watchLaterCount = watchLaterCount;
    }

    public long getTotalMoviesWatched() {
        return totalMoviesWatched;
    }

    public void setTotalMoviesWatched(long totalMoviesWatched) {
        this.totalMoviesWatched = totalMoviesWatched;
    }

    public long getTotalWatchTimeMinutes() {
        return totalWatchTimeMinutes;
    }

    public void setTotalWatchTimeMinutes(long totalWatchTimeMinutes) {
        this.totalWatchTimeMinutes = totalWatchTimeMinutes;
    }

    public long getLikedCount() {
        return likedCount;
    }

    public void setLikedCount(long likedCount) {
        this.likedCount = likedCount;
    }

    public long getDislikedCount() {
        return dislikedCount;
    }

    public void setDislikedCount(long dislikedCount) {
        this.dislikedCount = dislikedCount;
    }

    public long getWatchLaterCount() {
        return watchLaterCount;
    }

    public void setWatchLaterCount(long watchLaterCount) {
        this.watchLaterCount = watchLaterCount;
    }
}
