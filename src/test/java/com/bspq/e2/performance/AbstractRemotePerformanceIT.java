package com.bspq.e2.performance;

import com.bspq.e2.App;
import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.model.Movie;
import org.databene.contiperf.junit.ContiPerfRule;
import org.databene.contiperf.report.CSVInvocationReportModule;
import org.databene.contiperf.report.CSVLatencyReportModule;
import org.databene.contiperf.report.CSVSummaryReportModule;
import org.databene.contiperf.report.HtmlReportModule;
import org.junit.Rule;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = App.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("performance")
public abstract class AbstractRemotePerformanceIT {

    @Rule
    public ContiPerfRule contiPerfRule = new ContiPerfRule(
            new HtmlReportModule(),
            new CSVSummaryReportModule(),
            new CSVInvocationReportModule(),
            new CSVLatencyReportModule()
    );

    @LocalServerPort
    protected int port;

    @Autowired
    protected TestRestTemplate restTemplate;

    protected void assertCatalogRequestWorks() {
        ResponseEntity<Movie[]> response = restTemplate.getForEntity(url("/api/movies"), Movie[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSizeGreaterThanOrEqualTo(3);
    }

    protected void assertMovieLookupWorks(long movieId) {
        ResponseEntity<Movie> response = restTemplate.getForEntity(url("/api/movies/" + movieId), Movie.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(movieId);
    }

    protected void assertStatusLookupWorks(long userId, long movieId) {
        ResponseEntity<MovieStatusDTO> response = restTemplate.getForEntity(
                url("/api/users/" + userId + "/movies/" + movieId + "/status"),
                MovieStatusDTO.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMovieId()).isEqualTo(movieId);
    }

    protected void assertNoteUpdateWorks(long userId, long movieId, String note) {
        HttpEntity<Map<String, String>> request = new HttpEntity<>(Map.of("note", note));
        ResponseEntity<MovieStatusDTO> response = restTemplate.exchange(
                url("/api/users/" + userId + "/movies/" + movieId + "/status/note"),
                HttpMethod.PUT,
                request,
                MovieStatusDTO.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getNote()).isEqualTo(note);
    }

    protected String url(String path) {
        return "http://localhost:" + port + path;
    }
}
