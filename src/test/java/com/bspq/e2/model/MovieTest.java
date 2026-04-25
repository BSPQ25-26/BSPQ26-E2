package com.bspq.e2.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MovieTest {

    private Movie movie(Long id, String title, String genre, int year, int duration, String synopsis, String posterUrl) {
        Movie m = new Movie();
        m.setId(id);
        m.setTitle(title);
        m.setGenre(genre);
        m.setYear(year);
        m.setDuration(duration);
        m.setSynopsis(synopsis);
        m.setPosterUrl(posterUrl);
        return m;
    }

    @Test
    void movieFields_areStoredAndRetrievedCorrectly() {
        Movie m = movie(1L, "Inception", "Sci-Fi", 2010, 148, "A mind-bending thriller", "http://poster.jpg");

        assertThat(m.getId()).isEqualTo(1L);
        assertThat(m.getTitle()).isEqualTo("Inception");
        assertThat(m.getGenre()).isEqualTo("Sci-Fi");
        assertThat(m.getYear()).isEqualTo(2010);
        assertThat(m.getDuration()).isEqualTo(148);
        assertThat(m.getSynopsis()).isEqualTo("A mind-bending thriller");
        assertThat(m.getPosterUrl()).isEqualTo("http://poster.jpg");
    }

    @Test
    void movieTitle_canBeUpdated() {
        Movie m = new Movie();
        m.setTitle("Original Title");
        m.setTitle("Updated Title");

        assertThat(m.getTitle()).isEqualTo("Updated Title");
    }

    @Test
    void movieGenre_canBeNull() {
        Movie m = new Movie();
        m.setGenre(null);

        assertThat(m.getGenre()).isNull();
    }

    @Test
    void moviePosterUrl_canBeUpdated() {
        Movie m = new Movie();
        m.setPosterUrl("http://old.jpg");
        m.setPosterUrl("http://new.jpg");

        assertThat(m.getPosterUrl()).isEqualTo("http://new.jpg");
    }

    @Test
    void movieYear_defaultsToZero() {
        Movie m = new Movie();

        assertThat(m.getYear()).isEqualTo(0);
    }

    @Test
    void movieDuration_defaultsToZero() {
        Movie m = new Movie();

        assertThat(m.getDuration()).isEqualTo(0);
    }

    @Test
    void movieSynopsis_canBeEmpty() {
        Movie m = new Movie();
        m.setSynopsis("");

        assertThat(m.getSynopsis()).isEmpty();
    }

    @Test
    void twoMovies_withDifferentIds_areDistinct() {
        Movie a = movie(1L, "Movie A", "Action", 2020, 90, "Synopsis A", null);
        Movie b = movie(2L, "Movie B", "Drama", 2021, 120, "Synopsis B", null);

        assertThat(a.getId()).isNotEqualTo(b.getId());
        assertThat(a.getTitle()).isNotEqualTo(b.getTitle());
    }
}
