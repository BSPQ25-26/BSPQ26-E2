package com.bspq.e2.controller;

import com.bspq.e2.dto.UserStatsDTO;
import com.bspq.e2.service.UserMovieStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class UserStatsController {

    private final UserMovieStatusService statusService;

    public UserStatsController(UserMovieStatusService statusService) {
        this.statusService = statusService;
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsDTO> getStats(
            @RequestParam(required = false) Long userId,
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId) {
        Long resolvedUserId = userId != null ? userId : headerUserId;
        if (resolvedUserId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(statusService.getUserStats(resolvedUserId));
    }
}
