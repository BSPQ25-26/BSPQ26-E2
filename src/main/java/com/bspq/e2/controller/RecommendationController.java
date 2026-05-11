package com.bspq.e2.controller;

import com.bspq.e2.model.Movie;
import com.bspq.e2.service.RecommendationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RecommendationController {

    private static final Logger logger = LoggerFactory.getLogger(RecommendationController.class);

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/users/{userId}/recommendations")
    public ResponseEntity<List<Movie>> getUserRecommendations(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "10") int limit) {
        logger.info("Fetching recommendations for user {}", userId);
        return ResponseEntity.ok(recommendationService.getRecommendations(userId, Math.min(limit, 20)));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<Movie>> getGeneralRecommendations(
            @RequestParam(defaultValue = "10") int limit) {
        logger.info("Fetching general recommendations");
        return ResponseEntity.ok(recommendationService.getGeneralRecommendations(Math.min(limit, 20)));
    }
}