package com.bspq.e2.performance;

import com.bspq.e2.model.Movie;
import com.bspq.e2.model.UserMovieStatus;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Performance tests for model-level operations.
 * Tests the speed of creating, mutating, and traversing in-memory model objects
 * to ensure that domain logic does not introduce hidden complexity.
 */
@Tag("performance")
class ModelPerformanceTest {

    /**
     * Creating 100 000 Movie objects must complete in under 500ms.
     */
    @Test
    @Timeout(value = 500, unit = TimeUnit.MILLISECONDS)
    void movieCreation_100k_completesQuickly() {
        List<Movie> movies = new ArrayList<>(100_000);
        for (int i = 0; i < 100_000; i++) {
            Movie m = new Movie();
            m.setId((long) i);
            m.setTitle("Movie " + i);
            m.setGenre("Action");
            m.setYear(2000 + (i % 24));
            m.setDuration(90 + (i % 60));
            movies.add(m);
        }
        assertThat(movies).hasSize(100_000);
    }

    /**
     * Running all 7 state transitions on 10 000 UserMovieStatus objects must finish in 1s.
     */
    @Test
    @Timeout(value = 1, unit = TimeUnit.SECONDS)
    void userMovieStatusTransitions_10k_completesWithin1Second() {
        for (int i = 0; i < 10_000; i++) {
            UserMovieStatus s = new UserMovieStatus();
            s.saveForLater();
            s.markAsWatched();
            s.like();
            s.removeLike();
            s.dislike();
            s.removeDislike();
            s.removeFromWatched();
        }
    }

    /**
     * Reading all fields from 50 000 Movie objects must complete in 200ms.
     */
    @Test
    @Timeout(value = 200, unit = TimeUnit.MILLISECONDS)
    void movieFieldAccess_50k_isEfficient() {
        List<Movie> movies = new ArrayList<>(50_000);
        for (int i = 0; i < 50_000; i++) {
            Movie m = new Movie();
            m.setId((long) i);
            m.setTitle("Title " + i);
            m.setGenre("Genre " + (i % 10));
            m.setYear(2000 + (i % 25));
            m.setDuration(80 + (i % 80));
            m.setSynopsis("Synopsis for movie " + i);
            m.setPosterUrl("http://example.com/poster/" + i + ".jpg");
            movies.add(m);
        }

        long totalDuration = 0;
        for (Movie m : movies) {
            totalDuration += m.getDuration();
            // Access all fields to simulate serialization cost
            String ignored = m.getTitle() + m.getGenre() + m.getSynopsis() + m.getPosterUrl();
        }

        assertThat(totalDuration).isPositive();
    }

    /**
     * Setting a note on 10 000 statuses must complete in 200ms.
     */
    @Test
    @Timeout(value = 200, unit = TimeUnit.MILLISECONDS)
    void noteAssignment_10k_isEfficient() {
        for (int i = 0; i < 10_000; i++) {
            UserMovieStatus s = new UserMovieStatus();
            s.setNote("This is my personal note for movie " + i + ". Great film overall.");
        }
    }
}
